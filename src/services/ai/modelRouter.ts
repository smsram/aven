// Model Router & Fallback Coordinator for Aven
// Manages AUTO model selection, capability matching, same-provider credential rotation, and cross-provider fallback
import {
  AIRequest,
  AIResponse,
  ModelInfo,
  AIProviderConfig,
  FallbackEvent,
  NormalizedErrorType,
  ProviderId
} from './types';
import modelRegistry from './modelRegistry';
import credentialManager from './credentialManager';
import { BaseAdapter } from './adapters/BaseAdapter';
import { GeminiAdapter } from './adapters/GeminiAdapter';
import { OpenAIAdapter } from './adapters/OpenAIAdapter';
import { AnthropicAdapter } from './adapters/AnthropicAdapter';
import { CloudflareAdapter } from './adapters/CloudflareAdapter';
import { OllamaAdapter } from './adapters/OllamaAdapter';
import { CustomAdapter } from './adapters/CustomAdapter';

export interface RouteResolution {
  provider: AIProviderConfig;
  model: ModelInfo;
  isAuto: boolean;
  adapter: BaseAdapter;
}

export class ModelRouter {
  private adapters: Map<string, BaseAdapter> = new Map();

  constructor() {
    this.initAdapters();
  }

  private initAdapters() {
    this.adapters.set('gemini', new GeminiAdapter());
    this.adapters.set('openai', new OpenAIAdapter());
    this.adapters.set('anthropic', new AnthropicAdapter());
    this.adapters.set('cloudflare', new CloudflareAdapter());
    this.adapters.set('ollama', new OllamaAdapter());
  }

  public getAdapter(provider: AIProviderConfig): BaseAdapter {
    if (provider.providerType === 'custom' && provider.customConfig) {
      return new CustomAdapter(provider.endpoint || '', provider.customConfig);
    }
    if (provider.providerType === 'ollama' && provider.endpoint) {
      const existing = this.adapters.get('ollama') as OllamaAdapter;
      if (existing) {
        existing.setEndpoint(provider.endpoint);
        return existing;
      }
    }
    const adapter = this.adapters.get(provider.providerType);
    if (!adapter) {
      throw new Error(`No adapter found for provider type "${provider.providerType}"`);
    }
    return adapter;
  }

  /**
   * Evaluates task prompt and requirements to determine complexity and needed capabilities
   */
  public analyzeTaskRequirements(request: AIRequest): {
    needsVision: boolean;
    needsReasoning: boolean;
    needsTools: boolean;
    needsCoding: boolean;
    isHighThroughput: boolean;
  } {
    const hasImages = (request.images && request.images.length > 0) || false;
    const hasTools = (request.tools && request.tools.length > 0) || false;

    // Check prompt keywords for reasoning & coding
    const textContent = request.messages.map(m => m.content).join(' ');
    const isCoding = /code|function|class|typescript|python|bug|refactor|compile|git|repository|component/i.test(textContent);
    const isReasoning = /compare|analyze|evaluate|why|explain in depth|architect|solve|strategy|plan/i.test(textContent);
    const isSimple = textContent.length < 120 && !isCoding && !isReasoning && !hasImages;

    return {
      needsVision: hasImages || !!request.requiredCapabilities?.vision,
      needsReasoning: isReasoning || !!request.requiredCapabilities?.reasoning,
      needsTools: hasTools || !!request.requiredCapabilities?.toolCalling,
      needsCoding: isCoding,
      isHighThroughput: isSimple,
    };
  }

