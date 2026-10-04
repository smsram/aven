import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Keyboard,
  Monitor,
  Sliders,
  Check,
  Sun,
  Moon,
  Laptop,
  RotateCcw,
  Bot,
  Cpu,
  Sparkles,
  Info
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import settingsService, {
  ThemeOption,
  AiProviderOption,
  AutonomyLevel,
  ResponseStyle
} from '../services/settingsService';
import ipc, { SystemInfo } from '../services/desktopIpc';

import { RouteId } from '../components/Sidebar';

interface SettingsViewProps {
  onReopenOnboarding?: () => void;
  onNavigate?: (route: RouteId) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onReopenOnboarding, onNavigate }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const currentSettings = settingsService.getSettings();

  const [provider, setProvider] = useState<AiProviderOption>(currentSettings.aiProvider);
  const [autonomy, setAutonomy] = useState<AutonomyLevel>(currentSettings.autonomyLevel);
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>(currentSettings.responseStyle);
  const [permissions, setPermissions] = useState(currentSettings.computerPermissions);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    ipc.system.getInfo().then(setSystemInfo);
  }, []);

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
  };

  const handleProviderChange = (newProvider: AiProviderOption) => {
    setProvider(newProvider);
    settingsService.saveSettings({ aiProvider: newProvider });
  };

  const handleAutonomyChange = (newAutonomy: AutonomyLevel) => {
    setAutonomy(newAutonomy);
    settingsService.saveSettings({ autonomyLevel: newAutonomy });
  };

  const handleResponseStyleChange = (newStyle: ResponseStyle) => {
    setResponseStyle(newStyle);
    settingsService.saveSettings({ responseStyle: newStyle });
  };

  const togglePermission = (key: keyof typeof permissions) => {
    const updated = { ...permissions, [key]: !permissions[key] };
    setPermissions(updated);
    settingsService.saveSettings({ computerPermissions: updated });
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
      }}
    >
      {/* Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={16} color="var(--muted, #6B7280)" />
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground, #111111)', margin: 0 }}>
            Settings &amp; Preferences
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onReopenOnboarding && (
            <button
              onClick={onReopenOnboarding}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border, #D1D5DB)',
                backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                color: 'var(--foreground, #374151)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} />
              Re-run Setup Wizard
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
          maxWidth: '820px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Appearance & Theme */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted, #9CA3AF)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              paddingLeft: '4px',
            }}
          >
            Appearance &amp; Theme
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}
          >
            {[
              { id: 'system' as ThemeOption, label: 'System Theme', icon: Laptop, desc: 'Syncs with Windows mode' },
              { id: 'light' as ThemeOption, label: 'Light Mode', icon: Sun, desc: 'Clean high-contrast light' },
              { id: 'dark' as ThemeOption, label: 'Dark Mode', icon: Moon, desc: 'Restrained deep dark' },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--accent, #2596BE)' : '1px solid var(--border, #E5E7EB)',
                    backgroundColor: isSelected ? 'rgba(37, 150, 190, 0.06)' : 'var(--surface, #FFFFFF)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Icon size={18} color={isSelected ? 'var(--accent, #2596BE)' : 'var(--muted, #6B7280)'} />
                    {isSelected && <Check size={14} color="#2596BE" />}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{t.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>{t.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Provider & Models */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted, #9CA3AF)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              paddingLeft: '4px',
            }}
          >
            AI Engine Provider
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border, #E7E7E7)',
              overflow: 'hidden',
            }}
          >
            {[
              { id: 'gemini' as AiProviderOption, name: 'Google Gemini', desc: 'Gemini 3.8 Flash (Primary general agent) & 3.5 Flash-Lite (High throughput)' },
              { id: 'openai' as AiProviderOption, name: 'OpenAI / ChatGPT', desc: 'GPT-5.4 (Autonomous agent) & GPT-5.4 mini (Coding & subagents)' },
              { id: 'anthropic' as AiProviderOption, name: 'Anthropic Claude', desc: 'Claude Sonnet 5.5 (Agent workflows) & Opus 5.5 (Complex reasoning)' },
              { id: 'cloudflare' as AiProviderOption, name: 'Cloudflare Workers AI', desc: 'Gemma 4 26B, Llama 4 Scout, and Qwen 3.8 on Cloudflare global edge' },
              { id: 'ollama' as AiProviderOption, name: 'Ollama / Local AI', desc: 'Local model execution (100% private, runs entirely on your PC)' },
              { id: 'custom' as AiProviderOption, name: 'Custom AI', desc: 'Custom HTTP endpoints, OpenAI/Claude/Gemini presets, or custom schemas' },
            ].map((p, idx, arr) => {
              const isSelected = provider === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderBottom: idx < arr.length - 1 ? '1px solid var(--border, #F3F4F6)' : 'none',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(37, 150, 190, 0.04)' : 'transparent',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground, #111111)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {p.name}
                      {isSelected && (
                        <span style={{ fontSize: '10px', backgroundColor: 'rgba(37, 150, 190, 0.1)', color: '#2596BE', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Active
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)', marginTop: '2px' }}>{p.desc}</div>
                  </div>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: isSelected ? '5px solid #2596BE' : '2px solid var(--border, #D1D5DB)',
                      backgroundColor: 'transparent',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Unobtrusive link to Custom AI Provider / Connections */}
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onNavigate?.('/connections')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--accent, #2596BE)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
              title="Manage multiple AI provider configurations, fallback priorities, and API keys"
            >
              <Sliders size={13} />
              Manage AI Providers &amp; Fallback &rarr;
            </button>
          </div>
        </div>

        {/* Autonomy Policy & Safety */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted, #9CA3AF)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              paddingLeft: '4px',
            }}
          >
            Autonomy &amp; Safety Policy
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}
          >
            {[
              { id: 'balanced' as AutonomyLevel, title: 'Balanced (Standard)', desc: 'Asks before payments, irreversible file deletes, or external sends' },
              { id: 'autonomous' as AutonomyLevel, title: 'Autonomous', desc: 'Runs multi-step workflows end-to-end, pausing only on blocking errors' },
              { id: 'strict' as AutonomyLevel, title: 'Strict Confirmation', desc: 'Prompts for explicit permission before every app launch and action' },
            ].map((lvl) => {
              const isSelected = autonomy === lvl.id;
              return (
                <div
                  key={lvl.id}
                  onClick={() => handleAutonomyChange(lvl.id)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--accent, #2596BE)' : '1px solid var(--border, #E5E7EB)',
                    backgroundColor: isSelected ? 'rgba(37, 150, 190, 0.05)' : 'var(--surface, #FFFFFF)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{lvl.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>{lvl.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permissions */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted, #9CA3AF)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              paddingLeft: '4px',
            }}
          >
            Computer Control Permissions
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border, #E7E7E7)',
              overflow: 'hidden',
            }}
          >
            {[
              { key: 'mouseKeyboardControl' as const, label: 'Mouse & Keyboard Control', desc: 'Operate Windows desktop applications and keyboard inputs' },
              { key: 'fullscreenInteraction' as const, label: 'Fullscreen Applications', desc: 'Control maximized software, media players, and design environments' },
              { key: 'screenPerception' as const, label: 'Screen Perception & OCR', desc: 'Analyze display pixels to locate UI elements, text, and buttons' },
              { key: 'destructiveConfirmation' as const, label: 'Destructive Action Confirmation', desc: 'Require verification before permanent deletions or overwrites' },
            ].map((perm, idx) => {
              const active = permissions[perm.key];
              return (
                <div
                  key={perm.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderBottom: idx < 3 ? '1px solid var(--border, #F3F4F6)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground, #111111)' }}>
                      {perm.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>
                      {perm.desc}
                    </div>
                  </div>
                  <button
                    onClick={() => togglePermission(perm.key)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 500,
                      backgroundColor: active ? 'rgba(37, 150, 190, 0.08)' : 'var(--surface-secondary, #F3F4F6)',
                      color: active ? '#2596BE' : 'var(--muted, #6B7280)',
                      border: active ? '1px solid rgba(37, 150, 190, 0.25)' : '1px solid var(--border, #E5E7EB)',
                      cursor: 'pointer',
                    }}
                  >
                    {active ? 'Allowed' : 'Disabled'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Windows Hotkeys */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted, #9CA3AF)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              paddingLeft: '4px',
            }}
          >
            Windows Global Hotkeys
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border, #E7E7E7)',
              overflow: 'hidden',
            }}
          >
            {[
              { label: 'Push to talk to Aven (Voice)', key: 'Hold Ctrl + Space' },
              { label: 'Quick Actions & Commands menu', key: 'Ctrl + /' },
              { label: 'Start new task (Home)', key: 'Ctrl + K' },
              { label: 'Pause / Resume current task', key: 'Ctrl + P' },
              { label: 'Cancel / Abort agent execution', key: 'Escape' },
            ].map((shortcut, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderBottom: idx < 4 ? '1px solid var(--border, #F3F4F6)' : 'none',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--foreground, #374151)' }}>{shortcut.label}</span>
                <kbd
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--surface-secondary, #F3F4F6)',
                    border: '1px solid var(--border, #E5E7EB)',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--foreground, #111111)',
                  }}
                >
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Architecture & Native Info */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted, #9CA3AF)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              paddingLeft: '4px',
            }}
          >
            Desktop Runtime &amp; Architecture
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border, #E7E7E7)',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border, #F3F4F6)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--muted, #6B7280)' }}>Native Desktop Shell:</span>
              <span style={{ fontWeight: 600 }}>Tauri 2 (Rust Backend + Windows Native APIs)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border, #F3F4F6)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--muted, #6B7280)' }}>UI Presentation Layer:</span>
              <span style={{ fontWeight: 600 }}>React + TypeScript + Vite</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border, #F3F4F6)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--muted, #6B7280)' }}>Execution Environment:</span>
              <span style={{ fontWeight: 600, color: systemInfo?.is_tauri ? '#10B981' : '#F59E0B' }}>
                {systemInfo?.is_tauri ? 'Native Windows Desktop Shell (Tauri 2 IPC)' : 'Vite Browser Dev Server (IPC Fallback)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted, #6B7280)' }}>Application Identifier:</span>
              <span style={{ fontFamily: 'monospace' }}>com.aven.desktop (v0.1.0)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
