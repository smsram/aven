import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paperclip,
  Mic,
  ArrowUp,
  Square,
  ChevronDown,
  Check,
  Image as ImageIcon,
  Sparkles,
  Bot,
  Sliders
} from 'lucide-react';
import modelRegistry from '../services/ai/modelRegistry';
import aiService from '../services/ai/aiService';
import sessionService, { AISelectionState } from '../services/sessionService';

interface TaskComposerProps {
  onSubmit: (prompt: string, tools?: string[], selectedModelId?: string) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  onVoiceClick?: () => void;
  onNavigateConnections?: () => void;
  initialPrompt?: string;
  placeholder?: string;
  showSuggestions?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export const TaskComposer: React.FC<TaskComposerProps> = ({
  onSubmit,
  onStop,
  isGenerating = false,
  onVoiceClick,
  onNavigateConnections,
  initialPrompt = '',
  placeholder = 'Ask Aven anything...',
  showSuggestions = true,
  className = '',
  autoFocus = false,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isFocused, setIsFocused] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [aiSelection, setAiSelection] = useState<AISelectionState>(() => sessionService.getAISelection());
  const [usableProviders, setUsableProviders] = useState(() => aiService.getUsableProviders());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSubmittingRef = useRef(false);

  // Subscribe to changes in aiService & sessionService
  useEffect(() => {
    const unsubAi = aiService.subscribe(() => {
      setUsableProviders(aiService.getUsableProviders());
    });
    const unsubSession = sessionService.subscribe(() => {
      setAiSelection(sessionService.getAISelection());
    });
    return () => {
      unsubAi();
      unsubSession();
    };
  }, []);

  // Auto-focus when specified
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGenerating) {
      onStop?.();
      return;
    }
    if (isSubmittingRef.current) return;
    if (!prompt.trim()) return;

