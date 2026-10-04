// Session & History Management Service for Aven Desktop AI Application
// Handles persistent conversation sessions, messages, scheduled tasks, and execution pipelines

import aiService from './ai/aiService';
import modelRegistry from './ai/modelRegistry';
import toolRegistry from './agent/toolRegistry';
import { AIRequest, AIResponse, ProviderId } from './ai/types';

export interface AISelectionState {
  mode: 'auto' | 'manual';
  providerId?: ProviderId;
  modelId?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  createdAt: number;
  status: 'streaming' | 'complete' | 'error' | 'cancelled';
  providerId?: string;
  modelId?: string;
  selectionMode?: 'auto' | 'manual';
  resolvedAutomatically?: boolean;
  fallbackUsed?: boolean;
  error?: string;
  toolCalls?: any[];
  attachments?: any[];
  metadata?: Record<string, any>;
}

export interface TaskRecord {
  id: string;
  sessionId: string;
  title: string;
  status: 'working' | 'completed' | 'paused' | 'failed';
  summary?: string;
  environment?: string;
  time?: string;
  createdAt: number;
  updatedAt: number;
  activities?: Array<{ id: string; label: string; status: 'completed' | 'active' | 'pending' | 'failed' }>;
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastMessageAt: number;
  messageCount: number;
  status: 'active' | 'completed' | 'error';
  selectedAI: AISelectionState;
  resolvedModels: string[];
  taskIds: string[];
  metadata?: Record<string, any>;
}

export interface ScheduledTask {
  id: string;
  title: string;
  schedule: string;
  instructions: string;
  status: 'active' | 'paused';
  lastRun?: number;
  nextRun?: number;
  createdAt: number;
}

const SESSIONS_STORAGE_KEY = 'aven_sessions_v2';
const MESSAGES_STORAGE_KEY = 'aven_messages_v2';
const SCHEDULED_TASKS_STORAGE_KEY = 'aven_scheduled_tasks_v2';
const ACTIVE_SESSION_STORAGE_KEY = 'aven_active_session_id_v2';
const AI_SELECTION_STORAGE_KEY = 'aven_ai_selection_v2';

export class SessionService {
  private sessions: Session[] = [];
  private messagesBySession: Record<string, Message[]> = {};
  private scheduledTasks: ScheduledTask[] = [];
  private activeSessionId: string | null = null;
  private aiSelection: AISelectionState = { mode: 'auto', modelId: 'auto' };

  private listeners: Set<() => void> = new Set();
  private activeAbortController: AbortController | null = null;
  private currentGenerationId: string | null = null;
  private isDraftNewSession: boolean = false;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (storedSessions) {
        this.sessions = JSON.parse(storedSessions);
      } else {
        this.sessions = [];
      }

      const storedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (storedMessages) {
        this.messagesBySession = JSON.parse(storedMessages);
      } else {
        this.messagesBySession = {};
      }

      const storedScheduled = localStorage.getItem(SCHEDULED_TASKS_STORAGE_KEY);
      if (storedScheduled) {
        this.scheduledTasks = JSON.parse(storedScheduled);
      } else {
        // Seed helpful initial scheduled automation (independent from sessions)
        this.scheduledTasks = [
          {
            id: 'sched-1',
            title: 'Daily Research & Work Briefing',
            schedule: 'Every day · 8:00 AM',
            instructions: 'Review computer activity, summarize open pull requests, and organize today priorities',
            status: 'active',
            createdAt: Date.now() - 86400000 * 3,
            nextRun: Date.now() + 3600000 * 10,
          },
          {
            id: 'sched-2',
            title: 'Downloads Folder Cache Cleanup',
            schedule: 'Every Friday · 6:00 PM',
            instructions: 'Inspect Downloads folder, identify stale installers, and notify before removing',
            status: 'active',
            createdAt: Date.now() - 86400000 * 7,
            nextRun: Date.now() + 86400000 * 2,
          }
        ];
        this.persistScheduledTasks();
      }

