export type ThemeOption = 'light' | 'dark' | 'system';
export type AiProviderOption = 'gemini' | 'openai' | 'anthropic' | 'cloudflare' | 'ollama' | 'custom';
export type AutonomyLevel = 'balanced' | 'autonomous' | 'strict';
export type ResponseStyle = 'concise' | 'detailed';

export interface CustomAiProviderConfig {
  id: string;
  name: string;
  providerType: AiProviderOption;
  endpoint: string;
  apiKeys: string[];
  activeKeyIndex?: number;
  model: string;
  // Cloudflare specific
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
  // Advanced request/response formats
  httpMethod: 'POST' | 'GET';
  authType: 'bearer' | 'api_key_header' | 'custom_header' | 'none';
  authHeaderName?: string;
  headers: Record<string, string>;
  requestJsonTemplate: string;
  responseJsonPath: string; // e.g. "$.choices[0].message.content" or "$.response.text"
  outputType: 'text' | 'json' | 'image' | 'audio' | 'video' | 'multimodal' | 'streaming';
  enabled: boolean;
}

export interface AvenSettings {
  theme: ThemeOption;
  userName: string;
  userEmail?: string;
  aiProvider: AiProviderOption;
  apiKeys: string[];
  apiKey?: string; // Legacy fallback
  // Cloudflare credentials
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
  cloudflareModel?: string;
  // Local AI / Ollama configuration
  ollamaEndpoint?: string;
  ollamaModel?: string;
  // Custom AI general configuration
  customEndpoint?: string;
  customModel?: string;
  // All user-configured providers
  customProviders: CustomAiProviderConfig[];
  computerPermissions: {
    mouseKeyboardControl: boolean;
    fullscreenInteraction: boolean;
    screenPerception: boolean;
    destructiveConfirmation: boolean;
  };
  voiceShortcut: string;
  autonomyLevel: AutonomyLevel;
  responseStyle: ResponseStyle;
  onboardingCompleted: boolean;
  sidebarCollapsed: boolean;
}

const STORAGE_KEY = 'aven_desktop_settings_v1';

export const maskApiKey = (key: string): string => {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
};

export const parseApiKeys = (input: string | string[]): string[] => {
  if (Array.isArray(input)) {
    return input.map(k => k.trim()).filter(Boolean);
  }
  if (!input) return [];
  // Split on comma or newline
  return input
    .split(/[,\n]/)
    .map(k => k.trim())
    .filter(Boolean);
};

export const DEFAULT_PROVIDERS: CustomAiProviderConfig[] = [
  {
    id: 'provider-gemini',
    name: 'Google Gemini',
    providerType: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKeys: ['AIzaSyD-sample-gemini-key-1'],
    model: 'gemini-3.8-flash',
    httpMethod: 'POST',
    authType: 'api_key_header',
    authHeaderName: 'x-goog-api-key',
    headers: { 'Content-Type': 'application/json' },
    requestJsonTemplate: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: '{{prompt}}' }] }],
      generationConfig: { temperature: 0.7 }
    }, null, 2),
    responseJsonPath: '$.candidates[0].content.parts[0].text',
    outputType: 'text',
    enabled: true,
  },
  {
    id: 'provider-openai',
    name: 'OpenAI / ChatGPT',
    providerType: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKeys: ['sk-proj-sample-openai-key-1'],
    model: 'gpt-5.4',
    httpMethod: 'POST',
    authType: 'bearer',
    headers: { 'Content-Type': 'application/json' },
    requestJsonTemplate: JSON.stringify({
      model: '{{model}}',
      messages: '{{messages}}'
    }, null, 2),
    responseJsonPath: '$.choices[0].message.content',
    outputType: 'text',
    enabled: true,
  },
  {
    id: 'provider-anthropic',
    name: 'Anthropic Claude',
    providerType: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKeys: ['sk-ant-sample-claude-key-1'],
    model: 'claude-sonnet-5.5',
    httpMethod: 'POST',
    authType: 'custom_header',
    authHeaderName: 'x-api-key',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    requestJsonTemplate: JSON.stringify({
      model: '{{model}}',
      max_tokens: 4096,
      messages: '{{messages}}'
    }, null, 2),
    responseJsonPath: '$.content[0].text',
    outputType: 'text',
    enabled: false,
  },
  {
    id: 'provider-cloudflare',
    name: 'Cloudflare Workers AI',
    providerType: 'cloudflare',
    endpoint: 'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/google/gemma-4-26b-a4b-it',
    apiKeys: [],
    cloudflareAccountId: 'a1b2c3d4e5f6',
    cloudflareApiToken: 'cf_sample_token_789',
    model: '@cf/google/gemma-4-26b-a4b-it',
    httpMethod: 'POST',
    authType: 'bearer',
    headers: { 'Content-Type': 'application/json' },
    requestJsonTemplate: JSON.stringify({
      messages: '{{messages}}'
    }, null, 2),
    responseJsonPath: '$.result.response',
    outputType: 'text',
    enabled: false,
  },
  {
    id: 'provider-ollama',
    name: 'Ollama / Local AI',
    providerType: 'ollama',
    endpoint: 'http://localhost:11434/api/chat',
    apiKeys: [],
    model: 'auto',
    httpMethod: 'POST',
    authType: 'none',
    headers: { 'Content-Type': 'application/json' },
    requestJsonTemplate: JSON.stringify({
      model: '{{model}}',
      messages: '{{messages}}',
      stream: false
    }, null, 2),
    responseJsonPath: '$.message.content',
    outputType: 'text',
    enabled: false,
  },
];