  /**
   * Resolves the best provider and model given configured providers and task requirements
   */
  public resolveRoute(
    request: AIRequest,
    configuredProviders: AIProviderConfig[],
    manualModelId?: string,
    excludedProviderIds: Set<string> = new Set()
  ): RouteResolution | null {
    // Filter active and configured providers
    const usableProviders = configuredProviders
      .filter(p => p.enabled && !excludedProviderIds.has(p.id))
      .filter(p => credentialManager.hasValidCredentials(p.id) || p.providerType === 'ollama')
      .sort((a, b) => a.priority - b.priority);

    if (usableProviders.length === 0) {
      return null;
    }

    // 1. Manual model selection requested (and not 'auto')
    if (manualModelId && manualModelId !== 'auto') {
      for (const provider of usableProviders) {
        const models = modelRegistry.getModelsForProvider(provider.providerType);
        const match = models.find(m => m.id === manualModelId);
        if (match) {
          return {
            provider,
            model: match,
            isAuto: false,
            adapter: this.getAdapter(provider),
          };
        }
      }
    }

    // 2. AUTO Mode: Determine optimal model based on task requirements
    const reqs = this.analyzeTaskRequirements(request);

    for (const provider of usableProviders) {
      const models = modelRegistry.getModelsForProvider(provider.providerType)
        .filter(m => m.enabled && m.availability !== 'local_uninstalled');

      if (models.length === 0) continue;

      // Filter by required capabilities
      let candidates = models;
      if (reqs.needsVision) {
        candidates = candidates.filter(m => m.capabilities.vision);
      }
      if (reqs.needsTools) {
        candidates = candidates.filter(m => m.capabilities.toolCalling);
      }

      if (candidates.length === 0) {
        continue; // Try next provider in priority order
      }

      // Rank candidate models for this provider
      let chosenModel: ModelInfo | undefined;

      if (reqs.needsReasoning) {
        chosenModel = candidates.find(m => m.recommendedFor.includes('reasoning'));
      } else if (reqs.needsCoding) {
        chosenModel = candidates.find(m => m.recommendedFor.includes('coding'));
      } else if (reqs.isHighThroughput) {
        chosenModel = candidates.find(m => m.recommendedFor.includes('fast') || m.recommendedFor.includes('background'));
      }

      if (!chosenModel) {
        // Fall back to general/primary model for this provider
        chosenModel = candidates.find(m => m.tags.includes('Primary')) || candidates[0];
      }

      return {
        provider,
        model: chosenModel,
        isAuto: true,
        adapter: this.getAdapter(provider),
      };
    }

    // Fallback: If no provider perfectly satisfied all filters, pick highest priority active model
    const fallbackProvider = usableProviders[0];
    const fallbackModels = modelRegistry.getModelsForProvider(fallbackProvider.providerType);
    const fallbackModel = fallbackModels[0] || {
      id: fallbackProvider.defaultModelId || 'default',
      providerId: fallbackProvider.providerType,
      displayName: 'Default Model',
      capabilities: { text: true, vision: false, reasoning: false, toolCalling: false, structuredOutput: false, streaming: true, imageGeneration: false, audioInput: false, audioOutput: false, videoInput: false, videoOutput: false },
      enabled: true,
      recommendedFor: ['general'],
      availability: 'available',
      tags: ['General'],
    };

    return {
      provider: fallbackProvider,
      model: fallbackModel,
      isAuto: true,
      adapter: this.getAdapter(fallbackProvider),
    };
  }

