// Unified AI Service for Aven Desktop Application
// Bridges settings, credential vault, model registry, adapters, and model router
import {
  AIProviderConfig,
  ProviderId,
  AIRequest,
  AIResponse,
  FallbackEvent,
  ModelInfo
} from './types';
import modelRegistry, { BUILT_IN_MODELS } from './modelRegistry';
import credentialManager from './credentialManager';
import modelRouter from './modelRouter';

const PROVIDERS_STORAGE_KEY = 'aven_ai_providers_v2';
const FALLBACK_SETTING_KEY = 'aven_cross_provider_fallback_v1';

export const INITIAL_DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'provider-gemini',
    displayName: 'Google Gemini',
    providerType: 'gemini',
    enabled: true,
    priority: 1,
    credentials: [],
    defaultModelId: 'auto',
    status: 'not_configured',
  },
  {
    id: 'provider-cloudflare',
    displayName: 'Cloudflare Workers AI',
    providerType: 'cloudflare',
    enabled: true,
    priority: 2,
    credentials: [],
    defaultModelId: 'auto',
    status: 'not_configured',
  },
  {
    id: 'provider-openai',
    displayName: 'OpenAI / ChatGPT',
    providerType: 'openai',
    enabled: false,
    priority: 3,
    credentials: [],
    defaultModelId: 'auto',
    status: 'not_configured',
  },
  {
    id: 'provider-anthropic',
    displayName: 'Anthropic Claude',
    providerType: 'anthropic',
    enabled: false,
    priority: 4,
    credentials: [],
    defaultModelId: 'auto',
    status: 'not_configured',
  },
  {
    id: 'provider-ollama',
    displayName: 'Ollama / Local AI',
    providerType: 'ollama',
    enabled: false,
    priority: 5,
    credentials: [],
    defaultModelId: 'auto',
    endpoint: 'http://localhost:11434',
    status: 'not_configured',
  },
];

class AIService {
  private providers: AIProviderConfig[] = [];
  private crossProviderFallbackEnabled: boolean = false;
  private listeners: Set<() => void> = new Set();
  private lastFallbackEvent: FallbackEvent | null = null;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const stored = localStorage.getItem(PROVIDERS_STORAGE_KEY);
      if (stored) {
        this.providers = JSON.parse(stored);
      } else {
        this.providers = INITIAL_DEFAULT_PROVIDERS;
      }

      // Populate credentials summaries from credentialManager vault
      this.providers.forEach(p => {
        p.credentials = credentialManager.getCredentialsSummary(p.id);
        const hasValid = credentialManager.hasValidCredentials(p.id);
        if (hasValid) {
          if (p.credentials.every(c => c.health === 'RATE_LIMITED')) {
            p.status = 'rate_limited';
          } else if (p.credentials.every(c => c.health === 'INVALID')) {
            p.status = 'invalid_credentials';
          } else {
            p.status = 'connected';
          }
        } else if (p.providerType === 'ollama') {
          // Ollama status handled by discover/refresh
        } else {
          p.status = 'not_configured';
        }
      });

