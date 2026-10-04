import React, { useState, useEffect } from 'react';
import {
  Server,
  Cpu,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  X,
  Key,
  Globe,
  Code,
  Layers,
  Activity,
  AlertCircle,
  Bot,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Zap,
  Eye,
  Sliders
} from 'lucide-react';
import aiService from '../services/ai/aiService';
import settingsService from '../services/settingsService';
import modelRegistry, { BUILT_IN_MODELS } from '../services/ai/modelRegistry';
import credentialManager, {
  maskApiKey,
  maskAccountId,
  pairCloudflareCredentials,
  parseTokens
} from '../services/ai/credentialManager';
import { validateCredentialString } from '../services/ai/headerUtils';
import toolRegistry, { McpServerConfig } from '../services/agent/toolRegistry';
import {
  AIProviderConfig,
  ProviderCredential,
  ModelInfo,
  ModelCapability
} from '../services/ai/types';

interface ConnectionListProps {
  initialTab?: 'ai_providers' | 'mcp' | 'apis';
}

export const ConnectionList: React.FC<ConnectionListProps> = ({
  initialTab = 'ai_providers',
}) => {
  const [activeTab, setActiveTab] = useState<'ai_providers' | 'mcp' | 'apis'>(initialTab);
  const [providers, setProviders] = useState<AIProviderConfig[]>(() => aiService.getProviders());
  const [fallbackEnabled, setFallbackEnabled] = useState<boolean>(() => aiService.isCrossProviderFallbackEnabled());
  const [canFallback, setCanFallback] = useState<boolean>(() => aiService.canEnableCrossProviderFallback());
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>(() => toolRegistry.getServers());

  // Connection testing state
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProviderConfig | null>(null);
  const [isNewCustom, setIsNewCustom] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AIProviderConfig['providerType']>('gemini');
  const [formEndpoint, setFormEndpoint] = useState('');
  const [formDefaultModel, setFormDefaultModel] = useState('auto');
  const [formStagedKeys, setFormStagedKeys] = useState<Array<{ id?: string; keyOrToken: string; accountId?: string; label?: string; health?: string }>>([]);
  const [singleKeyInput, setSingleKeyInput] = useState('');
  const [cfAccountInput, setCfAccountInput] = useState('');
  const [cfTokenInput, setCfTokenInput] = useState('');
  const [cfPairError, setCfPairError] = useState<string | null>(null);

const DEFAULT_CAPABILITIES: ModelCapability = {
  text: true,
  vision: false,
  reasoning: false,
  toolCalling: false,
  structuredOutput: true,
  streaming: true,
  imageGeneration: false,
  audioInput: false,
  audioOutput: false,
  videoInput: false,
  videoOutput: false,
};

  // Custom AI advanced fields
  const [customPreset, setCustomPreset] = useState<'openai' | 'anthropic' | 'gemini' | 'generic_json' | 'custom'>('openai');
  const [customAuthType, setCustomAuthType] = useState<'bearer' | 'api_key' | 'custom' | 'none'>('bearer');
  const [customAuthHeader, setCustomAuthHeader] = useState('');
  const [customRequestTemplate, setCustomRequestTemplate] = useState('');
  const [customResponsePath, setCustomResponsePath] = useState('$.choices[0].message.content');
  const [customCapabilities, setCustomCapabilities] = useState<ModelCapability>(DEFAULT_CAPABILITIES);

  // Ollama local scanning state
  const [isScanningOllama, setIsScanningOllama] = useState(false);
  const [ollamaScanMsg, setOllamaScanMsg] = useState<string | null>(null);
  const [keyInputError, setKeyInputError] = useState<string | null>(null);

  // Subscribe to changes in aiService
  useEffect(() => {
    const unsub = aiService.subscribe(() => {
      setProviders(aiService.getProviders());
      setFallbackEnabled(aiService.isCrossProviderFallbackEnabled());
      setCanFallback(aiService.canEnableCrossProviderFallback());
    });
    return unsub;
  }, []);

  const handleToggleFallback = (enabled: boolean) => {
    aiService.setCrossProviderFallback(enabled);
    setFallbackEnabled(enabled);
  };

  const handleToggleProvider = (id: string) => {
    aiService.toggleProviderEnabled(id);
    setProviders(aiService.getProviders());
    setCanFallback(aiService.canEnableCrossProviderFallback());
  };

  const handleReorder = (id: string, dir: 'up' | 'down') => {
    aiService.reorderPriority(id, dir);
    setProviders(aiService.getProviders());
  };

  const handleTestConnection = async (id: string) => {
    setTestingProviderId(id);
    const result = await aiService.testProviderConnection(id);
    setTestingProviderId(null);
    setTestResults(prev => ({ ...prev, [id]: result }));
    setProviders(aiService.getProviders());
    setCanFallback(aiService.canEnableCrossProviderFallback());
  };

  const handleOpenEdit = (p: AIProviderConfig) => {
    setEditingProvider(p);
    setIsNewCustom(false);
    setFormName(p.displayName);
    setFormType(p.providerType);
    setFormEndpoint(p.endpoint || '');
    setFormDefaultModel(p.defaultModelId || 'auto');
    setSingleKeyInput('');
    setKeyInputError(null);
    setCfAccountInput('');
    setCfTokenInput('');
    setCfPairError(null);
    setOllamaScanMsg(null);

    // Load existing credentials
    const creds = credentialManager.getCredentialsSummary(p.id);
    setFormStagedKeys(
      creds.map(c => ({
        id: c.id,
        keyOrToken: c.keyOrToken, // masked string
        accountId: c.accountId,
        label: c.label,
        health: c.health,
      }))
    );

    // If Cloudflare, check if settingsService or existing raw keys can pre-fill input fields
    if (p.providerType === 'cloudflare') {
      const settings = settingsService.getSettings();
      if (creds.length === 0) {
        if (settings.cloudflareAccountId && !settings.cloudflareAccountId.toLowerCase().includes('a1b2c3d4e5f6')) {
          setCfAccountInput(settings.cloudflareAccountId);
        }
        if (settings.cloudflareApiToken && !settings.cloudflareApiToken.includes('sample-') && !settings.cloudflareApiToken.includes('•')) {
          setCfTokenInput(settings.cloudflareApiToken);
        }
      } else {
        // Pre-fill Account ID from first active credential for convenience
        const rawFirst = credentialManager.getRawCredential(p.id, creds[0].id);
        if (rawFirst?.accountId && !rawFirst.accountId.includes('•')) {
          setCfAccountInput(rawFirst.accountId);
        }
      }
    }

    // Custom configuration
    if (p.customConfig) {
      setCustomPreset(p.customConfig.preset || 'custom');
      setCustomAuthType(p.customConfig.authType || 'bearer');
      setCustomAuthHeader(p.customConfig.authHeaderName || '');
      setCustomRequestTemplate(p.customConfig.requestJsonTemplate || '');
      setCustomResponsePath(p.customConfig.responseJsonPath || '$.choices[0].message.content');
      setCustomCapabilities({
        text: !!p.customConfig.capabilities?.text,
        vision: !!p.customConfig.capabilities?.vision,
        reasoning: !!p.customConfig.capabilities?.reasoning,
        toolCalling: !!p.customConfig.capabilities?.toolCalling,
        structuredOutput: !!p.customConfig.capabilities?.structuredOutput,
        streaming: !!p.customConfig.capabilities?.streaming,
        imageGeneration: !!p.customConfig.capabilities?.imageGeneration,
        audioInput: !!p.customConfig.capabilities?.audioInput,
        audioOutput: !!p.customConfig.capabilities?.audioOutput,
        videoInput: !!p.customConfig.capabilities?.videoInput,
        videoOutput: !!p.customConfig.capabilities?.videoOutput,
      });
    }

    setIsEditorOpen(true);
  };

  const handleOpenAddCustom = () => {
    const newId = `provider-custom-${Date.now()}`;
    const newConfig: AIProviderConfig = {
      id: newId,
      displayName: 'Custom AI Provider',
      providerType: 'custom',
      enabled: true,
      priority: providers.length + 1,
      credentials: [],
      defaultModelId: 'custom-model',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      status: 'not_configured',
      customConfig: {
        httpMethod: 'POST',
        model: 'custom-model',
        headers: { 'Content-Type': 'application/json' },
        outputType: 'text',
        preset: 'openai',
        authType: 'bearer',
        requestJsonTemplate: JSON.stringify({ model: '{{model}}', messages: '{{messages}}' }, null, 2),
        responseJsonPath: '$.choices[0].message.content',
        capabilities: DEFAULT_CAPABILITIES,
      },
    };

    setEditingProvider(newConfig);
    setIsNewCustom(true);
    setFormName('Custom AI Provider');
    setFormType('custom');
    setFormEndpoint('https://api.openai.com/v1/chat/completions');
    setFormDefaultModel('custom-model');
    setFormStagedKeys([]);
    setSingleKeyInput('');
    setCfAccountInput('');
    setCfTokenInput('');
    setCfPairError(null);
    setOllamaScanMsg(null);
    setCustomPreset('openai');
    setCustomAuthType('bearer');
    setCustomAuthHeader('');
    setCustomRequestTemplate(JSON.stringify({ model: '{{model}}', messages: '{{messages}}' }, null, 2));
    setCustomResponsePath('$.choices[0].message.content');
    setIsEditorOpen(true);
  };

  const handleAddCloudflareCredentials = () => {
    setCfPairError(null);
    if (!cfAccountInput.trim() || !cfTokenInput.trim()) {
      setCfPairError('Both Account ID and API Token are required.');
      return;
    }

    try {
      validateCredentialString(cfAccountInput.trim(), 'Cloudflare Account ID');
      validateCredentialString(cfTokenInput.trim(), 'Cloudflare API Token');
    } catch (err: any) {
      setCfPairError(err.message || 'Invalid characters in Cloudflare credentials');
      return;
    }

    const pairResult = pairCloudflareCredentials(cfAccountInput, cfTokenInput);
    if (!pairResult.valid) {
      setCfPairError(pairResult.error || 'Invalid credential configuration.');
      return;
    }

    const newItems = pairResult.credentials.map((c, idx) => ({
      keyOrToken: c.apiToken,
      accountId: c.accountId,
      label: `CF Token ${formStagedKeys.length + idx + 1}`,
      health: 'ACTIVE' as const,
    }));

    setFormStagedKeys(prev => [...prev, ...newItems]);
    setCfAccountInput('');
    setCfTokenInput('');
  };

  const handleAddStandardKey = () => {
    setKeyInputError(null);
    if (!singleKeyInput.trim()) return;
    try {
      const tokens = parseTokens(singleKeyInput);
      if (tokens.length === 0) return;

      const validated = tokens.map(tok => validateCredentialString(tok, 'API Key'));
      const newItems = validated.map((tok, idx) => ({
        keyOrToken: tok,
        label: `Key ${formStagedKeys.length + idx + 1}`,
        health: 'ACTIVE' as const,
      }));

      setFormStagedKeys(prev => [...prev, ...newItems]);
      setSingleKeyInput('');
    } catch (err: any) {
      setKeyInputError(err.message || 'Invalid characters in API key');
    }
  };

  const handleRemoveStagedKey = (index: number) => {
    setFormStagedKeys(prev => prev.filter((_, i) => i !== index));
  };

  const handleScanOllama = async () => {
    setIsScanningOllama(true);
    setOllamaScanMsg(null);
    try {
      const endpoint = formEndpoint.trim() || 'http://localhost:11434';
      const models = await aiService.refreshOllamaModels(endpoint);
      if (models.length > 0) {
        setOllamaScanMsg(`✓ Discovered ${models.length} installed model(s): ${models.map(m => m.displayName).join(', ')}`);
        if (formDefaultModel === 'auto' || !models.some(m => m.id === formDefaultModel)) {
          setFormDefaultModel(models[0].id);
        }
      } else {
        setOllamaScanMsg('No models returned. Verify that Ollama is running and has models installed (`ollama list`).');
      }
    } catch {
      setOllamaScanMsg('Could not reach Ollama at endpoint. Make sure Ollama is running locally.');
    } finally {
      setIsScanningOllama(false);
    }
  };

  const handleApplyPreset = (preset: 'openai' | 'anthropic' | 'gemini' | 'generic_json') => {
    setCustomPreset(preset);
    if (preset === 'openai') {
      setFormEndpoint('https://api.openai.com/v1/chat/completions');
      setCustomAuthType('bearer');
      setCustomRequestTemplate(JSON.stringify({ model: '{{model}}', messages: '{{messages}}' }, null, 2));
      setCustomResponsePath('$.choices[0].message.content');
    } else if (preset === 'anthropic') {
      setFormEndpoint('https://api.anthropic.com/v1/messages');
      setCustomAuthType('custom');
      setCustomAuthHeader('x-api-key');
      setCustomRequestTemplate(JSON.stringify({ model: '{{model}}', max_tokens: 4096, messages: '{{messages}}' }, null, 2));
      setCustomResponsePath('$.content[0].text');
    } else if (preset === 'gemini') {
      setFormEndpoint('https://generativelanguage.googleapis.com/v1beta/models');
      setCustomAuthType('custom');
      setCustomAuthHeader('x-goog-api-key');
      setCustomRequestTemplate(JSON.stringify({ contents: [{ role: 'user', parts: [{ text: '{{prompt}}' }] }] }, null, 2));
      setCustomResponsePath('$.candidates[0].content.parts[0].text');
    } else {
      setFormEndpoint('http://localhost:8000/v1/generate');
      setCustomAuthType('bearer');
      setCustomRequestTemplate(JSON.stringify({ model: '{{model}}', prompt: '{{prompt}}' }, null, 2));
      setCustomResponsePath('$.response.text');
    }
  };

  const handleSaveModal = () => {
    if (!editingProvider) return;

    const providerId = editingProvider.id;
    const isCustom = formType === 'custom';

    let finalStagedKeys = [...formStagedKeys];

    // 1. Auto-stage Cloudflare credentials if user entered them in input fields
    if (formType === 'cloudflare') {
      setCfPairError(null);
      if (cfAccountInput.trim() || cfTokenInput.trim()) {
        if (!cfAccountInput.trim() || !cfTokenInput.trim()) {
          setCfPairError('Both Account ID and API Token are required to save.');
          return;
        }

        try {
          validateCredentialString(cfAccountInput.trim(), 'Cloudflare Account ID');
          validateCredentialString(cfTokenInput.trim(), 'Cloudflare API Token');
        } catch (err: any) {
          setCfPairError(err.message || 'Invalid characters in Cloudflare credentials');
          return;
        }

        const pairResult = pairCloudflareCredentials(cfAccountInput, cfTokenInput);
        if (!pairResult.valid) {
          setCfPairError(pairResult.error || 'Invalid credential configuration.');
          return;
        }

        const newItems = pairResult.credentials.map((c, idx) => ({
          keyOrToken: c.apiToken,
          accountId: c.accountId,
          label: `CF Token ${finalStagedKeys.length + idx + 1}`,
          health: 'ACTIVE' as const,
        }));
        finalStagedKeys.push(...newItems);

        // Also persist to settingsService for cross-session recovery
        settingsService.saveSettings({
          cloudflareAccountId: pairResult.credentials[0].accountId,
          cloudflareApiToken: pairResult.credentials[0].apiToken,
          aiProvider: 'cloudflare',
        });
      }
    }

    // 2. Auto-stage standard API keys if user entered them in singleKeyInput
    if (formType !== 'cloudflare' && formType !== 'ollama' && singleKeyInput.trim()) {
      setKeyInputError(null);
      try {
        const tokens = parseTokens(singleKeyInput);
        if (tokens.length > 0) {
          const validated = tokens.map(tok => validateCredentialString(tok, 'API Key'));
          const newItems = validated.map((tok, idx) => ({
            keyOrToken: tok,
            label: `Key ${finalStagedKeys.length + idx + 1}`,
            health: 'ACTIVE' as const,
          }));
          finalStagedKeys.push(...newItems);

          // Sync to settingsService if built-in provider
          if (['gemini', 'openai', 'anthropic'].includes(formType)) {
            settingsService.saveSettings({
              apiKey: validated[0],
              apiKeys: validated,
              aiProvider: formType as any,
            });
          }
        }
      } catch (err: any) {
        setKeyInputError(err.message || 'Invalid characters in API key');
        return;
      }
    }

    const updatedConfig: AIProviderConfig = {
      ...editingProvider,
      displayName: formName.trim() || editingProvider.displayName,
      endpoint: formEndpoint.trim() || undefined,
      defaultModelId: formDefaultModel,
      providerType: formType,
    };

    if (isCustom) {
      updatedConfig.customConfig = {
        httpMethod: 'POST',
        model: formDefaultModel || 'custom-model',
        headers: { 'Content-Type': 'application/json' },
        outputType: 'text',
        preset: customPreset,
        authType: customAuthType,
        authHeaderName: customAuthHeader.trim() || undefined,
        requestJsonTemplate: customRequestTemplate,
        responseJsonPath: customResponsePath.trim() || '$.choices[0].message.content',
        capabilities: customCapabilities,
      };

      // Register the custom model in modelRegistry
      modelRegistry.registerCustomModel({
        id: formDefaultModel || 'custom-model',
        providerId: 'custom',
        displayName: `${formName} (${formDefaultModel || 'Custom'})`,
        capabilities: customCapabilities,
        enabled: true,
        recommendedFor: ['general'],
        availability: 'available',
        tags: ['General'],
      });
    }

    aiService.saveProvider(updatedConfig);

    // Save secrets if not ollama
    if (formType !== 'ollama') {
      aiService.setProviderCredentials(
        providerId,
        finalStagedKeys.map(k => ({
          id: k.id,
          keyOrToken: k.keyOrToken,
          accountId: k.accountId,
          label: k.label,
        }))
      );
    }

    setProviders(aiService.getProviders());
    setCanFallback(aiService.canEnableCrossProviderFallback());
    setIsEditorOpen(false);
  };

  const handleDeleteProvider = (id: string) => {
    aiService.deleteProvider(id);
    setProviders(aiService.getProviders());
    setCanFallback(aiService.canEnableCrossProviderFallback());
  };

  const handleToggleMcp = (id: string) => {
    toolRegistry.toggleServer(id);
    setMcpServers([...toolRegistry.getServers()]);
  };

  const getStatusBadge = (status: AIProviderConfig['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            Connected
          </span>
        );
      case 'connecting':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#F59E0B', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            Connecting
          </span>
        );
      case 'rate_limited':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#F97316', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F97316' }} />
            Rate Limited
          </span>
        );
      case 'invalid_credentials':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
            Invalid Credentials
          </span>
        );
      case 'temporarily_unavailable':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#F59E0B', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            Temporarily Unavailable
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--muted, #9CA3AF)', fontWeight: 500 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border, #D1D5DB)' }} />
            Not Configured
          </span>
        );
    }
  };

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background, #FFFFFF)',
        color: 'var(--foreground, #111111)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header with Tab Bar */}
      <div
        style={{
          height: '52px',
          borderBottom: '1px solid var(--border, #E7E7E7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          backgroundColor: 'var(--surface, #FFFFFF)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground, #111111)', margin: 0 }}>
            Connections
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {[
              { id: 'ai_providers' as const, label: 'AI Providers' },
              { id: 'mcp' as const, label: 'MCP Tools' },
              { id: 'apis' as const, label: 'Custom APIs' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: activeTab === tab.id ? 'var(--foreground, #111111)' : 'var(--muted, #6B7280)',
                  backgroundColor: activeTab === tab.id ? 'var(--surface-secondary, #F3F4F6)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTab === 'ai_providers' && (
            <button
              onClick={handleOpenAddCustom}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--foreground, #111111)',
                color: 'var(--background, #FFFFFF)',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              <span>Add Custom AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          padding: '24px 28px',
          overflowY: 'auto',
          maxWidth: '860px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* ========================================================
            TAB 1: AI PROVIDERS
            ======================================================== */}
        {activeTab === 'ai_providers' && (
          <div>
            {/* Cross-Provider Fallback Setting Banner */}
            <div
              style={{
                backgroundColor: 'var(--surface, #FFFFFF)',
                borderRadius: '10px',
                border: '1px solid var(--border, #E7E7E7)',
                padding: '16px 20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(37, 150, 190, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent, #2596BE)',
                      flexShrink: 0,
                    }}
                  >
                    <Zap size={16} />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: canFallback ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--foreground, #111111)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={fallbackEnabled}
                        disabled={!canFallback}
                        onChange={(e) => handleToggleFallback(e.target.checked)}
                        style={{ cursor: canFallback ? 'pointer' : 'not-allowed' }}
                      />
                      <span>Switch to another AI provider when this provider reaches its limit</span>
                    </label>
                    <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)', marginTop: '4px', lineHeight: 1.5 }}>
                      {canFallback
                        ? 'If the active provider encounters rate limits or quota exhaustion, Aven automatically tries secondary credentials, then falls back to your next configured provider.'
                        : 'Unavailable. Requires at least 2 configured AI providers with valid credentials.'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: fallbackEnabled ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-secondary, #F3F4F6)', color: fallbackEnabled ? '#10B981' : 'var(--muted, #6B7280)', flexShrink: 0 }}>
                  {fallbackEnabled ? 'Active' : 'Off (Default)'}
                </div>
              </div>
            </div>

            {/* Providers List Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Configured AI Providers
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)', marginTop: '2px' }}>
                  Aven resolves models dynamically based on task requirements, credentials, and priority order.
                </div>
              </div>
            </div>

            {/* Providers Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {providers.map((p, idx) => {
                const creds = credentialManager.getCredentialsSummary(p.id);
                const activeCount = creds.filter(c => c.health === 'ACTIVE').length;
                const rateLimitedCount = creds.filter(c => c.health === 'RATE_LIMITED').length;
                const availableModels = modelRegistry.getModelsForProvider(p.providerType);
                const isTestingThis = testingProviderId === p.id;
                const testResultThis = testResults[p.id];

                return (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: 'var(--surface, #FFFFFF)',
                      borderRadius: '10px',
                      border: '1px solid var(--border, #E7E7E7)',
                      padding: '16px 20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      opacity: p.enabled ? 1 : 0.65,
                      transition: 'opacity 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                      {/* Left: Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                        {/* Priority Badge & Reorder */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <button
                            onClick={() => handleReorder(p.id, 'up')}
                            disabled={idx === 0}
                            style={{
                              border: 'none',
                              background: 'none',
                              cursor: idx === 0 ? 'default' : 'pointer',
                              color: idx === 0 ? 'var(--border, #E5E7EB)' : 'var(--muted, #6B7280)',
                              padding: '2px',
                            }}
                            title="Move up in priority"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted, #9CA3AF)', fontFamily: 'monospace' }}>
                            #{idx + 1}
                          </span>
                          <button
                            onClick={() => handleReorder(p.id, 'down')}
                            disabled={idx === providers.length - 1}
                            style={{
                              border: 'none',
                              background: 'none',
                              cursor: idx === providers.length - 1 ? 'default' : 'pointer',
                              color: idx === providers.length - 1 ? 'var(--border, #E5E7EB)' : 'var(--muted, #6B7280)',
                              padding: '2px',
                            }}
                            title="Move down in priority"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>

                        {/* Icon */}
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(37, 150, 190, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent, #2596BE)',
                            flexShrink: 0,
                          }}
                        >
                          <Bot size={18} />
                        </div>

                        {/* Details */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground, #111111)' }}>
                              {p.displayName}
                            </span>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--surface-secondary, #F3F4F6)', color: 'var(--muted, #6B7280)', fontWeight: 600 }}>
                              {p.providerType}
                            </span>
                            {getStatusBadge(p.status)}
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span>
                              Default Model: <strong style={{ color: 'var(--foreground, #111111)' }}>
                                {p.defaultModelId === 'auto' ? 'Auto Selection' : (availableModels.find(m => m.id === p.defaultModelId)?.displayName || p.defaultModelId)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              {availableModels.length} {p.providerType === 'cloudflare' ? 'multimodal ' : ''}model{availableModels.length === 1 ? '' : 's'}
                            </span>
                            <span>•</span>
                            <span>
                              {p.providerType === 'ollama'
                                ? 'Local engine'
                                : `${creds.length} credential${creds.length === 1 ? '' : 's'} configured`}
                            </span>
                            {creds.length > 0 && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#10B981', fontSize: '10px' }}>● {activeCount} active</span>
                                {rateLimitedCount > 0 && (
                                  <span style={{ color: '#F97316', fontSize: '10px' }}>● {rateLimitedCount} limited</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {/* Test Connection Button */}
                        <button
                          onClick={() => handleTestConnection(p.id)}
                          disabled={isTestingThis || (p.status === 'not_configured' && p.providerType !== 'ollama')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 500,
                            backgroundColor: 'transparent',
                            border: '1px solid var(--border, #E5E7EB)',
                            color: 'var(--foreground, #374151)',
                            cursor: (p.status === 'not_configured' && p.providerType !== 'ollama') ? 'not-allowed' : 'pointer',
                          }}
                          title="Validate credentials and test model generation"
                        >
                          <Activity size={12} color="var(--accent, #2596BE)" />
                          <span>{isTestingThis ? 'Testing...' : 'Test'}</span>
                        </button>

                        {/* Configure / Manage */}
                        <button
                          onClick={() => handleOpenEdit(p)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                            border: '1px solid var(--border, #E5E7EB)',
                            color: 'var(--foreground, #374151)',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={12} />
                          <span>Configure</span>
                        </button>

                        {/* Enabled / Disabled Toggle */}
                        <button
                          onClick={() => handleToggleProvider(p.id)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 500,
                            backgroundColor: p.enabled ? 'rgba(37, 150, 190, 0.08)' : 'var(--surface-secondary, #F3F4F6)',
                            color: p.enabled ? 'var(--accent, #2596BE)' : 'var(--muted, #6B7280)',
                            border: p.enabled ? '1px solid rgba(37, 150, 190, 0.25)' : '1px solid var(--border, #E5E7EB)',
                            cursor: 'pointer',
                          }}
                          title={p.enabled ? 'Disable provider' : 'Enable provider'}
                        >
                          {p.enabled ? 'Enabled' : 'Disabled'}
                        </button>

                        {/* Delete button (for custom or additional providers) */}
                        {p.providerType === 'custom' && (
                          <button
                            onClick={() => handleDeleteProvider(p.id)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'var(--muted, #9CA3AF)',
                              cursor: 'pointer',
                            }}
                            title="Delete custom provider"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline test message if available */}
                    {testResultThis && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          backgroundColor: testResultThis.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          color: testResultThis.success ? '#10B981' : '#EF4444',
                          border: `1px solid ${testResultThis.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{testResultThis.message}</span>
                        <button
                          onClick={() => setTestResults(prev => { const n = { ...prev }; delete n[p.id]; return n; })}
                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: MCP TOOLS
            ======================================================== */}
        {activeTab === 'mcp' && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Model Context Protocol (MCP) Tool Registry
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)', marginBottom: '14px' }}>
              The AI agent runtime only receives tools from connected and enabled MCP servers. Unconfigured external tools (like Google Drive) are automatically excluded.
            </div>

            <div style={{ backgroundColor: 'var(--surface, #FFFFFF)', borderRadius: '10px', border: '1px solid var(--border, #E7E7E7)', overflow: 'hidden' }}>
              {mcpServers.map((server, idx) => (
                <div
                  key={server.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: idx < mcpServers.length - 1 ? '1px solid var(--border, #F3F4F6)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: server.enabled && server.status === 'connected' ? '#10B981' : 'var(--border, #D1D5DB)',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground, #111111)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{server.name}</span>
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--surface-secondary, #F3F4F6)', color: 'var(--muted, #6B7280)', textTransform: 'uppercase', fontWeight: 600 }}>
                          {server.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)', marginTop: '2px' }}>
                        {server.description}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--accent, #2596BE)', marginTop: '3px', fontFamily: 'monospace' }}>
                        {server.tools.length} tool{server.tools.length === 1 ? '' : 's'}: {server.tools.map(t => t.name).join(', ')}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleMcp(server.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 500,
                      backgroundColor: server.enabled ? 'rgba(37, 150, 190, 0.08)' : 'var(--surface-secondary, #F3F4F6)',
                      color: server.enabled ? 'var(--accent, #2596BE)' : 'var(--muted, #6B7280)',
                      border: server.enabled ? '1px solid rgba(37, 150, 190, 0.25)' : '1px solid var(--border, #E5E7EB)',
                      cursor: 'pointer',
                    }}
                  >
                    {server.enabled ? 'Connected' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: CUSTOM APIS
            ======================================================== */}
        {activeTab === 'apis' && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Custom &amp; Remote APIs
            </div>
            <div style={{ backgroundColor: 'var(--surface, #FFFFFF)', borderRadius: '10px', border: '1px solid var(--border, #E7E7E7)', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Arbitrary Endpoints &amp; Subagent Pipelines
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted, #6B7280)', lineHeight: 1.5, margin: 0 }}>
                Aven supports custom AI endpoints with arbitrary JSON schemas, JSONPath output extraction, streaming, and credential rotation pools. Configure your custom endpoints in the <strong>AI Providers</strong> tab using the <strong>Add Custom AI</strong> button.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          PROVIDER EDITOR MODAL
          ======================================================== */}
      {isEditorOpen && editingProvider && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setIsEditorOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              backgroundColor: 'var(--surface, #FFFFFF)',
              color: 'var(--foreground, #111111)',
              borderRadius: '14px',
              border: '1px solid var(--border, #E5E7EB)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid var(--border, #E7E7E7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>
                  {isNewCustom ? 'Add Custom AI Provider' : `Configure ${editingProvider.displayName}`}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)' }}>
                  Manage credentials, models, and execution routing
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted, #6B7280)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                flex: 1,
                padding: '20px 22px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Display Name */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                  Provider Display Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Google Gemini, Cloudflare Edge"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border, #D1D5DB)',
                    backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                    color: 'var(--foreground, #111111)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Default Model Selector */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                  Selected / Default Model
                </label>
                <select
                  value={formDefaultModel}
                  onChange={(e) => setFormDefaultModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border, #D1D5DB)',
                    backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                    color: 'var(--foreground, #111111)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="auto">Auto (Intelligent task routing)</option>
                  {modelRegistry.getModelsForProvider(formType).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} {m.capabilities.vision ? '• Vision' : ''} {m.capabilities.reasoning ? '• Reasoning' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ========================================================
                  PROVIDER-SPECIFIC CREDENTIAL SECTIONS
                  ======================================================== */}

              {/* 1. CLOUDFLARE WORKERS AI */}
              {formType === 'cloudflare' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground, #111111)' }}>
                    Cloudflare Workers AI Credentials
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        Account ID
                      </label>
                      <input
                        type="text"
                        value={cfAccountInput}
                        onChange={(e) => setCfAccountInput(e.target.value)}
                        placeholder="Enter Cloudflare Account ID"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        API Token
                      </label>
                      <input
                        type="password"
                        value={cfTokenInput}
                        onChange={(e) => setCfTokenInput(e.target.value)}
                        placeholder="Enter Workers AI API Token"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>
                    Multiple credentials can be added for automatic credential rotation.
                  </div>

                  {cfPairError && (
                    <div style={{ fontSize: '11px', color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                      {cfPairError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleAddCloudflareCredentials}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--surface-secondary, #F3F4F6)',
                        border: '1px solid var(--border, #D1D5DB)',
                        color: 'var(--foreground, #111111)',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      + Add Credential
                    </button>
                  </div>
                </div>
              )}

              {/* 2. GEMINI, OPENAI, ANTHROPIC, OR CUSTOM (KEY-BASED) */}
              {(formType === 'gemini' || formType === 'openai' || formType === 'anthropic' || formType === 'custom') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500 }}>
                    {formType === 'anthropic' ? 'Anthropic API Key' : formType === 'gemini' ? 'Google Gemini API Key' : 'API Key'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="password"
                      value={singleKeyInput}
                      onChange={(e) => setSingleKeyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddStandardKey();
                        }
                      }}
                      placeholder="Enter API key"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border, #D1D5DB)',
                        backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                        color: 'var(--foreground, #111111)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddStandardKey}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--accent, #2596BE)',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Add Key
                    </button>
                  </div>
                  {keyInputError && (
                    <div style={{ fontSize: '11px', color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                      {keyInputError}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>
                    Multiple credentials can be added for automatic credential rotation.
                  </div>
                </div>
              )}

              {/* 3. OLLAMA LOCAL AI */}
              {formType === 'ollama' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Local Ollama Endpoint URL
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={formEndpoint || 'http://localhost:11434'}
                        onChange={(e) => setFormEndpoint(e.target.value)}
                        placeholder="http://localhost:11434"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleScanOllama}
                        disabled={isScanningOllama}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--accent, #2596BE)',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 500,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <RefreshCw size={12} className={isScanningOllama ? 'spin' : ''} />
                        <span>{isScanningOllama ? 'Scanning...' : 'Scan Local Models'}</span>
                      </button>
                    </div>
                  </div>

                  {ollamaScanMsg && (
                    <div style={{ fontSize: '11px', color: ollamaScanMsg.startsWith('✓') ? '#10B981' : '#EF4444', backgroundColor: ollamaScanMsg.startsWith('✓') ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', padding: '8px 10px', borderRadius: '6px' }}>
                      {ollamaScanMsg}
                    </div>
                  )}
                </div>
              )}

              {/* MASKED CREDENTIALS LIST (For key-based or cloudflare providers) */}
              {formType !== 'ollama' && formStagedKeys.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted, #6B7280)' }}>
                      Configured Credentials ({formStagedKeys.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormStagedKeys([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        fontWeight: 500,
                      }}
                      title="Clear all configured credentials"
                    >
                      Clear All
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {formStagedKeys.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          border: '1px solid var(--border, #E5E7EB)',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
                          <Key size={12} color="var(--accent, #2596BE)" />
                          {c.accountId && <span>Account: {maskAccountId(c.accountId)} | </span>}
                          <span>Token: {maskApiKey(c.keyOrToken)}</span>
                          <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', backgroundColor: c.health === 'RATE_LIMITED' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: c.health === 'RATE_LIMITED' ? '#F97316' : '#10B981', fontWeight: 600 }}>
                            {c.health || 'ACTIVE'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedKey(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--muted, #9CA3AF)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================
                  CUSTOM AI SPECIFICS (Presets, Format, Variables, Mapping)
                  ======================================================== */}
              {formType === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border, #E7E7E7)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Custom API Schema &amp; Request Mapping</div>

                  {/* Preset Selector */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Schema Preset
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { id: 'openai' as const, label: 'OpenAI-compatible' },
                        { id: 'anthropic' as const, label: 'Anthropic-compatible' },
                        { id: 'gemini' as const, label: 'Gemini-compatible' },
                        { id: 'generic_json' as const, label: 'Generic REST' },
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleApplyPreset(p.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 500,
                            backgroundColor: customPreset === p.id ? 'var(--foreground, #111111)' : 'var(--surface-secondary, #F3F4F6)',
                            color: customPreset === p.id ? 'var(--background, #FFFFFF)' : 'var(--foreground, #374151)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Endpoint & Auth */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        Endpoint URL
                      </label>
                      <input
                        type="text"
                        value={formEndpoint}
                        onChange={(e) => setFormEndpoint(e.target.value)}
                        placeholder="https://..."
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        Authentication
                      </label>
                      <select
                        value={customAuthType}
                        onChange={(e) => setCustomAuthType(e.target.value as any)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="bearer">Bearer Token</option>
                        <option value="custom">Custom Header</option>
                        <option value="api_key">API Key Header</option>
                        <option value="none">None / Public</option>
                      </select>
                    </div>
                  </div>

                  {customAuthType === 'custom' && (
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        Custom Header Name
                      </label>
                      <input
                        type="text"
                        value={customAuthHeader}
                        onChange={(e) => setCustomAuthHeader(e.target.value)}
                        placeholder="e.g. x-api-key, Authorization"
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}

                  {/* Request Template */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 500 }}>
                        Request JSON Template
                      </label>
                      <div style={{ fontSize: '10px', color: 'var(--muted, #6B7280)', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {['{{prompt}}', '{{system_prompt}}', '{{messages}}', '{{model}}', '{{images}}', '{{user_input}}'].map(tag => (
                          <code key={tag} style={{ backgroundColor: 'var(--surface-secondary, #F3F4F6)', padding: '1px 4px', borderRadius: '3px' }}>
                            {tag}
                          </code>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      value={customRequestTemplate}
                      onChange={(e) => setCustomRequestTemplate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border, #D1D5DB)',
                        backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                        color: 'var(--foreground, #111111)',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Response JSONPath Output Mapping */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Output JSONPath Mapping (e.g. <code>$.choices[0].message.content</code> or <code>$.response.text</code>)
                    </label>
                    <input
                      type="text"
                      value={customResponsePath}
                      onChange={(e) => setCustomResponsePath(e.target.value)}
                      placeholder="$.choices[0].message.content"
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border, #D1D5DB)',
                        backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                        color: 'var(--foreground, #111111)',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Capabilities Checkboxes */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Declared Capabilities
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {[
                        { key: 'text' as const, label: 'Text' },
                        { key: 'vision' as const, label: 'Vision' },
                        { key: 'reasoning' as const, label: 'Reasoning' },
                        { key: 'toolCalling' as const, label: 'Tool Calling' },
                        { key: 'structuredOutput' as const, label: 'Structured Output' },
                        { key: 'streaming' as const, label: 'Streaming' },
                        { key: 'imageGeneration' as const, label: 'Image Gen' },
                        { key: 'audioInput' as const, label: 'Audio' },
                      ].map(cap => (
                        <label key={cap.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={customCapabilities[cap.key]}
                            onChange={(e) => setCustomCapabilities(prev => ({ ...prev, [cap.key]: e.target.checked }))}
                          />
                          <span>{cap.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 22px',
                borderTop: '1px solid var(--border, #E7E7E7)',
                backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface, #FFFFFF)',
                  border: '1px solid var(--border, #D1D5DB)',
                  color: 'var(--muted, #6B7280)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                style={{
                  padding: '7px 18px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent, #2596BE)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionList;