  /**
   * Executes request with same-provider credential rotation, limit detection, and cross-provider fallback
   */
  public async execute(
    request: AIRequest,
    configuredProviders: AIProviderConfig[],
    options: {
      manualModelId?: string;
      crossProviderFallbackEnabled?: boolean;
      onFallback?: (event: FallbackEvent) => void;
      onCredentialRotated?: (info: { provider: string; index: number; reason: string }) => void;
    } = {}
  ): Promise<AIResponse> {
    const excludedProviders = new Set<string>();
    let lastErrorType: NormalizedErrorType = 'UNKNOWN_ERROR';
    let lastErrorMessage = '';
    let previousProviderName = '';
    let previousModelName = '';

    while (true) {
      const route = this.resolveRoute(request, configuredProviders, options.manualModelId, excludedProviders);

      if (!route) {
        if (excludedProviders.size > 0 && !options.crossProviderFallbackEnabled) {
          throw new Error(`${previousProviderName || 'Selected provider'} has reached its current limit.`);
        }
        throw new Error(lastErrorMessage || 'No configured and available AI providers found. Please configure a provider in Settings or Connections.');
      }

      const { provider, model, adapter } = route;
      let providerHasCredentialsLeft = true;

      // Attempt execution across credentials of this provider
      while (providerHasCredentialsLeft) {
        // Special case: Ollama doesn't need credentials
        const isOllama = provider.providerType === 'ollama';
        const credInfo = isOllama
          ? { credential: { id: 'local', keyOrToken: '', health: 'ACTIVE' as const, failureCount: 0 }, rawKey: '' }
          : credentialManager.getNextAvailableCredential(provider.id);

        if (!credInfo) {
          providerHasCredentialsLeft = false;
          break;
        }

        const { credential, rawKey, rawAccountId } = credInfo;

        try {
          const response = await adapter.sendRequest(
            request,
            { key: rawKey, accountId: rawAccountId },
            model.id
          );

          // Success: update credential health and provider stats
          if (!isOllama) {
            credentialManager.markSuccess(provider.id, credential.id);
          }
          provider.lastSuccessfulRequest = Date.now();
          provider.status = 'connected';

          response.credentialIdUsed = credential.id;
          return response;
        } catch (err: any) {
          const errType: NormalizedErrorType = err.type || 'UNKNOWN_ERROR';
          const errMsg: string = err.message || 'Request failed';
          lastErrorType = errType;
          lastErrorMessage = errMsg;

          // Check if error is credential-specific limit or failure
          if (errType === 'RATE_LIMITED' || errType === 'QUOTA_EXCEEDED' || errType === 'AUTH_FAILED') {
            if (!isOllama) {
              if (errType === 'RATE_LIMITED' || errType === 'QUOTA_EXCEEDED') {
                credentialManager.markRateLimited(provider.id, credential.id, 300, errMsg);
              } else {
                credentialManager.markFailed(provider.id, credential.id, errType, errMsg);
              }
            }

            // Check if there are other credentials for this same provider
            const nextCred = !isOllama ? credentialManager.getNextAvailableCredential(provider.id) : null;
            if (nextCred && nextCred.credential.id !== credential.id) {
              options.onCredentialRotated?.({
                provider: provider.displayName,
                index: 1,
                reason: errType,
              });
              continue; // Retry with next credential of same provider
            } else {
              // No more credentials available for this provider
              providerHasCredentialsLeft = false;
              break;
            }
          } else {
            // Non-recoverable error (e.g. BAD_REQUEST, syntax error in prompt) -> do not rotate credentials
            throw err;
          }
        }
      }

      // All credentials for current provider failed
      previousProviderName = provider.displayName;
      previousModelName = model.displayName;
      excludedProviders.add(provider.id);

      // Check if cross-provider fallback is enabled
      if (options.crossProviderFallbackEnabled) {
        const nextRoute = this.resolveRoute(request, configuredProviders, undefined, excludedProviders);
        if (nextRoute) {
          const fallbackEvent: FallbackEvent = {
            fromProvider: provider.displayName,
            fromModel: model.displayName,
            toProvider: nextRoute.provider.displayName,
            toModel: nextRoute.model.displayName,
            reason: lastErrorType,
            message: `${provider.displayName} reached its limit, so Aven continued with ${nextRoute.provider.displayName}.`,
            timestamp: Date.now(),
          };
          options.onFallback?.(fallbackEvent);
          continue; // Execute with fallback provider
        }
      }

      // Cross-provider fallback disabled or no other providers configured
      if (!options.crossProviderFallbackEnabled && configuredProviders.filter(p => p.enabled).length > 1) {
        throw new Error(`${provider.displayName} has reached its current limit. Enable "Switch to another AI provider when this provider reaches its limit" in Connections to allow automatic failover.`);
      }

      throw new Error(`${provider.displayName} has reached its current limit.`);
    }
  }
}

export const modelRouter = new ModelRouter();
export default modelRouter;
