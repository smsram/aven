import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  Brain,
  Wrench,
} from 'lucide-react';
import AgentOrb, { AgentOrbState } from '../components/AgentOrb';
import TaskComposer from '../components/TaskComposer';
import AvenMark, { AvenState } from '../components/AvenMark';
import MarkdownRenderer from '../components/MarkdownRenderer';
import sessionService, { Session, Message } from '../services/sessionService';
import modelRegistry from '../services/ai/modelRegistry';
import { RouteId } from '../components/Sidebar';

interface HomeScreenProps {
  onVoiceTrigger: () => void;
  onNavigate?: (route: RouteId) => void;
  agentState?: AgentOrbState;
  onStateChange?: (state: AgentOrbState) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onVoiceTrigger,
  onNavigate,
  agentState = 'idle',
  onStateChange,
}) => {
  const [activeSession, setActiveSession] = useState<Session | null>(() => sessionService.getActiveSession());
  const [messages, setMessages] = useState<Message[]>(() => sessionService.getActiveMessages());
  const [isGenerating, setIsGenerating] = useState<boolean>(() => sessionService.isGenerating());
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [expandedThinkingIds, setExpandedThinkingIds] = useState<Record<string, boolean>>({});

  const toggleThinking = (msgId: string) => {
    setExpandedThinkingIds(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to sessionService changes
  useEffect(() => {
    const unsub = sessionService.subscribe(() => {
      setActiveSession(sessionService.getActiveSession());
      setMessages(sessionService.getActiveMessages());
      setIsGenerating(sessionService.isGenerating());
    });
    return unsub;
  }, []);

  // Update agentState when generating
  useEffect(() => {
    if (onStateChange) {
      if (isGenerating) {
        onStateChange('responding');
      } else {
        onStateChange('idle');
      }
    }
  }, [isGenerating]);

  // Scroll to bottom when new messages arrive or stream updates
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, messages[messages.length - 1]?.content, messages[messages.length - 1]?.reasoning]);

  const handleSendMessage = (prompt: string, _tools?: string[], modelId?: string) => {
    sessionService.sendMessage(prompt, { overrideModelId: modelId });
  };

  const handleStopGeneration = () => {
    sessionService.stopGeneration();
  };

  const handleRetry = (msgId: string) => {
    sessionService.retryMessage(msgId);
  };

  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleNewChat = () => {
    sessionService.startNewChat();
  };

  const hasMessages = messages.length > 0;

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background, #FFFFFF)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ----------------------------------------------------
          CASE A: HERO VIEW (No messages in active session)
          ---------------------------------------------------- */}
      {!hasMessages ? (
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 20px',
            overflowY: 'auto',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              width: '100%',
              maxWidth: '780px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginTop: '-30px',
            }}
          >
            {/* Large Aven Agent Orb */}
            <div style={{ marginBottom: '24px' }}>
              <AgentOrb
                state={agentState}
                size="lg"
                onClick={() => {
                  if (onStateChange) {
                    const states: AgentOrbState[] = ['idle', 'listening', 'understanding', 'thinking', 'working', 'waiting', 'responding', 'completed'];
                    const nextIdx = (states.indexOf(agentState) + 1) % states.length;
                    onStateChange(states[nextIdx]);
                  }
                }}
              />
            </div>

            {/* Natural Concise Heading */}
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 500,
                letterSpacing: '-0.025em',
                color: 'var(--foreground, #111111)',
                marginBottom: '24px',
                lineHeight: 1.2,
              }}
            >
              What can I do for you?
            </h1>

            {/* Task Composer Input */}
            <TaskComposer
              onSubmit={handleSendMessage}
              onVoiceClick={onVoiceTrigger}
              onNavigateConnections={() => onNavigate?.('/connections')}
              isGenerating={isGenerating}
              onStop={handleStopGeneration}
              showSuggestions={true}
              autoFocus={true}
            />
          </motion.div>
        </div>
      ) : (
        /* ----------------------------------------------------
           CASE B: CONVERSATION VIEW (Active session with messages)
           ---------------------------------------------------- */
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Conversation Top Header */}
          <div
            style={{
              height: '48px',
              borderBottom: '1px solid var(--border, #E7E7E7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              backgroundColor: 'var(--surface, #FFFFFF)',
              flexShrink: 0,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <AvenMark size={16} color="var(--accent, #2596BE)" />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--foreground, #111111)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeSession?.title || 'Conversation'}
              </span>
            </div>

            <button
              onClick={handleNewChat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--surface-secondary, #F3F4F6)',
                border: '1px solid var(--border, #E5E7EB)',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--foreground, #374151)',
                cursor: 'pointer',
              }}
            >
              <Plus size={12} />
              <span>New Chat</span>
            </button>
          </div>

          {/* Messages Stream Container (Centered modern AI chat column) */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              width: '100%',
              minWidth: 0,
            }}
          >
            <div
              style={{
                maxWidth: '780px',
                width: '100%',
                margin: '0 auto',
                padding: '28px 24px 40px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
                boxSizing: 'border-box',
                minWidth: 0,
              }}
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const resolvedModelInfo = msg.modelId ? modelRegistry.getModel(msg.modelId) : null;
                const displayModelName = resolvedModelInfo?.displayName || msg.modelId || 'AI';

                if (isUser) {
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '85%',
                          backgroundColor: 'var(--foreground, #111111)',
                          color: 'var(--background, #FFFFFF)',
                          padding: '10px 18px',
                          borderRadius: '18px 18px 4px 18px',
                          fontSize: '14px',
                          lineHeight: '1.55',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                // Assistant Response Turn
                const isThinkingOpen = expandedThinkingIds[msg.id] ?? (msg.status === 'streaming' && !msg.content);

                let assistantAvatarState: AvenState = 'idle';
                if (msg.status === 'streaming') {
                  if (msg.content) {
                    assistantAvatarState = 'responding';
                  } else {
                    assistantAvatarState = 'thinking';
                  }
                } else if (msg.status === 'error') {
                  assistantAvatarState = 'error';
                } else {
                  assistantAvatarState = 'idle';
                }

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Animated Aven Mark Avatar */}
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(37, 150, 190, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <AvenMark size={16} state={assistantAvatarState} color="var(--accent, #2596BE)" />
                    </div>

                    {/* Unboxed Assistant Content: Flows cleanly without borders or card background */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minWidth: 0,
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      {/* Thinking / Reasoning Dropdown (Rendered ONLY when actual reasoning data is present) */}
                      {Boolean(msg.reasoning && msg.reasoning.trim().length > 0) && (
                        <div style={{ marginBottom: '14px' }}>
                          <button
                            type="button"
                            onClick={() => toggleThinking(msg.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'rgba(37, 150, 190, 0.08)',
                              border: '1px solid rgba(37, 150, 190, 0.2)',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--accent, #2596BE)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Brain size={13} color="var(--accent, #2596BE)" />
                            <span>
                              {msg.status === 'streaming' && !msg.content
                                ? 'Thinking...'
                                : isThinkingOpen
                                ? 'Hide Thinking Process'
                                : 'Thinking Process'}
                            </span>
                            {isThinkingOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                          {isThinkingOpen && (
                            <div
                              style={{
                                marginTop: '8px',
                                padding: '12px 14px',
                                backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                                border: '1px solid var(--border, #E5E7EB)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                lineHeight: '1.6',
                                color: 'var(--muted, #6B7280)',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                whiteSpace: 'pre-wrap',
                                maxHeight: '320px',
                                overflowY: 'auto',
                              }}
                            >
                              {msg.reasoning}
                              {msg.status === 'streaming' && !msg.content && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: '6px',
                                    height: '12px',
                                    backgroundColor: 'var(--accent, #2596BE)',
                                    marginLeft: '4px',
                                    verticalAlign: 'middle',
                                    animation: 'pulse 1s infinite',
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tool Calls Execution Badges */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                          {msg.toolCalls.map((tc, tcIdx) => (
                            <div
                              key={`tc-${tcIdx}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '5px',
                                backgroundColor: 'var(--surface-secondary, #F3F4F6)',
                                border: '1px solid var(--border, #E5E7EB)',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: 'var(--foreground, #374151)',
                              }}
                            >
                              <Wrench size={11} color="var(--accent, #2596BE)" />
                              <span>Used tool: {tc.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Response Body */}
                      {msg.content ? (
                        <div
                          style={{
                            fontSize: '14px',
                            lineHeight: '1.65',
                            color: 'var(--foreground, #111111)',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            width: '100%',
                            minWidth: 0,
                          }}
                        >
                          <MarkdownRenderer
                            content={msg.content}
                            isStreaming={msg.status === 'streaming'}
                          />
                        </div>
                      ) : msg.status === 'streaming' ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--muted, #6B7280)',
                            fontSize: '13px',
                            padding: '4px 0',
                          }}
                        >
                          <AvenMark size={16} state="thinking" color="var(--accent, #2596BE)" />
                          <span style={{ fontWeight: 500 }}>
                            {msg.reasoning ? 'Formulating response...' : 'Thinking...'}
                          </span>
                        </div>
                      ) : null}

                      {/* Inline Setup State when No AI is Configured */}
                      {msg.status === 'error' && msg.error === 'NO_PROVIDER_CONFIGURED' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F97316', fontWeight: 600, fontSize: '13px' }}>
                            <AlertCircle size={16} />
                            <span>No AI provider is configured yet.</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)', lineHeight: '1.5' }}>
                            Configure an AI provider such as Google Gemini, OpenAI, Claude, or Cloudflare Workers AI to start conversing with Aven.
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button
                              onClick={() => onNavigate?.('/connections')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--foreground, #111111)',
                                color: 'var(--background, #FFFFFF)',
                                fontSize: '12px',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <Sliders size={13} />
                              <span>Set up AI</span>
                            </button>
                            <button
                              onClick={() => handleRetry(msg.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--surface-secondary, #F3F4F6)',
                                border: '1px solid var(--border, #D1D5DB)',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: 'var(--foreground, #374151)',
                                cursor: 'pointer',
                              }}
                            >
                              <RotateCcw size={12} />
                              <span>Retry</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Normal Error State */}
                      {msg.status === 'error' && msg.error !== 'NO_PROVIDER_CONFIGURED' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          <div style={{ color: '#EF4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={15} />
                            <span>{msg.error || 'Failed to generate response'}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button
                              onClick={() => handleRetry(msg.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 10px',
                                borderRadius: '5px',
                                backgroundColor: 'var(--surface-secondary, #F3F4F6)',
                                border: '1px solid var(--border, #D1D5DB)',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: 'var(--foreground, #374151)',
                                cursor: 'pointer',
                              }}
                            >
                              <RotateCcw size={12} />
                              <span>Retry</span>
                            </button>
                            <button
                              onClick={() => onNavigate?.('/connections')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 10px',
                                borderRadius: '5px',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border, #E5E7EB)',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: 'var(--accent, #2596BE)',
                                cursor: 'pointer',
                              }}
                            >
                              <span>Choose another model</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Cancelled State Tag */}
                      {msg.status === 'cancelled' && (
                        <div style={{ fontSize: '11px', color: 'var(--muted, #9CA3AF)', marginTop: '4px', fontStyle: 'italic' }}>
                          Generation stopped
                        </div>
                      )}

                      {/* Assistant Metadata Footer */}
                      {msg.status === 'complete' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '10px',
                            fontSize: '11px',
                            color: 'var(--muted, #9CA3AF)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={11} color="var(--accent, #2596BE)" />
                            <span>{msg.resolvedAutomatically ? `Auto: ${displayModelName}` : displayModelName}</span>
                          </span>

                          {msg.fallbackUsed && (
                            <span style={{ color: '#F97316', fontSize: '10px', fontWeight: 600 }}>
                              ● Provider fallback occurred
                            </span>
                          )}

                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'none',
                              border: 'none',
                              color: copiedMsgId === msg.id ? '#10B981' : 'var(--muted, #9CA3AF)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              fontSize: '11px',
                            }}
                          >
                            {copiedMsgId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedMsgId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Sticky Bottom Chat Composer with Identical Centered Max-Width */}
          <div
            style={{
              padding: '12px 24px 20px 24px',
              backgroundColor: 'var(--background, #FFFFFF)',
              borderTop: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.05))',
              flexShrink: 0,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                maxWidth: '780px',
                width: '100%',
                margin: '0 auto',
                boxSizing: 'border-box',
              }}
            >
              <TaskComposer
                onSubmit={handleSendMessage}
                onVoiceClick={onVoiceTrigger}
                onNavigateConnections={() => onNavigate?.('/connections')}
                isGenerating={isGenerating}
                onStop={handleStopGeneration}
                showSuggestions={false}
                autoFocus={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