      const storedActiveId = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (storedActiveId && this.sessions.some(s => s.id === storedActiveId)) {
        this.activeSessionId = storedActiveId;
        this.isDraftNewSession = false;
      } else if (this.sessions.length > 0) {
        // Automatically restore the last active persisted session on startup/restart
        this.activeSessionId = this.sessions[0].id;
        this.isDraftNewSession = false;
        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, this.activeSessionId);
      } else {
        this.activeSessionId = null;
        this.isDraftNewSession = true;
      }

      const storedAiSelection = localStorage.getItem(AI_SELECTION_STORAGE_KEY);
      if (storedAiSelection) {
        this.aiSelection = JSON.parse(storedAiSelection);
      } else {
        this.aiSelection = { mode: 'auto', modelId: 'auto' };
      }
    } catch (e) {
      console.warn('Could not load session state', e);
      this.sessions = [];
      this.messagesBySession = {};
    }
  }

  private persistSessions() {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(this.sessions));
      if (this.activeSessionId) {
        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, this.activeSessionId);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      }
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to persist sessions', e);
    }
  }

  private persistMessages() {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(this.messagesBySession));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to persist messages', e);
    }
  }

  private persistScheduledTasks() {
    try {
      localStorage.setItem(SCHEDULED_TASKS_STORAGE_KEY, JSON.stringify(this.scheduledTasks));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to persist scheduled tasks', e);
    }
  }

  public persistAISelection() {
    try {
      localStorage.setItem(AI_SELECTION_STORAGE_KEY, JSON.stringify(this.aiSelection));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to persist AI selection', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    for (const l of this.listeners) {
      l();
    }
  }

  // ----------------------------------------------------
  // Title Generation (Fast & Deterministic without LLM call)
  // ----------------------------------------------------
  public generateTitle(prompt: string): string {
    if (!prompt || !prompt.trim()) return 'New Conversation';

    let cleaned = prompt.trim();

    // Strip common conversational preamble prefixes (looping handles cascaded prefixes like "Can you please" + "find the")
    const prefixRegex = /^(can you please|could you please|please help me|please|help me to|help me|can you|could you|i want you to|i want to|i need to|tell me about|explain to me|explain how to|explain how|explain what is|explain|what is|how do i|how to|write a|create a|generate a|summarize|find me the|find me|find the|find|search for)\s+/i;
    let prev = '';
    while (prev !== cleaned) {
      prev = cleaned;
      cleaned = cleaned.replace(prefixRegex, '');
    }

    // Take first sentence or up to 48 characters
    const firstSentence = cleaned.split(/[\.\?\!\n]/)[0].trim();
    let title = firstSentence.length > 50 ? `${firstSentence.slice(0, 48).trim()}...` : firstSentence;

    if (!title) title = prompt.trim().slice(0, 40);

    // Capitalize first character
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  // ----------------------------------------------------
  // Session Accessors
  // ----------------------------------------------------
  public getSessions(): Session[] {
    return [...this.sessions].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }

  public getSession(id: string): Session | undefined {
    return this.sessions.find(s => s.id === id);
  }

  public getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  public getActiveSession(): Session | null {
    if (!this.activeSessionId) return null;
    return this.getSession(this.activeSessionId) || null;
  }

  public setActiveSessionId(id: string | null) {
    this.activeSessionId = id;
    if (id) {
      this.isDraftNewSession = false;
    }
    this.persistSessions();
  }

  public isDraftSession(): boolean {
    return this.isDraftNewSession;
  }

  /**
   * Home navigation handler:
   * Retains the current active view (active conversation or new chat draft) without overwriting.
   */
  public selectHome() {
    // Retains current active state
  }

  public getMessages(sessionId: string): Message[] {
    return this.messagesBySession[sessionId] || [];
  }

  public getActiveMessages(): Message[] {
    if (!this.activeSessionId) return [];
    return this.getMessages(this.activeSessionId);
  }

  public getAISelection(): AISelectionState {
    return this.aiSelection;
  }

  public setAISelection(selection: AISelectionState) {
    this.aiSelection = selection;
    this.persistAISelection();
  }

  public getScheduledTasks(): ScheduledTask[] {
    return [...this.scheduledTasks];
  }

  public isGenerating(): boolean {
    return !!this.currentGenerationId;
  }

  // ----------------------------------------------------
  // New Chat Action (Draft Mode)
  // ----------------------------------------------------
  public startNewChat() {
    // 1. Abort any active response if generating
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
    this.currentGenerationId = null;

    // 2. Set draft mode - do NOT create an empty session in storage yet!
    // Session is only created & persisted after user sends their first meaningful message.
    this.activeSessionId = null;
    this.isDraftNewSession = true;
    localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    this.notifyListeners();
  }

  // ----------------------------------------------------
  // Delete Session
  // ----------------------------------------------------
  public deleteSession(sessionId: string) {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    delete this.messagesBySession[sessionId];
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = this.sessions[0]?.id || null;
    }
    this.persistSessions();
    this.persistMessages();
  }

  // ----------------------------------------------------
  // Search Sessions & Messages
  // ----------------------------------------------------
  public searchSessions(query: string): Session[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getSessions();

    return this.sessions.filter(session => {
      // Check title
      if (session.title.toLowerCase().includes(q)) return true;

      // Check messages inside session
      const msgs = this.messagesBySession[session.id] || [];
      return msgs.some(m => m.content.toLowerCase().includes(q));
    }).sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }

  // ----------------------------------------------------
  // Send Message & Response Execution Pipeline
  // ----------------------------------------------------
  public async sendMessage(
    content: string,
    options: {
      attachments?: any[];
      overrideModelId?: string;
    } = {}
  ): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Prevent concurrent duplicate submission while generation is active
    if (this.currentGenerationId) {
      console.warn('Generation already in flight; ignoring concurrent submission');
      return;
    }

    let sessionId = this.activeSessionId;

    // 1. Create session if this is the first message
    if (!sessionId || !this.getSession(sessionId)) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const title = this.generateTitle(trimmed);
      const newSession: Session = {
        id: sessionId,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastMessageAt: Date.now(),
        messageCount: 0,
        status: 'active',
        selectedAI: { ...this.aiSelection },
        resolvedModels: [],
        taskIds: [],
      };

      this.sessions.unshift(newSession);
      this.messagesBySession[sessionId] = [];
      this.activeSessionId = sessionId;
      this.isDraftNewSession = false;
      this.persistSessions();
    }

    const session = this.getSession(sessionId)!;
    if (!this.messagesBySession[sessionId]) {
      this.messagesBySession[sessionId] = [];
    }

    // Debounce / deduplicate identical consecutive user message within 1.5 seconds
    const existingMsgs = this.messagesBySession[sessionId];
    const lastUserMsg = [...existingMsgs].reverse().find(m => m.role === 'user');
    if (lastUserMsg && lastUserMsg.content === trimmed && (Date.now() - lastUserMsg.createdAt < 1500)) {
      console.warn('Duplicate user message submission detected; ignoring duplicate turn');
      return;
    }

    // 2. Persist single user message immediately
    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sessionId,
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
      status: 'complete',
      attachments: options.attachments,
    };

    existingMsgs.push(userMessage);

    session.lastMessageAt = Date.now();
    session.updatedAt = Date.now();
    session.messageCount = existingMsgs.length;
    this.persistMessages();
    this.persistSessions();

    // 3. Execute assistant response pipeline
    await this.executeAssistantResponse(sessionId, { overrideModelId: options.overrideModelId });
  }

  /**
   * Internal assistant response execution pipeline.
   * Handles provider validation, streaming placeholder, calling aiService/modelRouter,
   * progressive chunks, and persistence.
   */
  private async executeAssistantResponse(
    sessionId: string,
    options: { overrideModelId?: string } = {}
  ): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) return;

    if (!this.messagesBySession[sessionId]) {
      this.messagesBySession[sessionId] = [];
    }

    // Check if any usable AI provider exists
    const usableProviders = aiService.getUsableProviders();
    if (usableProviders.length === 0) {
      // DO NOT fake a response!
      // Show clear inline setup state as required
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        sessionId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        status: 'error',
        error: 'NO_PROVIDER_CONFIGURED',
      };
      this.messagesBySession[sessionId].push(errorMsg);
      session.lastMessageAt = Date.now();
      session.messageCount = this.messagesBySession[sessionId].length;
      this.persistMessages();
      this.persistSessions();
      return;
    }

    // Create assistant placeholder message for streaming / responses
    const generationId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.currentGenerationId = generationId;

    const abortController = new AbortController();
    this.activeAbortController = abortController;

    const manualModelId = options.overrideModelId || (this.aiSelection.mode === 'manual' ? this.aiSelection.modelId : undefined);

    const assistantMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sessionId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      status: 'streaming',
      selectionMode: this.aiSelection.mode,
      modelId: manualModelId,
    };

    this.messagesBySession[sessionId].push(assistantMsg);
    session.lastMessageAt = Date.now();
    session.messageCount = this.messagesBySession[sessionId].length;
    this.persistMessages();
    this.persistSessions();

    // Build AIRequest from context & active MCP tools
    const historyMessages = this.messagesBySession[sessionId]
      .filter(m => m.status === 'complete' && m.content)
      .slice(-10)
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    const activeTools = toolRegistry.getActiveToolsContext();

    const request: AIRequest = {
      messages: historyMessages,
      systemPrompt: 'You are Aven, an advanced, autonomous desktop AI agent. You assist the user with tasks across their computer, operating applications, browsing the web, and manipulating files with precision and safety.',
      tools: activeTools.length > 0 ? activeTools : undefined,
      abortSignal: abortController.signal,
      onChunk: (chunk: string) => {
        // Race condition prevention: verify generation matches
        if (this.currentGenerationId !== generationId) return;

        assistantMsg.content += chunk;
        this.notifyListeners();
      },
      onReasoningChunk: (chunk: string) => {
        // Race condition prevention: verify generation matches
        if (this.currentGenerationId !== generationId) return;

        assistantMsg.reasoning = (assistantMsg.reasoning || '') + chunk;
        this.notifyListeners();
      },
    };

    // Execute Task via aiService / modelRouter
    try {
      const response: AIResponse = await aiService.executeTask(request, {
        manualModelId,
      });

      // Verification: verify generation wasn't replaced
      if (this.currentGenerationId !== generationId) return;

      assistantMsg.content = response.text || assistantMsg.content || 'Done.';
      if (response.reasoning) {
        assistantMsg.reasoning = response.reasoning;
      }
      if (assistantMsg.reasoning && !assistantMsg.reasoning.trim()) {
        delete assistantMsg.reasoning;
      }
      assistantMsg.status = 'complete';
      assistantMsg.providerId = response.provider;
      assistantMsg.modelId = response.model;
      assistantMsg.selectionMode = this.aiSelection.mode;
      assistantMsg.resolvedAutomatically = this.aiSelection.mode === 'auto';
      assistantMsg.fallbackUsed = !!aiService.getLastFallbackEvent();
      assistantMsg.toolCalls = response.toolCalls;

      // Update session resolved models
      if (response.model && !session.resolvedModels.includes(response.model)) {
        session.resolvedModels.push(response.model);
      }
      session.updatedAt = Date.now();
      session.lastMessageAt = Date.now();

      this.persistMessages();
      this.persistSessions();
    } catch (err: any) {
      if (this.currentGenerationId !== generationId) return;

      if (abortController.signal.aborted) {
        assistantMsg.status = 'cancelled';
        if (!assistantMsg.content) {
          assistantMsg.content = 'Generation stopped.';
        }
      } else {
        assistantMsg.status = 'error';
        assistantMsg.error = err.message || 'Error occurred while contacting AI model.';
      }

      this.persistMessages();
      this.persistSessions();
    } finally {
      if (this.currentGenerationId === generationId) {
        this.currentGenerationId = null;
        this.activeAbortController = null;
        this.notifyListeners();
      }
    }
  }

  // ----------------------------------------------------
  // Stop / Cancel active response
  // ----------------------------------------------------
  public stopGeneration() {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
    this.currentGenerationId = null;
    this.notifyListeners();
  }

  // ----------------------------------------------------
  // Retry message (Does NOT duplicate user message!)
  // ----------------------------------------------------
  public async retryMessage(messageId: string): Promise<void> {
    const sessionId = this.activeSessionId;
    if (!sessionId) return;
    if (this.currentGenerationId) return;

    const msgs = this.messagesBySession[sessionId] || [];
    const idx = msgs.findIndex(m => m.id === messageId);
    if (idx === -1) return;

    const targetMsg = msgs[idx];
    let manualModelId: string | undefined;

    if (targetMsg.role === 'assistant') {
      manualModelId = targetMsg.modelId;
      // Remove the failed assistant message (preserves the single user message!)
      this.messagesBySession[sessionId] = msgs.filter(m => m.id !== messageId);
    } else {
      // If user retried from a user message, remove subsequent assistant messages
      this.messagesBySession[sessionId] = msgs.slice(0, idx + 1);
    }

    this.persistMessages();

    // Re-run assistant response WITHOUT pushing another user message
    await this.executeAssistantResponse(sessionId, { overrideModelId: manualModelId });
  }
}

export const sessionService = new SessionService();
export default sessionService;
