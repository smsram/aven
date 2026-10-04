import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Laptop,
  Key,
  Shield,
  Mic,
  Sliders,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Server,
  Cloud,
  Eye,
  EyeOff,
  Cpu
} from 'lucide-react';
import AvenMark from './AvenMark';
import WindowControls from './WindowControls';
import { useTheme } from '../context/ThemeContext';
import settingsService, {
  AvenSettings,
  ThemeOption,
  AiProviderOption,
  AutonomyLevel,
  ResponseStyle,
  parseApiKeys
} from '../services/settingsService';

interface OnboardingViewProps {
  onComplete: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const { theme, setTheme } = useTheme();
  const currentSettings = settingsService.getSettings();

  const [step, setStep] = useState(1);
  const totalSteps = 12;

  // Form State
  const [userName, setUserName] = useState(currentSettings.userName || 'Alex R.');
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(theme);
  const [selectedProvider, setSelectedProvider] = useState<AiProviderOption>(currentSettings.aiProvider || 'gemini');
  
  // Standard Provider API Keys (supports multiple / comma-separated)
  const [apiKeyInput, setApiKeyInput] = useState(currentSettings.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);

  // Cloudflare Credentials
  const [cfAccountId, setCfAccountId] = useState(currentSettings.cloudflareAccountId || '');
  const [cfApiToken, setCfApiToken] = useState(currentSettings.cloudflareApiToken || '');
  const [cfModel, setCfModel] = useState(currentSettings.cloudflareModel || '@cf/google/gemma-4-26b-a4b-it');

  // Selected Model for Onboarding
  const [selectedModel, setSelectedModel] = useState(() => {
    if (currentSettings.aiProvider === 'gemini') return 'gemini-3.8-flash';
    if (currentSettings.aiProvider === 'openai') return 'gpt-5.4';
    if (currentSettings.aiProvider === 'anthropic') return 'claude-sonnet-5.5';
    if (currentSettings.aiProvider === 'cloudflare') return '@cf/google/gemma-4-26b-a4b-it';
    return 'auto';
  });

