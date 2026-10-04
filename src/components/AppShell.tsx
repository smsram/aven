import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Zap,
} from 'lucide-react';
import AgentOrb, { AgentOrbState } from './AgentOrb';
import Sidebar, { RouteId } from './Sidebar';
import WindowControls from './WindowControls';
import VoiceState from './VoiceState';
import RecoveryModal from './RecoveryModal';
import QuickActionsModal from './QuickActionsModal';
import OnboardingView from './OnboardingView';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TasksList from '../screens/TasksList';
import TaskView from '../screens/TaskView';
import ComputerWorkspace from '../screens/ComputerWorkspace';
import BrowserWorkspace from '../screens/BrowserWorkspace';
import FilesWorkspace from '../screens/FilesWorkspace';
import PhoneWorkspace from '../screens/PhoneWorkspace';
import MemoryView from '../screens/MemoryView';
import ConnectionList from '../screens/ConnectionList';
import SettingsView from '../screens/SettingsView';

// Services
import windowService from '../services/windowService';
import settingsService from '../services/settingsService';
import sessionService from '../services/sessionService';

export const AppShell: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<RouteId>('/');
  const [agentState, setAgentState] = useState<AgentOrbState>('idle');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => !settingsService.isOnboardingComplete());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => settingsService.isSidebarCollapsed());
  const [selectedModelId, setSelectedModelId] = useState<string>('auto');
  const [activeTaskTitle, setActiveTaskTitle] = useState('Open Chrome, research the best options, compare them and create a summary.');
  const [isTaskActive, setIsTaskActive] = useState(false);

  // Global hotkeys: Ctrl+Space (Voice), Ctrl+/ (Quick Actions), Ctrl+K (New Chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Space for Voice
      if ((e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        setIsVoiceOpen(true);
      }
      // Ctrl + / for Quick Actions
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsQuickActionsOpen(prev => !prev);
      }
      // Ctrl + K for New Chat
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        sessionService.startNewChat();
        setCurrentRoute('/');
        setAgentState('idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartTask = (prompt: string, _tools: string[], modelId?: string) => {
    sessionService.sendMessage(prompt, { overrideModelId: modelId });
    setCurrentRoute('/');
  };

  const handleVoiceComplete = (transcription: string) => {
    setIsVoiceOpen(false);
    sessionService.sendMessage(transcription);
    setCurrentRoute('/');
  };

  const handleNewChat = () => {
    sessionService.startNewChat();
    setCurrentRoute('/');
    setAgentState('idle');
  };

  const handleSelectSession = (sessionId: string) => {
    sessionService.setActiveSessionId(sessionId);
    setCurrentRoute('/');
    setAgentState('idle');
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev: boolean) => {
      const next = !prev;
      settingsService.setSidebarCollapsed(next);
      return next;
    });
  };

  // FULL-SCREEN ONBOARDING VIEW
  // If onboarding is incomplete or requested, render it directly as the primary full-screen view.
  // Main app, sidebar, and background views are completely hidden with zero glass/blur.
  if (isOnboardingOpen) {
    return (
      <OnboardingView
        onComplete={() => setIsOnboardingOpen(false)}
      />
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--background, #FFFFFF)',
        color: 'var(--foreground, #111111)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'fixed',
        inset: 0,
      }}
    >
      {/* ========================================================
          DESKTOP WINDOW TITLEBAR (Minimal Windows Custom Chrome)
          Aven branding is anchored in the sidebar; titlebar stays clean.
          Agent state switcher removed per requirements.
          ======================================================== */}
      <div
        className="titlebar-drag-region"
        style={{
          height: '38px',
          backgroundColor: 'var(--titlebar-bg, #F7F7F8)',
          borderBottom: '1px solid var(--border, #E7E7E7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '12px',
          paddingRight: '0px',
          userSelect: 'none',
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        {/* Left Drag Region - Minimal and clean */}
        <div
          className="titlebar-drag-region"
          style={{ flex: 1, height: '100%' }}
        />

        {/* Right Titlebar Actions & Visually Consistent Window Controls */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {/* Quick Actions Button */}
          <button
            className="titlebar-no-drag"
            onClick={() => setIsQuickActionsOpen(true)}
            title="Quick Actions (Ctrl + /)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: 'var(--surface, #FFFFFF)',
              border: '1px solid var(--border, #E5E7EB)',
              color: 'var(--foreground, #4B5563)',
              cursor: 'pointer',
              marginRight: '6px',
            }}
          >
            <Zap size={12} color="#F59E0B" />
            <span>Actions</span>
          </button>

          {/* Voice Push to Talk Trigger */}
          <button
            className="titlebar-no-drag"
            onClick={() => setIsVoiceOpen(true)}
            title="Talk to Aven (Ctrl + Space)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: 'var(--surface, #FFFFFF)',
              border: '1px solid var(--border, #E5E7EB)',
              color: 'var(--foreground, #374151)',
              cursor: 'pointer',
              marginRight: '12px',
            }}
          >
            <Mic size={12} color="#2596BE" />
            <span>Voice</span>
            <kbd style={{ fontSize: '9px', background: 'var(--surface-secondary, #F3F4F6)', padding: '1px 4px', borderRadius: '3px', color: 'var(--muted, #6B7280)' }}>
              Ctrl+Space
            </kbd>
          </button>

          {/* Consistent Windows-Style Monochrome Controls */}
          <WindowControls />
        </div>
      </div>

      {/* ========================================================
          MAIN WORKSPACE
          ======================================================== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Navigation Sidebar */}
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={(route) => {
            setCurrentRoute(route);
            if (route === '/task') {
              setAgentState('working');
            } else if (route === '/') {
              setAgentState('idle');
            }
          }}
          onNewChat={handleNewChat}
          onNewTask={handleNewChat}
          isTaskActive={isTaskActive}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />

        {/* Primary Workspace View */}
        <main
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: 'var(--background, #FFFFFF)',
          }}
        >
          {currentRoute === '/' && (
            <HomeScreen
              onVoiceTrigger={() => setIsVoiceOpen(true)}
              onNavigate={(route) => setCurrentRoute(route)}
              agentState={agentState}
              onStateChange={(s) => setAgentState(s)}
            />
          )}

          {currentRoute === '/tasks' && (
            <TasksList
              onSelectSession={handleSelectSession}
              onNewChat={handleNewChat}
              onNewTask={handleNewChat}
            />
          )}

          {currentRoute === '/task' && (
            <TaskView
              taskTitle={activeTaskTitle}
              activeModelId={selectedModelId}
              onBack={() => setCurrentRoute('/tasks')}
              onOpenRecovery={() => setIsRecoveryOpen(true)}
            />
          )}

          {currentRoute === '/computer' && (
            <ComputerWorkspace />
          )}

          {currentRoute === '/browser' && (
            <BrowserWorkspace />
          )}

          {currentRoute === '/files' && (
            <FilesWorkspace />
          )}

          {currentRoute === '/phone' && (
            <PhoneWorkspace />
          )}

          {currentRoute === '/memory' && (
            <MemoryView />
          )}

          {currentRoute === '/connections' && (
            <ConnectionList />
          )}

          {currentRoute === '/settings' && (
            <SettingsView
              onReopenOnboarding={() => setIsOnboardingOpen(true)}
              onNavigate={(route) => setCurrentRoute(route)}
            />
          )}
        </main>
      </div>

      {/* ========================================================
          MODALS & OVERLAYS
          ======================================================== */}


      {/* Natural Voice Interaction Modal */}
      <VoiceState
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onTranscribeComplete={handleVoiceComplete}
      />

      {/* Recovery Point Modal */}
      <RecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
      />

      {/* Quick Actions Modal */}
      <QuickActionsModal
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        onSelectAction={(promptText) => {
          handleStartTask(promptText, ['computer', 'browser', 'files']);
        }}
      />
    </div>
  );
};

export default AppShell;
