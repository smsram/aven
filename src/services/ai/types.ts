// Production AI Provider & Model Configuration System Types for Aven

export type BuiltInProviderId = 'gemini' | 'openai' | 'anthropic' | 'cloudflare' | 'ollama' | 'custom';
export type ProviderId = BuiltInProviderId | string;

export type NormalizedErrorType =
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'AUTH_FAILED'
  | 'MODEL_UNAVAILABLE'
  | 'BAD_REQUEST'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'CAPABILITY_UNSUPPORTED'
  | 'UNKNOWN_ERROR';

export type CredentialHealth =
  | 'ACTIVE'
  | 'RATE_LIMITED'
  | 'TEMPORARILY_FAILED'
  | 'INVALID'
  | 'DISABLED';

export type ProviderConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'invalid_credentials'
  | 'rate_limited'
  | 'temporarily_unavailable'
  | 'model_unavailable'
  | 'not_configured';

export interface ProviderCredential {
  id: string;
  keyOrToken: string;
  accountId?: string; // Cloudflare Account ID
  health: CredentialHealth;
  lastUsed?: number;
  cooldownUntil?: number;
  failureCount: number;
  lastErrorType?: NormalizedErrorType;
  lastErrorMessage?: string;
  label?: string;
}

export interface ModelCapability {
  text: boolean;
  vision: boolean;
  reasoning: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
  streaming: boolean;
  imageGeneration: boolean;
  audioInput: boolean;
  audioOutput: boolean;
  videoInput: boolean;
  videoOutput: boolean;
}

export type CapabilityKey = keyof ModelCapability;

export type ModelTag = 'Primary' | 'Reasoning' | 'Vision' | 'Coding' | 'Fast' | 'Efficient' | 'Tools' | 'Subagent' | 'Paid Tier' | 'Local' | 'Vision Specialized' | 'Vision Only' | 'General';

export interface ModelInfo {
  id: string;
  providerId: ProviderId;
  displayName: string;
  capabilities: ModelCapability;
  contextLength?: number;
  enabled: boolean;
  recommendedFor: Array<'general' | 'reasoning' | 'coding' | 'fast' | 'vision' | 'agent' | 'background' | 'subagent'>;
  availability: 'available' | 'requires_paid' | 'requires_license' | 'local_uninstalled';
  tags: ModelTag[];
  costTier?: 'free' | 'standard' | 'paid';
  description?: string;
}

export interface CustomProviderConfig {
  httpMethod: 'POST' | 'GET';
  authType: 'none' | 'api_key' | 'bearer' | 'custom';
  authHeaderName?: string;
  headers: Record<string, string>;
  model: string;
  requestJsonTemplate: string;
  responseJsonPath: string; // e.g. "$.choices[0].message.content" or "$.response.text"
  outputType: 'text' | 'json' | 'image' | 'audio' | 'video' | 'multimodal' | 'streaming';
  capabilities: ModelCapability;
  preset?: 'openai' | 'anthropic' | 'gemini' | 'generic_json' | 'custom';
}

export interface AIProviderConfig {
  id: string;
  displayName: string;
  providerType: BuiltInProviderId;
  enabled: boolean;
  priority: number; // lower number = higher priority in fallback
  credentials: ProviderCredential[];
  defaultModelId: string; // 'auto' or specific model id
  endpoint?: string;
  customConfig?: CustomProviderConfig;
  status: ProviderConnectionStatus;
  lastSuccessfulRequest?: number;
  lastError?: {
    type: NormalizedErrorType;
    message: string;
    timestamp: number;
  };
  usageStats?: {
    requestCount: number;
    tokenCount?: number;
    rateLimitHits?: number;
  };
}

export interface AIRequestMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>;
  toolCallId?: string;
}

export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AIRequest {
  model?: string;
  messages: AIRequestMessage[];
  systemPrompt?: string;
  images?: string[]; // base64 or URL
  files?: Array<{ name: string; type: string; data: string }>;
  tools?: AIToolDefinition[];
  temperature?: number;
  reasoning?: boolean;
  stream?: boolean;
  requiredCapabilities?: Partial<ModelCapability>;
  abortSignal?: AbortSignal;
  onChunk?: (chunk: string) => void;
  onReasoningChunk?: (chunk: string) => void;
}

export interface AIResponseToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface AIResponse {
  text?: string;
  reasoning?: string;
  toolCalls?: AIResponseToolCall[];
  images?: string[];
  audio?: string;
  video?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
  raw?: any;
  provider: string;
  model: string;
  credentialIdUsed?: string;
}

export interface FallbackEvent {
  fromProvider: string;
  fromModel: string;
  toProvider: string;
  toModel: string;
  reason: NormalizedErrorType;
  message: string;
  timestamp: number;
}