  // Ollama / Local AI fields
  const [ollamaUrl, setOllamaUrl] = useState(currentSettings.ollamaEndpoint || 'http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState(currentSettings.ollamaModel || 'auto');

  // Custom AI fields (simple in onboarding, advanced inside app)
  const [customUrl, setCustomUrl] = useState(currentSettings.customEndpoint || 'http://localhost:8000/v1');
  const [customKey, setCustomKey] = useState('');
  const [customModel, setCustomModel] = useState('custom-model');

  // Permissions
  const [mouseKeyboard, setMouseKeyboard] = useState(currentSettings.computerPermissions.mouseKeyboardControl);
  const [screenPerception, setScreenPerception] = useState(currentSettings.computerPermissions.screenPerception);
  const [fullscreenControl, setFullscreenControl] = useState(currentSettings.computerPermissions.fullscreenInteraction);

  // Voice & Autonomy
  const [voiceShortcut] = useState(currentSettings.voiceShortcut || 'Hold Ctrl + Space');
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(currentSettings.autonomyLevel || 'balanced');
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>(currentSettings.responseStyle || 'concise');

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      // Parse keys
      const parsedKeys = parseApiKeys(apiKeyInput);

      const finalSettings: Partial<AvenSettings> = {
        userName,
        theme: selectedTheme,
        aiProvider: selectedProvider,
        apiKeys: parsedKeys.length > 0 ? parsedKeys : (selectedProvider === 'gemini' ? ['AIzaSyD-sample-gemini-key-1'] : []),
        apiKey: parsedKeys[0] || (selectedProvider === 'gemini' ? 'AIzaSyD-sample-gemini-key-1' : ''),
        cloudflareAccountId: cfAccountId,
        cloudflareApiToken: cfApiToken,
        cloudflareModel: cfModel,
        ollamaEndpoint: ollamaUrl,
        ollamaModel: ollamaModel,
        customEndpoint: customUrl,
        computerPermissions: {
          mouseKeyboardControl: mouseKeyboard,
          screenPerception,
          fullscreenInteraction: fullscreenControl,
          destructiveConfirmation: true,
        },
        voiceShortcut,
        autonomyLevel,
        responseStyle,
        onboardingCompleted: true,
      };

      settingsService.completeOnboarding(finalSettings);
      setTheme(selectedTheme);
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleThemeChange = (newTheme: ThemeOption) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--background, #FFFFFF)',
        color: 'var(--foreground, #111111)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Native Window Titlebar for Onboarding */}
      <div
        className="titlebar-drag-region"
        style={{
          height: '38px',
          backgroundColor: 'var(--titlebar-bg, #F7F7F8)',
          borderBottom: '1px solid var(--border, #E7E7E7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '16px',
          paddingRight: '0px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted, #6B7280)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Aven Setup
          </span>
          <span style={{ fontSize: '11px', color: 'var(--muted, #9CA3AF)' }}>•</span>
          <span style={{ fontSize: '11px', color: 'var(--muted, #9CA3AF)' }}>
            Step {step} of {totalSteps}
          </span>
        </div>
        <WindowControls />
      </div>

      {/* Progress Track */}
      <div
        style={{
          height: '3px',
          width: '100%',
          backgroundColor: 'var(--border, #E5E7EB)',
          position: 'relative',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            backgroundColor: 'var(--accent, #2596BE)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ duration: 0.25 }}
        />
      </div>

      {/* Full-Screen Centered Content Body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 32px',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '580px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <AnimatePresence mode="wait">
            {/* 1. Splash */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                style={{ textAlign: 'center', padding: '16px 0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '22px' }}>
                  <AvenMark size={64} color="#2596BE" />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                  Aven
                </h1>
                <p style={{ fontSize: '15px', color: 'var(--muted, #6B7280)', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                  The autonomous AI computer agent that lives on your Windows desktop.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border, #E5E7EB)', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: 'var(--foreground, #4B5563)' }}>
                  Operates apps • Browses the web • Manages files • Companion phone
                </div>
              </motion.div>
            )}

            {/* 2. Welcome */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <AvenMark size={28} color="#2596BE" />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                  Welcome to Aven
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--muted, #6B7280)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
                  Aven operates your computer directly using natural language instructions. It launches applications, organizes files, compares options online, and handles multi-step workflows autonomously.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border, #E5E7EB)' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: 'var(--foreground, #111111)' }}>Autonomous Operation</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)', lineHeight: 1.4 }}>Executes multi-step tasks across Windows apps and browser tabs.</div>
                  </div>
                  <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border, #E5E7EB)' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: 'var(--foreground, #111111)' }}>Safety &amp; Checkpoints</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)', lineHeight: 1.4 }}>Automatic recovery points and undo for safe computer control.</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. Optional Google Sign-In */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>
                  Account &amp; Sync (Optional)
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted, #6B7280)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                  Sign in with Google to synchronize memory, preferences, and connected devices across workstations, or continue locally as a guest.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUserName('Alex R.');
                      handleNext();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '13px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #D1D5DB)',
                      backgroundColor: 'var(--surface, #FFFFFF)',
                      color: 'var(--foreground, #111111)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--muted, #6B7280)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Skip and continue as Local Guest
                  </button>
                </div>
              </motion.div>
            )}

            {/* 4. Name */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>
                  What should Aven call you?
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted, #6B7280)', margin: '0 0 20px 0' }}>
                  Aven personalizes briefings and conversation using your preferred name.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={20} color="var(--muted, #6B7280)" />
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name..."
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #D1D5DB)',
                      backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                      color: 'var(--foreground, #111111)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {/* 5. Theme */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>
                  Select Appearance
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted, #6B7280)', margin: '0 0 20px 0' }}>
                  Aven adapts cleanly to your system preferences with tailored light and dark designs.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { id: 'system' as ThemeOption, label: 'System', icon: Laptop, desc: 'Syncs with Windows' },
                    { id: 'light' as ThemeOption, label: 'Light', icon: Sun, desc: 'Clean & crisp' },
                    { id: 'dark' as ThemeOption, label: 'Dark', icon: Moon, desc: 'Low-light contrast' },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = selectedTheme === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        style={{
                          padding: '18px 12px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid var(--accent, #2596BE)' : '1px solid var(--border, #E5E7EB)',
                          backgroundColor: isSelected ? 'rgba(37, 150, 190, 0.06)' : 'var(--surface-secondary, #F9FAFB)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon size={24} color={isSelected ? '#2596BE' : 'var(--muted, #6B7280)'} style={{ margin: '0 auto 8px auto' }} />
                        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', color: 'var(--foreground, #111111)' }}>{t.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>{t.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 6. AI Provider Selection (Gemini, OpenAI, Claude, Cloudflare, Ollama, Custom AI) */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>
                  Select AI Provider
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted, #6B7280)', margin: '0 0 18px 0' }}>
                  Choose which model engine powers Aven's reasoning and computer automation.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { id: 'gemini' as AiProviderOption, name: 'Google Gemini', desc: 'Gemini 2.5 Flash / Pro (Recommended)' },
                    { id: 'openai' as AiProviderOption, name: 'OpenAI / ChatGPT', desc: 'GPT-4o & reasoning models' },
                    { id: 'anthropic' as AiProviderOption, name: 'Anthropic Claude', desc: 'Claude 3.7 Sonnet computer-use' },
                    { id: 'cloudflare' as AiProviderOption, name: 'Cloudflare Workers AI', desc: 'Serverless Edge AI execution' },
                    { id: 'ollama' as AiProviderOption, name: 'Ollama / Local AI', desc: '100% offline local inference' },
                    { id: 'custom' as AiProviderOption, name: 'Custom AI', desc: 'Private OpenAI-compatible endpoint' },
                  ].map((p) => {
                    const isSelected = selectedProvider === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProvider(p.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid var(--accent, #2596BE)' : '1px solid var(--border, #E5E7EB)',
                          backgroundColor: isSelected ? 'rgba(37, 150, 190, 0.06)' : 'var(--surface-secondary, #F9FAFB)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--foreground, #111111)' }}>
                          <span>{p.name}</span>
                          {isSelected && <Check size={14} color="#2596BE" />}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>{p.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 7. Provider Credentials (STRICTLY PROVIDER SPECIFIC) */}
            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>
                  {selectedProvider === 'cloudflare' && 'Cloudflare Workers AI Configuration'}
                  {selectedProvider === 'ollama' && 'Local AI Connection'}
                  {selectedProvider === 'custom' && 'Custom AI Endpoint'}
                  {selectedProvider === 'gemini' && 'Google Gemini Configuration'}
                  {selectedProvider === 'openai' && 'OpenAI / ChatGPT Configuration'}
                  {selectedProvider === 'anthropic' && 'Anthropic Claude Configuration'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted, #6B7280)', margin: '0 0 18px 0' }}>
                  {selectedProvider === 'cloudflare' && 'Enter your Cloudflare Account ID and API Token.'}
                  {selectedProvider === 'ollama' && 'Enter your local Ollama server address. Installed models are discovered automatically.'}
                  {selectedProvider === 'custom' && 'Enter your custom endpoint URL and access key.'}
                  {['gemini', 'openai', 'anthropic'].includes(selectedProvider) && 'Enter your API key and choose your starting model.'}
                </p>

                {/* Cloudflare Fields */}
                {selectedProvider === 'cloudflare' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        Cloudflare Account ID
                      </label>
                      <input
                        type="text"
                        value={cfAccountId}
                        onChange={(e) => setCfAccountId(e.target.value)}
                        placeholder="Enter Cloudflare Account ID..."
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        Workers AI API Token
                      </label>
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={cfApiToken}
                        onChange={(e) => setCfApiToken(e.target.value)}
                        placeholder="Enter Cloudflare API token..."
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)', marginTop: '4px' }}>
                        Multiple credentials can be added for automatic credential rotation.
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        Default Multimodal Model
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => {
                          setSelectedModel(e.target.value);
                          setCfModel(e.target.value);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface, #FFFFFF)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="@cf/google/gemma-4-26b-a4b-it">Gemma 4 26B A4B (Preferred #1 • Vision &amp; Agent)</option>
                        <option value="@cf/meta/llama-4-scout-17b-16e-instruct">Llama 4 Scout (Preferred #2 • Reasoning &amp; Tools)</option>
                        <option value="@cf/qwen/qwen3.8-27b">Qwen 3.8 27B (Preferred #3 • Multimodal &amp; General)</option>
                        <option value="@cf/zai-org/glm-5.3-flash">GLM-5.3-Flash (Reasoning • Paid Tier)</option>
                        <option value="@cf/moonshotai/kimi-k2.6">Kimi K2.6 (Long Context • Paid Tier)</option>
                        <option value="@cf/moonshotai/kimi-k2.7-code">Kimi K2.7 Code (Coding Specialist)</option>
                        <option value="@cf/meta/llama-3.2-11b-vision-instruct">Llama 3.2 11B Vision (Vision Specialized)</option>
                        <option value="@cf/mistralai/mistral-small-3.1-24b-instruct">Mistral Small 3.1 24B (Fast • Tools)</option>
                        <option value="@cf/moondream/moondream3.1-9B-A2B">Moondream 3.1 9B (Vision Only)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Ollama / Local AI Fields */}
                {selectedProvider === 'ollama' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        Local AI Server URL &amp; Port
                      </label>
                      <input
                        type="text"
                        value={ollamaUrl}
                        onChange={(e) => setOllamaUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)', lineHeight: '1.4' }}>
                      Models will be discovered dynamically from your local Ollama instance upon connecting. Ensure your local daemon is running with <code>ollama serve</code>.
                    </div>
                  </div>
                )}

                {/* Custom AI Fields */}
                {selectedProvider === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        API Endpoint
                      </label>
                      <input
                        type="text"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://your-custom-endpoint/v1/chat/completions"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        API Key (Optional)
                      </label>
                      <input
                        type="password"
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        placeholder="Enter API key or bearer token..."
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)', marginTop: '4px' }}>
                        Multiple credentials can be added for automatic credential rotation.
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        Model Identifier
                      </label>
                      <input
                        type="text"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        placeholder="e.g. meta-llama/Llama-3.3-70B-Instruct"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>
                      Advanced request &amp; response JSON templates can be configured inside Connections &gt; AI Providers.
                    </div>
                  </div>
                )}

                {/* Standard Cloud Providers (Gemini, OpenAI, Anthropic) */}
                {['gemini', 'openai', 'anthropic'].includes(selectedProvider) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        API Key
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder={
                            selectedProvider === 'gemini'
                              ? 'Enter Gemini API key...'
                              : selectedProvider === 'openai'
                              ? 'Enter OpenAI API key...'
                              : 'Enter Anthropic API key...'
                          }
                          style={{
                            width: '100%',
                            padding: '10px 42px 10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border, #D1D5DB)',
                            backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                            color: 'var(--foreground, #111111)',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--muted, #6B7280)',
                            cursor: 'pointer',
                          }}
                        >
                          {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)', marginTop: '4px' }}>
                        Multiple credentials can be added for automatic credential rotation.
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        Model
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #D1D5DB)',
                          backgroundColor: 'var(--surface, #FFFFFF)',
                          color: 'var(--foreground, #111111)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      >
                        {selectedProvider === 'gemini' && (
                          <>
                            <option value="gemini-3.8-flash">Gemini 3.8 Flash (Primary Aven Model • Vision &amp; Agents)</option>
                            <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (High-Throughput &amp; Fast)</option>
                            <option value="gemini-3.7-flash">Gemini 3.7 Flash (Hybrid Reasoning)</option>
                          </>
                        )}
                        {selectedProvider === 'openai' && (
                          <>
                            <option value="gpt-5.4">GPT-5.4 (Flagship Agent • Computer Use &amp; Vision)</option>
                            <option value="gpt-5.4-mini">GPT-5.4 mini (Coding &amp; Subagents)</option>
                            <option value="gpt-5.4-nano">GPT-5.4 nano (Lightweight &amp; Fast)</option>
                          </>
                        )}
                        {selectedProvider === 'anthropic' && (
                          <>
                            <option value="claude-sonnet-5.5">Claude Sonnet 5.5 (Primary Agent • Computer Use)</option>
                            <option value="claude-opus-5.5">Claude Opus 5.5 (Deep Reasoning)</option>
                            <option value="claude-haiku-4.5">Claude Haiku 4.5 (Fast &amp; Responsive)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 8. Computer Permissions */}
            {step === 8 && (
              <motion.div
                key="step8"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>
                  Computer Permissions
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted, #6B7280)', margin: '0 0 16px 0' }}>
                  Aven needs granular permissions to interact with your desktop applications.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Mouse & Keyboard Control', desc: 'Allow Aven to click buttons and enter text in apps', state: mouseKeyboard, set: setMouseKeyboard },
                    { label: 'Screen Perception & OCR', desc: 'Inspect screen pixels to recognize UI elements and context', state: screenPerception, set: setScreenPerception },
                    { label: 'Fullscreen App Control', desc: 'Interact with maximized and fullscreen applications', state: fullscreenControl, set: setFullscreenControl },
                  ].map((perm, idx) => (
                    <div
                      key={idx}
                      onClick={() => perm.set(!perm.state)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border, #E5E7EB)',
                        backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground, #111111)' }}>{perm.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>{perm.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={perm.state}
                        onChange={() => {}}
                        style={{ accentColor: 'var(--accent, #2596BE)', width: '16px', height: '16px' }}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 9. Voice */}
            {step === 9 && (
              <motion.div
                key="step9"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>
                  Voice Interaction
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted, #6B7280)', margin: '0 0 20px 0' }}>
                  Talk to Aven anytime from any application using the push-to-talk hotkey.
                </p>
                <div style={{ padding: '24px', borderRadius: '10px', border: '1px solid var(--border, #E5E7EB)', backgroundColor: 'var(--surface-secondary, #F9FAFB)', textAlign: 'center' }}>
                  <Mic size={36} color="#2596BE" style={{ margin: '0 auto 12px auto' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: 'var(--foreground, #111111)' }}>Global Push-To-Talk</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 16px', backgroundColor: 'var(--surface, #FFFFFF)', border: '1px solid var(--border, #D1D5DB)', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
                    <kbd>Ctrl</kbd> + <kbd>Space</kbd>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)', marginTop: '12px' }}>
                    Press and hold anywhere in Windows to trigger voice instructions.
                  </div>
                </div>
              </motion.div>
            )}

            {/* 10. Autonomy */}
            {step === 10 && (
              <motion.div
                key="step10"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>
                  Autonomy Policy
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted, #6B7280)', margin: '0 0 16px 0' }}>
                  Decide how independently Aven takes action on your computer.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { id: 'balanced' as AutonomyLevel, title: 'Balanced (Recommended)', desc: 'Asks before permanent actions (deleting files, sending emails, payments)' },
                    { id: 'autonomous' as AutonomyLevel, title: 'High Autonomy', desc: 'Executes entire multi-step task autonomously, stopping only on blocking errors' },
                    { id: 'strict' as AutonomyLevel, title: 'Strict Verification', desc: 'Prompts for confirmation before every application launch or action' },
                  ].map((lvl) => {
                    const isSelected = autonomyLevel === lvl.id;
                    return (
                      <div
                        key={lvl.id}
                        onClick={() => setAutonomyLevel(lvl.id)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--accent, #2596BE)' : '1px solid var(--border, #E5E7EB)',
                          backgroundColor: isSelected ? 'rgba(37, 150, 190, 0.06)' : 'var(--surface-secondary, #F9FAFB)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px', color: 'var(--foreground, #111111)' }}>{lvl.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>{lvl.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 11. Personalization */}
            {step === 11 && (
              <motion.div
                key="step11"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>
                  Response Style
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted, #6B7280)', margin: '0 0 20px 0' }}>
                  How would you prefer Aven to report progress during task execution?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {[
                    { id: 'concise' as ResponseStyle, title: 'Concise & Fast', desc: 'Minimal summaries, outcome-focused updates' },
                    { id: 'detailed' as ResponseStyle, title: 'Detailed Step-by-Step', desc: 'Full step explanations and reasoning' },
                  ].map((style) => {
                    const isSelected = responseStyle === style.id;
                    return (
                      <div
                        key={style.id}
                        onClick={() => setResponseStyle(style.id)}
                        style={{
                          padding: '18px 16px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid var(--accent, #2596BE)' : '1px solid var(--border, #E5E7EB)',
                          backgroundColor: isSelected ? 'rgba(37, 150, 190, 0.06)' : 'var(--surface-secondary, #F9FAFB)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: 'var(--foreground, #111111)' }}>{style.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>{style.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 12. Ready */}
            {step === 12 && (
              <motion.div
                key="step12"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                style={{ textAlign: 'center', padding: '16px 0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(37, 150, 190, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={28} color="#2596BE" />
                  </div>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                  Aven is Ready
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--muted, #6B7280)', maxWidth: '420px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                  Welcome aboard, {userName}. Aven is configured and ready to operate your computer.
                </p>
                <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px', textAlign: 'left', backgroundColor: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border, #E5E7EB)', borderRadius: '8px', padding: '14px 20px', fontSize: '12px' }}>
                  <div>• <strong>Theme:</strong> {selectedTheme.toUpperCase()}</div>
                  <div>• <strong>Engine:</strong> {selectedProvider.toUpperCase()}</div>
                  <div>• <strong>Autonomy:</strong> {autonomyLevel.toUpperCase()}</div>
                  <div>• <strong>Voice Trigger:</strong> {voiceShortcut}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stepper Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '32px',
              paddingTop: '18px',
              borderTop: '1px solid var(--border, #E5E7EB)',
            }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border, #D1D5DB)',
                  backgroundColor: 'var(--surface, #FFFFFF)',
                  color: 'var(--foreground, #374151)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={14} /> Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--accent, #2596BE)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37, 150, 190, 0.2)',
              }}
            >
              {step === totalSteps ? 'Launch Aven' : 'Continue'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;