    isSubmittingRef.current = true;
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 500);

    const currentPrompt = prompt.trim();
    setPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const modelIdToUse = aiSelection.mode === 'manual' ? aiSelection.modelId : undefined;
    onSubmit(currentPrompt, ['computer', 'browser', 'files'], modelIdToUse);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectAuto = () => {
    const nextSelection: AISelectionState = { mode: 'auto', modelId: 'auto' };
    setAiSelection(nextSelection);
    sessionService.setAISelection(nextSelection);
    setShowModelMenu(false);
  };

  const handleSelectModel = (providerId: string, modelId: string) => {
    const nextSelection: AISelectionState = {
      mode: 'manual',
      providerId: providerId as any,
      modelId,
    };
    setAiSelection(nextSelection);
    sessionService.setAISelection(nextSelection);
    setShowModelMenu(false);
  };

  const hasConfiguredProviders = usableProviders.length > 0;

  // Resolve display name for the selector
  let selectorLabel = 'Auto';
  if (!hasConfiguredProviders) {
    selectorLabel = 'Set up AI';
  } else if (aiSelection.mode === 'manual' && aiSelection.modelId) {
    const model = modelRegistry.getModel(aiSelection.modelId);
    selectorLabel = model?.displayName || aiSelection.modelId;
  }

  const suggestions = [
    'Explain how transformers work in machine learning',
    'Organize my Downloads folder and clean up caches',
    'Find the cheapest flight to Tokyo for next month',
    'Summarize my open project tasks and recent activity',
  ];

  return (
    <div
      className={`task-composer-wrapper ${className}`}
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      {/* Auto Mode Informational Banner (Only shown when Auto is selected and providers exist) */}
      {aiSelection.mode === 'auto' && hasConfiguredProviders && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            fontSize: '11px',
            color: 'var(--muted, #6B7280)',
            userSelect: 'none',
          }}
        >
          <Sparkles size={11} color="var(--accent, #2596BE)" />
          <span>Auto selects a suitable configured model for each request.</span>
        </div>
      )}

      {/* Main Composer Box */}
      <motion.div
        animate={{
          borderColor: isFocused ? 'var(--accent, #2596BE)' : 'var(--border, #E7E7E7)',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(37, 150, 190, 0.12), 0 8px 24px rgba(0,0,0,0.04)'
            : '0 4px 16px rgba(0, 0, 0, 0.03)',
        }}
        transition={{ duration: 0.2 }}
        style={{
          backgroundColor: 'var(--surface, #FFFFFF)',
          borderRadius: '12px',
          border: '1px solid var(--border, #E7E7E7)',
          padding: '14px 16px 10px 16px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          style={{
            width: '100%',
            resize: 'none',
            fontSize: '14px',
            lineHeight: '1.5',
            color: 'var(--foreground, #111111)',
            outline: 'none',
            border: 'none',
            fontFamily: 'inherit',
            background: 'transparent',
            minHeight: '44px',
          }}
        />

        {/* Bottom Toolbar inside Composer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border, #F3F4F6)',
          }}
        >
          {/* Left Controls: Attachments & AI Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            <button
              type="button"
              title="Attach document, screenshot or file"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                color: 'var(--muted, #6B7280)',
                backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                border: '1px solid var(--border, #E5E7EB)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Paperclip size={14} />
            </button>

            <button
              type="button"
              title="Capture screen for Aven to inspect"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                color: 'var(--muted, #6B7280)',
                backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                border: '1px solid var(--border, #E5E7EB)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ImageIcon size={14} />
            </button>

            {/* AI Model Selector Button */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  if (!hasConfiguredProviders && onNavigateConnections) {
                    onNavigateConnections();
                    return;
                  }
                  setShowModelMenu(!showModelMenu);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  height: '30px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: !hasConfiguredProviders
                    ? '#F97316'
                    : aiSelection.mode === 'auto'
                    ? 'var(--foreground, #111111)'
                    : 'var(--accent, #2596BE)',
                  backgroundColor: !hasConfiguredProviders ? 'rgba(249, 115, 22, 0.08)' : 'var(--surface-secondary, #F9FAFB)',
                  border: !hasConfiguredProviders ? '1px solid rgba(249, 115, 22, 0.25)' : '1px solid var(--border, #E5E7EB)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sparkles size={12} color={!hasConfiguredProviders ? '#F97316' : 'var(--accent, #2596BE)'} />
                <span style={{ color: 'var(--muted, #6B7280)', fontWeight: 400 }}>AI</span>
                <span style={{ fontWeight: 600 }}>{selectorLabel}</span>
                {hasConfiguredProviders && <ChevronDown size={11} color="var(--muted, #9CA3AF)" />}
              </button>

              {/* Model Dropdown Menu */}
              <AnimatePresence>
                {showModelMenu && hasConfiguredProviders && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      bottom: '38px',
                      left: 0,
                      width: '320px',
                      maxHeight: '380px',
                      overflowY: 'auto',
                      backgroundColor: 'var(--surface, #FFFFFF)',
                      borderRadius: '10px',
                      border: '1px solid var(--border, #E7E7E7)',
                      boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.18)',
                      padding: '8px',
                      zIndex: 100,
                    }}
                  >
                    {/* Auto Option */}
                    <div
                      onClick={handleSelectAuto}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: aiSelection.mode === 'auto' ? 'rgba(37, 150, 190, 0.08)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground, #111111)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Auto</span>
                          <span style={{ fontSize: '9px', backgroundColor: 'rgba(37, 150, 190, 0.12)', color: 'var(--accent, #2596BE)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                            Recommended
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)', marginTop: '2px' }}>
                          Automatically selects a configured model based on the task
                        </div>
                      </div>
                      {aiSelection.mode === 'auto' && <Check size={14} color="#2596BE" />}
                    </div>

                    <div style={{ height: '1px', backgroundColor: 'var(--border, #F3F4F6)', margin: '6px 0' }} />

                    {/* Configured Providers & Models */}
                    {usableProviders.map(prov => {
                      const models = modelRegistry.getModelsForProvider(prov.providerType)
                        .filter(m => m.enabled && m.availability !== 'local_uninstalled');
                      if (models.length === 0) return null;

                      return (
                        <div key={prov.id} style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted, #9CA3AF)', letterSpacing: '0.04em', padding: '4px 8px' }}>
                            {prov.displayName}
                          </div>
                          {models.map(m => {
                            const isSelected = aiSelection.mode === 'manual' && aiSelection.modelId === m.id;
                            return (
                              <div
                                key={m.id}
                                onClick={() => handleSelectModel(prov.id, m.id)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? 'rgba(37, 150, 190, 0.08)' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '2px',
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground, #111111)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{m.displayName}</span>
                                    {m.tags.slice(0, 2).map(tag => (
                                      <span
                                        key={tag}
                                        style={{
                                          fontSize: '9px',
                                          padding: '1px 4px',
                                          borderRadius: '3px',
                                          backgroundColor: tag === 'Primary' ? 'rgba(37, 150, 190, 0.1)' : 'var(--surface-secondary, #F3F4F6)',
                                          color: tag === 'Primary' ? '#2596BE' : 'var(--muted, #6B7280)',
                                          fontWeight: 600,
                                        }}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                {isSelected && <Check size={14} color="#2596BE" />}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Controls: Voice & Run/Stop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onVoiceClick}
              title="Hold Ctrl + Space to speak"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                height: '30px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--foreground, #4B5563)',
                backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                border: '1px solid var(--border, #E5E7EB)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Mic size={13} color="var(--accent, #2596BE)" />
              <span>Voice</span>
            </button>

            {/* Run or Stop Button */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                title="Stop response"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Square size={13} fill="#FFFFFF" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!prompt.trim()}
                title="Send to Aven (Enter)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  backgroundColor: prompt.trim() ? 'var(--accent, #2596BE)' : 'var(--surface-secondary, #E5E7EB)',
                  color: prompt.trim() ? '#FFFFFF' : 'var(--muted, #9CA3AF)',
                  cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                  border: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <ArrowUp size={15} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Example Suggestions (Shown only when in hero mode) */}
      {showSuggestions && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '16px',
          }}
        >
          {suggestions.map((text, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPrompt(text);
                if (textareaRef.current) textareaRef.current.focus();
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: 'var(--surface, #FFFFFF)',
                border: '1px solid var(--border, #E7E7E7)',
                fontSize: '12px',
                color: 'var(--foreground, #4B5563)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
            >
              {text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskComposer;
