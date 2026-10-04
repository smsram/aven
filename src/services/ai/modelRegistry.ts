// Central Model Registry for Aven Desktop AI Application
import { ModelInfo, ProviderId, ModelCapability } from './types';
import { buildSafeHeaders } from './headerUtils';

const fullCapabilities = (overrides: Partial<ModelCapability> = {}): ModelCapability => ({
  text: true,
  vision: false,
  reasoning: false,
  toolCalling: false,
  structuredOutput: false,
  streaming: true,
  imageGeneration: false,
  audioInput: false,
  audioOutput: false,
  videoInput: false,
  videoOutput: false,
  ...overrides,
});

export const BUILT_IN_MODELS: Record<string, ModelInfo[]> = {
  gemini: [
    {
      id: 'gemini-3.8-flash',
      providerId: 'gemini',
      displayName: 'Gemini 3.8 Flash',
      description: 'Primary general Aven model for long-horizon software engineering, autonomous agents, and multimodal reasoning.',
      capabilities: fullCapabilities({
        vision: true,
        reasoning: true,
        toolCalling: true,
        structuredOutput: true,
        videoInput: true,
        audioInput: true,
      }),
      contextLength: 1048576,
      enabled: true,
      recommendedFor: ['general', 'agent', 'reasoning', 'coding', 'vision'],
      availability: 'available',
      tags: ['Primary', 'Reasoning', 'Vision', 'Coding'],
      costTier: 'standard',
    },
    {
      id: 'gemini-3.5-flash-lite',
      providerId: 'gemini',
      displayName: 'Gemini 3.5 Flash-Lite',
      description: 'Ultra-efficient, cost-sensitive model optimized for high-throughput subagent and background workloads.',
      capabilities: fullCapabilities({
        vision: true,
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 524288,
      enabled: true,
      recommendedFor: ['fast', 'background', 'subagent'],
      availability: 'available',
      tags: ['Fast', 'Efficient'],
      costTier: 'free',
    },
    {
      id: 'gemini-3.7-flash',
      providerId: 'gemini',
      displayName: 'Gemini 3.7 Flash',
      description: 'Hybrid reasoning and fast response model for balanced desktop workflows.',
      capabilities: fullCapabilities({
        vision: true,
        reasoning: true,
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 1048576,
      enabled: true,
      recommendedFor: ['general', 'reasoning', 'agent'],
      availability: 'available',
      tags: ['Reasoning', 'Vision'],
      costTier: 'standard',
    },
  ],

  openai: [
    {
      id: 'gpt-5.4',
      providerId: 'openai',
      displayName: 'GPT-5.4',
      description: 'Advanced flagship agent model with native computer use, function calling, deep reasoning, and multimodal inputs.',
      capabilities: fullCapabilities({
        vision: true,
        reasoning: true,
        toolCalling: true,
        structuredOutput: true,
        imageGeneration: true,
      }),
      contextLength: 200000,
      enabled: true,
      recommendedFor: ['general', 'agent', 'reasoning', 'coding', 'vision'],
      availability: 'available',
      tags: ['Primary', 'Reasoning', 'Vision', 'Coding'],
      costTier: 'paid',
    },
    {
      id: 'gpt-5.4-mini',
      providerId: 'openai',
      displayName: 'GPT-5.4 mini',
      description: 'Engineered for high-volume coding, computer use, and subagent workloads with minimal latency.',
      capabilities: fullCapabilities({
        vision: true,
        reasoning: true,
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 200000,
      enabled: true,
      recommendedFor: ['fast', 'coding', 'subagent', 'agent'],
      availability: 'available',
      tags: ['Fast', 'Coding', 'Subagent'],
      costTier: 'standard',
    },
    {
      id: 'gpt-5.4-nano',
      providerId: 'openai',
      displayName: 'GPT-5.4 nano',
      description: 'Extremely lightweight, high-throughput model for repetitive classification, triage, and background tasks.',
      capabilities: fullCapabilities({
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 128000,
      enabled: true,
      recommendedFor: ['fast', 'background'],
      availability: 'available',
      tags: ['Fast', 'Efficient'],
      costTier: 'free',
    },
  ],

  anthropic: [
    {
      id: 'claude-sonnet-5.5',
      providerId: 'anthropic',
      displayName: 'Claude Sonnet 5.5',
      description: 'Industry-leading computer-use agent model with nuanced visual perception, coding, and precise tool orchestration.',
      capabilities: fullCapabilities({
        vision: true,
        reasoning: true,
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 200000,
      enabled: true,
      recommendedFor: ['general', 'agent', 'coding', 'vision'],
      availability: 'available',
      tags: ['Primary', 'Vision', 'Coding'],
      costTier: 'standard',
    },
    {
      id: 'claude-opus-5.5',
      providerId: 'anthropic',
      displayName: 'Claude Opus 5.5',
      description: 'Deep analytical and architectural reasoning model for demanding logical and multi-step agent decisions.',
      capabilities: fullCapabilities({
        vision: true,
        reasoning: true,
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 200000,
      enabled: true,
      recommendedFor: ['reasoning', 'coding'],
      availability: 'available',
      tags: ['Reasoning'],
      costTier: 'paid',
    },
    {
      id: 'claude-haiku-4.5',
      providerId: 'anthropic',
      displayName: 'Claude Haiku 4.5',
      description: 'Lightning-fast execution model for rapid query filtering, summarization, and responsive tasks.',
      capabilities: fullCapabilities({
        vision: true,
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 200000,
      enabled: true,
      recommendedFor: ['fast', 'background'],
      availability: 'available',
      tags: ['Fast'],
      costTier: 'free',
    },
  ],

  cloudflare: [
    {
      id: '@cf/google/gemma-4-26b-a4b-it',
      providerId: 'cloudflare',
      displayName: 'Gemma 4 26B A4B',
      description: 'Primary general multimodal agent model on Workers AI with robust visual grounding and agent instruction following.',
      capabilities: fullCapabilities({
        vision: true,
        toolCalling: true,
        reasoning: true,
        structuredOutput: true,
      }),
      contextLength: 128000,
      enabled: true,
      recommendedFor: ['general', 'agent', 'vision', 'background'],
      availability: 'available',
      tags: ['Primary', 'Vision', 'General'],
      costTier: 'standard',
    },
    {
      id: '@cf/meta/llama-4-scout-17b-16e-instruct',
      providerId: 'cloudflare',
      displayName: 'Llama 4 Scout',
      description: 'High-efficiency reasoning and tool-calling specialist model across Cloudflare global edge network.',
      capabilities: fullCapabilities({
        reasoning: true,
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 131072,
      enabled: true,
      recommendedFor: ['reasoning', 'agent', 'fast'],
      availability: 'available',
      tags: ['Reasoning', 'Tools'],
      costTier: 'standard',
    },
    {
      id: '@cf/qwen/qwen3.8-27b',
      providerId: 'cloudflare',
      displayName: 'Qwen 3.8 27B',
      description: 'Comprehensive multimodal text and vision model with exceptional code and cross-domain reasoning.',
      capabilities: fullCapabilities({
        vision: true,
        reasoning: true,
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 65536,
      enabled: true,
      recommendedFor: ['general', 'vision', 'coding'],
      availability: 'available',
      tags: ['Vision', 'General'],
      costTier: 'standard',
    },
    {
      id: '@cf/zai-org/glm-5.3-flash',
      providerId: 'cloudflare',
      displayName: 'GLM-5.3-Flash',
      description: 'High-speed reasoning model. Note: Requires paid Workers AI account tier.',
      capabilities: fullCapabilities({
        reasoning: true,
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 128000,
      enabled: true,
      recommendedFor: ['reasoning', 'fast'],
      availability: 'requires_paid',
      tags: ['Reasoning', 'Paid Tier'],
      costTier: 'paid',
    },
    {
      id: '@cf/moonshotai/kimi-k2.6',
      providerId: 'cloudflare',
      displayName: 'Kimi K2.6',
      description: 'Massive context window reasoning and document analysis. Requires paid Workers AI account tier.',
      capabilities: fullCapabilities({
        reasoning: true,
        structuredOutput: true,
      }),
      contextLength: 200000,
      enabled: true,
      recommendedFor: ['reasoning'],
      availability: 'requires_paid',
      tags: ['Reasoning', 'Paid Tier'],
      costTier: 'paid',
    },
    {
      id: '@cf/moonshotai/kimi-k2.7-code',
      providerId: 'cloudflare',
      displayName: 'Kimi K2.7 Code',
      description: 'Specialized code generation, debugging, and automated refactoring on Workers AI.',
      capabilities: fullCapabilities({
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 128000,
      enabled: true,
      recommendedFor: ['coding', 'subagent'],
      availability: 'available',
      tags: ['Coding'],
      costTier: 'standard',
    },
    {
      id: '@cf/meta/llama-3.2-11b-vision-instruct',
      providerId: 'cloudflare',
      displayName: 'Llama 3.2 11B Vision',
      description: 'Dedicated vision instruction model tailored for desktop screenshot interpretation and image analysis.',
      capabilities: fullCapabilities({
        vision: true,
        structuredOutput: true,
      }),
      contextLength: 128000,
      enabled: true,
      recommendedFor: ['vision'],
      availability: 'available',
      tags: ['Vision Specialized'],
      costTier: 'standard',
    },
    {
      id: '@cf/mistralai/mistral-small-3.1-24b-instruct',
      providerId: 'cloudflare',
      displayName: 'Mistral Small 3.1 24B',
      description: 'Fast, precise instruction follower with reliable native tool and function calling.',
      capabilities: fullCapabilities({
        toolCalling: true,
        structuredOutput: true,
      }),
      contextLength: 32768,
      enabled: true,
      recommendedFor: ['fast', 'agent'],
      availability: 'available',
      tags: ['Fast', 'Tools'],
      costTier: 'standard',
    },
    {
      id: '@cf/moondream/moondream3.1-9B-A2B',
      providerId: 'cloudflare',
      displayName: 'Moondream 3.1 9B',
      description: 'Ultra-compact vision specialist model for quick visual question answering and optical character recognition.',
      capabilities: fullCapabilities({
        vision: true,
      }),
      contextLength: 8192,
      enabled: true,
      recommendedFor: ['vision', 'fast'],
      availability: 'available',
      tags: ['Vision Only'],
      costTier: 'free',
    },
  ],

  ollama: [], // Populated dynamically from local Ollama instance
};

class ModelRegistry {
  private dynamicOllamaModels: ModelInfo[] = [];
  private customModels: ModelInfo[] = [];

  constructor() {
    this.loadCustomModels();
  }

  private loadCustomModels() {
    try {
      const stored = localStorage.getItem('aven_custom_models_v1');
      if (stored) {
        this.customModels = JSON.parse(stored);
      }
    } catch {
      this.customModels = [];
    }
  }

  public saveCustomModels() {
    try {
      localStorage.setItem('aven_custom_models_v1', JSON.stringify(this.customModels));
    } catch (e) {
      console.warn('Could not persist custom models', e);
    }
  }

  public getModelsForProvider(providerId: ProviderId): ModelInfo[] {
    if (providerId === 'ollama') {
      return this.dynamicOllamaModels;
    }
    if (providerId === 'custom') {
      return this.customModels;
    }
    return BUILT_IN_MODELS[providerId] || [];
  }

  public getModel(modelId: string, providerId?: ProviderId): ModelInfo | undefined {
    if (modelId === 'auto') return undefined;

    if (providerId) {
      const models = this.getModelsForProvider(providerId);
      const found = models.find(m => m.id === modelId);
      if (found) return found;
    }

    // Search across all
    for (const pId of Object.keys(BUILT_IN_MODELS)) {
      const found = BUILT_IN_MODELS[pId].find(m => m.id === modelId);
      if (found) return found;
    }
    const inOllama = this.dynamicOllamaModels.find(m => m.id === modelId);
    if (inOllama) return inOllama;

    return this.customModels.find(m => m.id === modelId);
  }

  public getAllModels(): ModelInfo[] {
    const list: ModelInfo[] = [];
    for (const pId of Object.keys(BUILT_IN_MODELS)) {
      list.push(...BUILT_IN_MODELS[pId]);
    }
    list.push(...this.dynamicOllamaModels);
    list.push(...this.customModels);
    return list;
  }

  public setDynamicOllamaModels(models: ModelInfo[]) {
    this.dynamicOllamaModels = models;
  }

  public async fetchOllamaModels(endpoint: string = 'http://localhost:11434'): Promise<ModelInfo[]> {
    try {
      const cleanEndpoint = endpoint.replace(/\/+$/, '');
      const headers = buildSafeHeaders({ 'Content-Type': 'application/json' }, 'Ollama tags');
      const resp = await fetch(`${cleanEndpoint}/api/tags`, {
        method: 'GET',
        headers,
      });
      if (!resp.ok) {
        throw new Error(`Ollama returned status ${resp.status}`);
      }
      const data = await resp.json();
      const models: ModelInfo[] = (data.models || []).map((m: any) => {
        const name = m.name || m.model;
        const isVision = /vision|llava|bakllava|moondream/i.test(name);
        const isCode = /code|deepseek-coder|codellama|qwen2.5-coder/i.test(name);
        const isReasoning = /r1|deepseek|qwq|reasoning/i.test(name);

        const tags: any[] = ['Local'];
        if (isVision) tags.push('Vision');
        if (isCode) tags.push('Coding');
        if (isReasoning) tags.push('Reasoning');

        return {
          id: name,
          providerId: 'ollama',
          displayName: name,
          description: `Local Ollama model (${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB)`,
          capabilities: fullCapabilities({
            vision: isVision,
            reasoning: isReasoning,
            toolCalling: true,
            structuredOutput: true,
          }),
          enabled: true,
          recommendedFor: isVision ? ['vision', 'general'] : isCode ? ['coding'] : ['general', 'fast'],
          availability: 'available',
          tags,
          costTier: 'free',
        };
      });

      this.dynamicOllamaModels = models;
      return models;
    } catch (e) {
      console.warn('Could not query local Ollama instance', e);
      this.dynamicOllamaModels = [];
      return [];
    }
  }

  public registerCustomModel(model: ModelInfo) {
    const existingIdx = this.customModels.findIndex(m => m.id === model.id);
    if (existingIdx >= 0) {
      this.customModels[existingIdx] = model;
    } else {
      this.customModels.push(model);
    }
    this.saveCustomModels();
  }

  public removeCustomModel(modelId: string) {
    this.customModels = this.customModels.filter(m => m.id !== modelId);
    this.saveCustomModels();
  }

  public getPrimaryModelForProvider(providerId: ProviderId): ModelInfo | undefined {
    const models = this.getModelsForProvider(providerId);
    if (models.length === 0) return undefined;
    const primary = models.find(m => m.tags.includes('Primary') && m.availability === 'available');
    return primary || models.find(m => m.availability === 'available') || models[0];
  }
}

export const modelRegistry = new ModelRegistry();
export default modelRegistry;