      const fallbackStored = localStorage.getItem(FALLBACK_SETTING_KEY);
      this.crossProviderFallbackEnabled = fallbackStored === 'true'; // Default is OFF
    } catch {
      this.providers = INITIAL_DEFAULT_PROVIDERS;
      this.crossProviderFallbackEnabled = false;
    }
  }

  public persist() {
    try {
      localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(this.providers));
      localStorage.setItem(FALLBACK_SETTING_KEY, String(this.crossProviderFallbackEnabled));
      this.notifyListeners();
    } catch (e) {
      console.warn('Could not persist AI Service state', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    for (const l of this.listeners) {
      l();
    }
  }

  public getProviders(): AIProviderConfig[] {
    return [...this.providers].sort((a, b) => a.priority - b.priority);
  }

  public getProvider(id: string): AIProviderConfig | undefined {
    return this.providers.find(p => p.id === id);
  }

  public getUsableProviders(): AIProviderConfig[] {
    return this.providers
      .filter(p => p.enabled)
      .filter(p => credentialManager.hasValidCredentials(p.id) || p.providerType === 'ollama')
      .sort((a, b) => a.priority - b.priority);
  }

  public isCrossProviderFallbackEnabled(): boolean {
    return this.crossProviderFallbackEnabled;
  }

  public setCrossProviderFallback(enabled: boolean) {
    this.crossProviderFallbackEnabled = enabled;
    this.persist();
  }

  public canEnableCrossProviderFallback(): boolean {
    // Enabled only when user has >1 usable configured providers
    return this.getUsableProviders().length > 1;
  }

  public getLastFallbackEvent(): FallbackEvent | null {
    return this.lastFallbackEvent;
  }

  public clearLastFallbackEvent() {
    this.lastFallbackEvent = null;
    this.notifyListeners();
  }

  public reorderPriority(providerId: string, direction: 'up' | 'down') {
    const list = this.getProviders();
    const idx = list.findIndex(p => p.id === providerId);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
      const temp = list[idx].priority;
      list[idx].priority = list[idx - 1].priority;
      list[idx - 1].priority = temp;
    } else if (direction === 'down' && idx < list.length - 1) {
      const temp = list[idx].priority;
      list[idx].priority = list[idx + 1].priority;
      list[idx + 1].priority = temp;
    }

    this.persist();
  }

  public toggleProviderEnabled(providerId: string): boolean {
    const p = this.getProvider(providerId);
    if (!p) return false;
    p.enabled = !p.enabled;
    this.persist();
    return p.enabled;
  }

  public setDefaultModel(providerId: string, modelId: string) {
    const p = this.getProvider(providerId);
    if (p) {
      p.defaultModelId = modelId;
      this.persist();
    }
  }

  public saveProvider(provider: AIProviderConfig) {
    const idx = this.providers.findIndex(p => p.id === provider.id);
    if (idx >= 0) {
      this.providers[idx] = { ...this.providers[idx], ...provider };
    } else {
      this.providers.push(provider);
    }
    this.persist();
  }

  public deleteProvider(providerId: string) {
    this.providers = this.providers.filter(p => p.id !== providerId);
    this.persist();
  }

  public setProviderCredentials(
    providerId: string,
    credentials: Array<{ id?: string; keyOrToken: string; accountId?: string; label?: string }>
  ) {
    const p = this.getProvider(providerId);
    if (!p) return;

    const updated = credentialManager.setCredentialsForProvider(providerId, credentials);
    p.credentials = updated;
    const hasValid = credentialManager.hasValidCredentials(providerId);
    if (hasValid) {
      p.status = 'connected';
    } else if (p.providerType !== 'ollama') {
      p.status = 'not_configured';
    }
    this.persist();
  }

  public async testProviderConnection(
    providerId: string
  ): Promise<{ success: boolean; message: string }> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return { success: false, message: 'Provider not found' };
    }

    const adapter = modelRouter.getAdapter(provider);
    const isOllama = provider.providerType === 'ollama';

    let credInfo: { rawKey: string; rawAccountId?: string } = { rawKey: '' };
    if (!isOllama) {
      const next = credentialManager.getNextAvailableCredential(provider.id);
      if (!next) {
        provider.status = 'not_configured';
        this.persist();
        return { success: false, message: 'No credentials configured for this provider.' };
      }
      credInfo = { rawKey: next.rawKey, rawAccountId: next.rawAccountId };
    }

    provider.status = 'connecting';
    this.persist();

    const modelId = provider.defaultModelId !== 'auto'
      ? provider.defaultModelId
      : modelRegistry.getPrimaryModelForProvider(provider.providerType)?.id || '';

    const result = await adapter.testConnection(
      { key: credInfo.rawKey, accountId: credInfo.rawAccountId },
      modelId
    );

    if (result.success) {
      provider.status = 'connected';
      provider.lastSuccessfulRequest = Date.now();
    } else {
      if (result.errorType === 'AUTH_FAILED') {
        provider.status = 'invalid_credentials';
      } else if (result.errorType === 'RATE_LIMITED') {
        provider.status = 'rate_limited';
      } else {
        provider.status = 'temporarily_unavailable';
      }
    }

    this.persist();
    return result;
  }

  public async refreshOllamaModels(endpoint?: string): Promise<ModelInfo[]> {
    const p = this.providers.find(prov => prov.providerType === 'ollama');
    const targetEndpoint = endpoint || p?.endpoint || 'http://localhost:11434';
    const models = await modelRegistry.fetchOllamaModels(targetEndpoint);
    if (p) {
      p.status = models.length > 0 ? 'connected' : 'not_configured';
      this.persist();
    }
    return models;
  }

  public async executeTask(
    request: AIRequest,
    options: { manualModelId?: string } = {}
  ): Promise<AIResponse> {
    return modelRouter.execute(request, this.providers, {
      manualModelId: options.manualModelId,
      crossProviderFallbackEnabled: this.crossProviderFallbackEnabled,
      onFallback: (event) => {
        this.lastFallbackEvent = event;
        this.notifyListeners();
      },
      onCredentialRotated: () => {
        this.notifyListeners();
      },
    });
  }
}

export const aiService = new AIService();
export default aiService;