const DEFAULT_SETTINGS: AvenSettings = {
  theme: 'system',
  userName: 'Alex R.',
  aiProvider: 'gemini',
  apiKeys: ['AIzaSyD-sample-gemini-key-1'],
  apiKey: 'AIzaSyD-sample-gemini-key-1',
  cloudflareAccountId: '',
  cloudflareApiToken: '',
  cloudflareModel: '@cf/google/gemma-4-26b-a4b-it',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'auto',
  customEndpoint: 'http://localhost:8000/v1/chat/completions',
  customModel: 'meta-llama/Llama-3.3-70B-Instruct',
  customProviders: DEFAULT_PROVIDERS,
  computerPermissions: {
    mouseKeyboardControl: true,
    fullscreenInteraction: true,
    screenPerception: true,
    destructiveConfirmation: true,
  },
  voiceShortcut: 'Hold Ctrl + Space',
  autonomyLevel: 'balanced',
  responseStyle: 'concise',
  onboardingCompleted: false,
  sidebarCollapsed: false,
};

export const settingsService = {
  getSettings: (): AvenSettings => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          customProviders: parsed.customProviders && parsed.customProviders.length > 0
            ? parsed.customProviders
            : DEFAULT_PROVIDERS,
        };
      }
    } catch (e) {
      console.warn('Could not read settings from storage', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings: (settings: Partial<AvenSettings>): AvenSettings => {
    try {
      const current = settingsService.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Could not save settings', e);
      return DEFAULT_SETTINGS;
    }
  },

  isOnboardingComplete: (): boolean => {
    return settingsService.getSettings().onboardingCompleted;
  },

  completeOnboarding: (partialSettings?: Partial<AvenSettings>): void => {
    const updated = settingsService.saveSettings({
      ...partialSettings,
      onboardingCompleted: true,
    });

    // Synchronize configured credentials with AIService & CredentialManager
    try {
      import('./ai/aiService').then(({ aiService }) => {
        import('./ai/credentialManager').then(({ credentialManager, pairCloudflareCredentials }) => {
          const providerId = `provider-${updated.aiProvider}`;
          if (updated.aiProvider === 'cloudflare' && updated.cloudflareAccountId && updated.cloudflareApiToken) {
            const pairing = pairCloudflareCredentials(updated.cloudflareAccountId, updated.cloudflareApiToken);
            if (pairing.valid) {
              aiService.setProviderCredentials(
                providerId,
                pairing.credentials.map((c, i) => ({
                  keyOrToken: c.apiToken,
                  accountId: c.accountId,
                  label: `Token ${i + 1}`,
                }))
              );
            }
          } else if (['gemini', 'openai', 'anthropic'].includes(updated.aiProvider)) {
            const keys = updated.apiKeys && updated.apiKeys.length > 0
              ? updated.apiKeys
              : (updated.apiKey ? [updated.apiKey] : []);
            if (keys.length > 0) {
              aiService.setProviderCredentials(
                providerId,
                keys.map((k, i) => ({
                  keyOrToken: k,
                  label: `Key ${i + 1}`,
                }))
              );
            }
          } else if (updated.aiProvider === 'ollama') {
            const p = aiService.getProvider(providerId);
            if (p) {
              p.endpoint = updated.ollamaEndpoint || 'http://localhost:11434';
              p.enabled = true;
              aiService.saveProvider(p);
              aiService.refreshOllamaModels(p.endpoint);
            }
          }
        });
      });
    } catch (e) {
      console.warn('Could not sync onboarding with aiService', e);
    }
  },

  resetOnboarding: (): void => {
    settingsService.saveSettings({ onboardingCompleted: false });
  },

  isSidebarCollapsed: (): boolean => {
    return !!settingsService.getSettings().sidebarCollapsed;
  },

  setSidebarCollapsed: (collapsed: boolean): void => {
    settingsService.saveSettings({ sidebarCollapsed: collapsed });
  },

  // Custom AI Providers Management
  getCustomProviders: (): CustomAiProviderConfig[] => {
    return settingsService.getSettings().customProviders || DEFAULT_PROVIDERS;
  },

  saveCustomProvider: (provider: CustomAiProviderConfig): void => {
    const current = settingsService.getSettings();
    const existingIndex = current.customProviders.findIndex(p => p.id === provider.id);
    let updated: CustomAiProviderConfig[];
    if (existingIndex >= 0) {
      updated = [...current.customProviders];
      updated[existingIndex] = provider;
    } else {
      updated = [...current.customProviders, provider];
    }
    settingsService.saveSettings({ customProviders: updated });
  },

  deleteCustomProvider: (id: string): void => {
    const current = settingsService.getSettings();
    const updated = current.customProviders.filter(p => p.id !== id);
    settingsService.saveSettings({ customProviders: updated });
  },

  // Multiple API Key Helpers
  addApiKeyToProvider: (providerId: string, newKey: string): void => {
    const current = settingsService.getSettings();
    const provider = current.customProviders.find(p => p.id === providerId);
    if (provider) {
      const parsed = parseApiKeys(newKey);
      const combined = Array.from(new Set([...provider.apiKeys, ...parsed]));
      settingsService.saveCustomProvider({
        ...provider,
        apiKeys: combined,
      });
    }
  },

  removeApiKeyFromProvider: (providerId: string, keyToRemove: string): void => {
    const current = settingsService.getSettings();
    const provider = current.customProviders.find(p => p.id === providerId);
    if (provider) {
      const updatedKeys = provider.apiKeys.filter(k => k !== keyToRemove);
      settingsService.saveCustomProvider({
        ...provider,
        apiKeys: updatedKeys,
      });
    }
  },
};

export default settingsService;
