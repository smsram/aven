import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MessageSquare,
  Clock,
  ChevronRight,
  Bot,
  Sparkles,
  Calendar,
  CheckCircle2,
  Trash2,
  Activity,
  CalendarClock
} from 'lucide-react';
import sessionService, { Session, ScheduledTask } from '../services/sessionService';
import modelRegistry from '../services/ai/modelRegistry';

export interface AutonomousTask {
  id: string;
  title: string;
  status: 'working' | 'completed' | 'paused';
  summary?: string;
  environment?: string;
  time?: string;
  recoveryAvailable?: boolean;
}

interface TasksListProps {
  onSelectSession?: (sessionId: string) => void;
  onSelectTask?: (task: any) => void;
  onNewChat?: () => void;
  onNewTask?: () => void;
}

export const TasksList: React.FC<TasksListProps> = ({
  onSelectSession,
  onNewChat,
  onNewTask,
}) => {
  const [sessions, setSessions] = useState<Session[]>(() => sessionService.getSessions());
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>(() => sessionService.getScheduledTasks());
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    const unsub = sessionService.subscribe(() => {
      setSessions(sessionService.getSessions());
      setScheduledTasks(sessionService.getScheduledTasks());
    });
    return unsub;
  }, []);

  const handleStartNewChat = () => {
    sessionService.startNewChat();
    if (onNewChat) {
      onNewChat();
    } else if (onNewTask) {
      onNewTask();
    }
  };

  const handleOpenSession = (sessionId: string) => {
    sessionService.setActiveSessionId(sessionId);
    if (onSelectSession) {
      onSelectSession(sessionId);
    } else if (onNewChat) {
      onNewChat();
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    sessionService.deleteSession(sessionId);
  };

  // Filter & Search
  const filteredSessions = sessionService.searchSessions(searchQuery).filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  // Group sessions by date
  const now = Date.now();
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const startOfYesterday = startOfToday - 86400000;
  const startOf7Days = startOfToday - 86400000 * 7;

  const todaySessions: Session[] = [];
  const yesterdaySessions: Session[] = [];
  const previous7DaysSessions: Session[] = [];
  const olderSessions: Session[] = [];

  for (const s of filteredSessions) {
    const time = s.lastMessageAt || s.createdAt;
    if (time >= startOfToday) {
      todaySessions.push(s);
    } else if (time >= startOfYesterday) {
      yesterdaySessions.push(s);
    } else if (time >= startOf7Days) {
      previous7DaysSessions.push(s);
    } else {
      olderSessions.push(s);
    }
  }

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground, #111111)', margin: 0, lineHeight: 1.2 }}>
            Tasks
          </h1>
          <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)', marginTop: '2px' }}>
            Your conversations and work
          </div>
        </div>

        <button
          onClick={handleStartNewChat}
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
            transition: 'opacity 0.15s ease',
          }}
        >
          <Plus size={13} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          padding: '20px 24px',
          overflowY: 'auto',
          maxWidth: '820px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
          {/* Search Input */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--surface-secondary, #F9FAFB)',
              border: '1px solid var(--border, #E5E7EB)',
              borderRadius: '8px',
              padding: '6px 12px',
            }}
          >
            <Search size={14} color="var(--muted, #9CA3AF)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations and work..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12px',
                color: 'var(--foreground, #111111)',
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {(['all', 'active', 'completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: filter === tab ? 'var(--foreground, #111111)' : 'var(--muted, #6B7280)',
                  backgroundColor: filter === tab ? 'var(--surface-secondary, #F3F4F6)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ----------------------------------------------------
            SECTION 1: PERSISTENT SCHEDULED AUTOMATIONS
            (Visually distinct and separated from sessions)
            ---------------------------------------------------- */}
        {!searchQuery && scheduledTasks.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--muted, #9CA3AF)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CalendarClock size={12} color="var(--accent, #2596BE)" />
              <span>Scheduled Automations</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scheduledTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: 'var(--surface, #FFFFFF)',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #E7E7E7)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground, #111111)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{task.title}</span>
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontWeight: 600 }}>
                        {task.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)', marginTop: '2px' }}>
                      {task.instructions}
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--muted, #9CA3AF)', fontWeight: 500, fontFamily: 'monospace' }}>
                    {task.schedule}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            SECTION 2: RECENT CONVERSATIONS & HISTORY
            ---------------------------------------------------- */}
        {filteredSessions.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-secondary, #F3F4F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted, #9CA3AF)',
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground, #111111)' }}>
                {searchQuery ? 'No matching conversations' : 'No conversations yet'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)', marginTop: '4px' }}>
                {searchQuery ? 'Try a different search term.' : 'Start a conversation with Aven to see it here.'}
              </div>
            </div>
            {!searchQuery && (
              <button
                onClick={handleStartNewChat}
                style={{
                  marginTop: '8px',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--foreground, #111111)',
                  color: 'var(--background, #FFFFFF)',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Start New Chat
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Render helper for a session group */}
            {[
              { label: 'TODAY', items: todaySessions },
              { label: 'YESTERDAY', items: yesterdaySessions },
              { label: 'PREVIOUS 7 DAYS', items: previous7DaysSessions },
              { label: 'OLDER', items: olderSessions },
            ].map(group => {
              if (group.items.length === 0) return null;

              return (
                <div key={group.label}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--muted, #9CA3AF)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      paddingLeft: '2px',
                    }}
                  >
                    {group.label}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {group.items.map(session => {
                      const msgs = sessionService.getMessages(session.id);
                      const latestUserMsg = msgs.filter(m => m.role === 'user').pop();
                      const latestAssistantMsg = msgs.filter(m => m.role === 'assistant').pop();
                      const previewText = latestUserMsg?.content || (latestAssistantMsg?.content ? latestAssistantMsg.content.slice(0, 100) : 'Conversation started');
                      const resolvedModel = session.resolvedModels[0]
                        ? (modelRegistry.getModel(session.resolvedModels[0])?.displayName || session.resolvedModels[0])
                        : (session.selectedAI.mode === 'manual' && session.selectedAI.modelId ? (modelRegistry.getModel(session.selectedAI.modelId)?.displayName || session.selectedAI.modelId) : 'Auto');

                      const isCurrentlyActive = sessionService.getActiveSessionId() === session.id && sessionService.isGenerating();

                      return (
                        <div
                          key={session.id}
                          onClick={() => handleOpenSession(session.id)}
                          style={{
                            backgroundColor: 'var(--surface, #FFFFFF)',
                            borderRadius: '10px',
                            border: '1px solid var(--border, #E7E7E7)',
                            padding: '14px 18px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-secondary, #F9FAFB)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface, #FFFFFF)')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                backgroundColor: isCurrentlyActive ? 'rgba(37, 150, 190, 0.12)' : 'var(--surface-secondary, #F3F4F6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isCurrentlyActive ? 'var(--accent, #2596BE)' : 'var(--muted, #6B7280)',
                                flexShrink: 0,
                              }}
                            >
                              <MessageSquare size={16} />
                            </div>

                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground, #111111)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {session.title}
                                </span>

                                {isCurrentlyActive && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--accent, #2596BE)', fontWeight: 600 }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent, #2596BE)', animation: 'pulse 1.2s infinite' }} />
                                    Working
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                                {previewText}
                              </div>
                            </div>
                          </div>

                          {/* Right Meta: Time, Model Badge, Delete */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--muted, #9CA3AF)' }}>
                                {formatTime(session.lastMessageAt || session.createdAt)}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--muted, #6B7280)', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--surface-secondary, #F3F4F6)', fontWeight: 500 }}>
                                {resolvedModel}
                              </span>
                            </div>

                            <button
                              onClick={(e) => handleDeleteSession(e, session.id)}
                              title="Delete conversation"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--muted, #9CA3AF)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#EF4444';
                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--muted, #9CA3AF)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <Trash2 size={13} />
                            </button>

                            <ChevronRight size={14} color="var(--muted, #9CA3AF)" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksList;
