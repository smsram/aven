import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Shield, Check, Globe, Monitor, Folder, ChevronDown, ChevronUp, ExternalLink, RefreshCw, Sparkles, X } from 'lucide-react';
import AvenMark from '../components/AvenMark';
import aiService from '../services/ai/aiService';
import modelRegistry from '../services/ai/modelRegistry';
import { FallbackEvent } from '../services/ai/types';

interface TaskViewProps {
  onBack: () => void;
  taskTitle?: string;
  onOpenRecovery?: () => void;
  activeModelId?: string;
}

export const TaskView: React.FC<TaskViewProps> = ({
  onBack,
  taskTitle = 'Open Chrome, research the best options, compare them and create a summary.',
  onOpenRecovery,
  activeModelId = 'auto',
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [recoveryAcknowledged, setRecoveryAcknowledged] = useState(false);
  const [lastFallback, setLastFallback] = useState<FallbackEvent | null>(() => aiService.getLastFallbackEvent());

  useEffect(() => {
    return aiService.subscribe(() => {
      setLastFallback(aiService.getLastFallbackEvent());
    });
  }, []);

  const displayModelName = activeModelId === 'auto'
    ? 'Auto (Gemini 3.8 Flash)'
    : modelRegistry.getModel(activeModelId)?.displayName || activeModelId;

  const activities = [
    { id: '1', label: 'Opened Chrome', status: 'completed' },
    { id: '2', label: 'Searched for relevant information', status: 'completed' },
    { id: '3', label: 'Comparing results', status: isRunning ? 'active' : 'pending' },
    { id: '4', label: 'Preparing summary', status: 'pending' },
    { id: '5', label: 'Verifying information', status: 'pending' },
  ];

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
      {/* Top Header */}
      <div
        style={{
          height: '52px',
          borderBottom: '1px solid var(--border, #E7E7E7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backgroundColor: 'var(--surface, #FFFFFF)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
          <button
            onClick={onBack}
            title="Back to Tasks"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'var(--surface-secondary, #F3F4F6)',
              color: 'var(--foreground, #4B5563)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={15} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--foreground, #111111)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {taskTitle}
            </span>

            {/* Agent State Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '12px',
                backgroundColor: isRunning ? 'rgba(37, 150, 190, 0.08)' : 'var(--surface-secondary, #F3F4F6)',
                border: isRunning ? '1px solid rgba(37, 150, 190, 0.25)' : '1px solid var(--border, #E5E7EB)',
                fontSize: '11px',
                fontWeight: 500,
                color: isRunning ? 'var(--accent, #2596BE)' : 'var(--muted, #6B7280)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isRunning ? '#2596BE' : '#9CA3AF',
                }}
              />
              <span>{isRunning ? 'Aven is working' : 'Paused'}</span>
            </div>

            {/* Model Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '12px',
                backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                border: '1px solid var(--border, #E5E7EB)',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--foreground, #374151)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={11} color="var(--accent, #2596BE)" />
              <span>{displayModelName}</span>
            </div>
          </div>
        </div>

        {/* Header Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--foreground, #374151)',
              backgroundColor: 'var(--surface-secondary, #F9FAFB)',
              border: '1px solid var(--border, #E5E7EB)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
            <span>{isRunning ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 400,
              color: 'var(--muted, #6B7280)',
              backgroundColor: showTechnicalDetails ? 'var(--surface-secondary, #F3F4F6)' : 'transparent',
              border: '1px solid var(--border, #E5E7EB)',
              cursor: 'pointer',
            }}
          >
            <span>Details</span>
            {showTechnicalDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Cross-Provider Fallback Alert Banner */}
      {lastFallback && (
        <div
          style={{
            padding: '8px 24px',
            backgroundColor: 'rgba(37, 150, 190, 0.08)',
            borderBottom: '1px solid rgba(37, 150, 190, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--foreground, #111111)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={13} color="var(--accent, #2596BE)" />
            <span style={{ fontWeight: 500 }}>{lastFallback.message}</span>
          </div>
          <button
            onClick={() => aiService.clearLastFallbackEvent()}
            title="Dismiss notice"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted, #6B7280)',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Main Task Area */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflowY: 'auto',
          backgroundColor: 'var(--background, #FAFAFA)',
        }}
      >
        {/* Contextual Recovery Point Prompt */}
        {!recoveryAcknowledged && (
          <div
            style={{
              backgroundColor: 'var(--surface, #FFFFFF)',
              border: '1px solid var(--border, #E5E7EB)',
              borderRadius: '8px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--foreground, #111111)' }}>
              <Shield size={14} color="#10B981" />
              <span>Before continuing, Aven established a safe recovery snapshot for your documents.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {onOpenRecovery && (
                <button
                  onClick={onOpenRecovery}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '5px',
                    backgroundColor: 'var(--surface-secondary, #F3F4F6)',
                    color: 'var(--foreground, #374151)',
                    border: '1px solid var(--border, #E5E7EB)',
                    cursor: 'pointer',
                  }}
                >
                  Review
                </button>
              )}
              <button
                onClick={() => setRecoveryAcknowledged(true)}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '5px',
                  backgroundColor: 'var(--foreground, #111111)',
                  color: 'var(--background, #FFFFFF)',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Natural Language Agent Statement & Current Activity Stream */}
        <div
          style={{
            backgroundColor: 'var(--surface, #FFFFFF)',
            borderRadius: '10px',
            border: '1px solid var(--border, #E7E7E7)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Agent Statement */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'rgba(37, 150, 190, 0.08)',
                border: '1px solid rgba(37, 150, 190, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AvenMark size={14} color="#2596BE" state={isRunning ? 'working' : 'idle'} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Aven
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground, #111111)' }}>
                "I'll research the options, compare the relevant information, and prepare a summary."
              </div>
            </div>
          </div>

          {/* Current Activity Natural Language Steps */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px 20px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border, #F3F4F6)',
            }}
          >
            {activities.map(act => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: act.status === 'completed'
                    ? 'var(--foreground, #111111)'
                    : act.status === 'active'
                    ? 'var(--accent, #2596BE)'
                    : 'var(--muted, #9CA3AF)',
                  fontWeight: act.status === 'active' ? 500 : 400,
                }}
              >
                {act.status === 'completed' && (
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--surface-secondary, #E5E7EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={9} strokeWidth={2.5} color="var(--foreground, #4B5563)" />
                  </div>
                )}
                {act.status === 'active' && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2596BE' }} />
                )}
                {act.status === 'pending' && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid var(--border, #D1D5DB)' }} />
                )}
                <span>{act.label}</span>
              </div>
            ))}
          </div>

          {/* Environment Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--muted, #6B7280)', paddingTop: '4px' }}>
            <span>Environment:</span>
            <span style={{ color: 'var(--foreground, #111111)', fontWeight: 500 }}>Chrome</span>
            <span>•</span>
            <span style={{ color: 'var(--foreground, #111111)', fontWeight: 500 }}>Windows</span>
            <span>•</span>
            <span style={{ color: 'var(--foreground, #111111)', fontWeight: 500 }}>Files</span>
          </div>
        </div>

        {/* Technical Details Disclosure */}
        <AnimatePresence>
          {showTechnicalDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                backgroundColor: '#1E242C',
                color: '#E2E8F0',
                borderRadius: '8px',
                padding: '12px 16px',
                fontFamily: 'monospace',
                fontSize: '11px',
                lineHeight: '1.6',
                overflow: 'hidden',
              }}
            >
              <div style={{ color: '#94A3B8', marginBottom: '4px', fontSize: '10px' }}>
                TECHNICAL ACTIVITY LOG (DISCLOSED)
              </div>
              <div>[BrowserContext] Session ID #br-8291 active on cdp://127.0.0.1:9222</div>
              <div>[DOMQuery] Extracted 4 product specifications cards from DOM tree</div>
              <div>[Synthesis] Normalizing weight, battery life, display nits across entries</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Workspace Preview */}
        <div
          style={{
            flex: 1,
            minHeight: '440px',
            backgroundColor: 'var(--surface, #FFFFFF)',
            borderRadius: '10px',
            border: '1px solid var(--border, #E7E7E7)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          {/* Workspace Window Header */}
          <div
            style={{
              height: '36px',
              backgroundColor: 'var(--surface-secondary, #F3F4F6)',
              borderBottom: '1px solid var(--border, #E5E7EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              fontSize: '12px',
              color: 'var(--foreground, #374151)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={14} color="#2596BE" />
              <span style={{ fontWeight: 500 }}>Live Agent Workspace — Chrome &amp; Document Summary</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent, #2596BE)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2596BE' }} />
              <span>Aven is interacting</span>
            </div>
          </div>

          {/* Split Workspace View */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', overflow: 'hidden' }}>
            {/* Left: Chrome Browser Search */}
            <div style={{ borderRight: '1px solid var(--border, #E7E7E7)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface, #FFFFFF)' }}>
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--surface-secondary, #FAFAFA)', borderBottom: '1px solid var(--border, #E5E7EB)', fontSize: '11px', color: 'var(--muted, #4B5563)', fontFamily: 'monospace' }}>
                https://www.theverge.com/guide/best-laptops-budget-comparison
              </div>
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <div style={{ fontSize: '11px', color: 'var(--accent, #2596BE)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Web Source 1 of 3
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground, #111111)', margin: '4px 0 12px' }}>
                  Top Laptops Under ₹50,000 Tested (2026)
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--foreground, #4B5563)', lineHeight: '1.6', marginBottom: '16px' }}>
                  We evaluated battery longevity, keyboard travel, and display brightness across leading Ryzen 5 and Intel Core i5 configurations.
                </p>

                <div
                  style={{
                    backgroundColor: 'rgba(37, 150, 190, 0.05)',
                    border: '1.5px solid #2596BE',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-9px',
                      left: '12px',
                      backgroundColor: '#2596BE',
                      color: '#FFFFFF',
                      fontSize: '9px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    Aven Extracted Option
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground, #111111)' }}>
                    1. ASUS Vivobook 15 (Ryzen 5 7520U) — ₹44,990
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted, #4B5563)', marginTop: '4px' }}>
                    • Battery: 8.5 hours tested • Display: 1080p FHD anti-glare • Weight: 1.63 kg
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Summary Document Aven is Drafting */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-secondary, #FAFAFA)' }}>
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--surface-secondary, #F3F4F6)', borderBottom: '1px solid var(--border, #E5E7EB)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground, #374151)' }}>
                  Document: Laptop_Comparison_Summary.md
                </span>
                <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 500 }}>
                  Autosaved
                </span>
              </div>

              <div style={{ flex: 1, padding: '20px', backgroundColor: 'var(--surface, #FFFFFF)', overflowY: 'auto', fontSize: '13px', lineHeight: '1.6' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground, #111111)', marginBottom: '8px' }}>
                  Recommended Laptops Under ₹50,000
                </h2>
                <p style={{ color: 'var(--muted, #4B5563)', marginBottom: '14px' }}>
                  Summary prepared by Aven based on verified benchmark data and pricing.
                </p>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border, #E5E7EB)', textAlign: 'left', color: 'var(--muted, #6B7280)' }}>
                      <th style={{ padding: '6px 4px' }}>Model</th>
                      <th style={{ padding: '6px 4px' }}>Price</th>
                      <th style={{ padding: '6px 4px' }}>Battery</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border, #F3F4F6)' }}>
                      <td style={{ padding: '6px 4px', fontWeight: 500 }}>ASUS Vivobook 15</td>
                      <td style={{ padding: '6px 4px', color: '#10B981' }}>₹44,990</td>
                      <td style={{ padding: '6px 4px' }}>8.5 hrs</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border, #F3F4F6)' }}>
                      <td style={{ padding: '6px 4px', fontWeight: 500 }}>Lenovo IdeaPad Slim 3</td>
                      <td style={{ padding: '6px 4px', color: '#10B981' }}>₹46,490</td>
                      <td style={{ padding: '6px 4px' }}>7.8 hrs</td>
                    </tr>
                  </tbody>
                </table>

                {/* Pulsing Aven Typing Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent, #2596BE)', fontSize: '12px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2596BE' }} />
                  <span>Aven is compiling final recommendation...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskView;
