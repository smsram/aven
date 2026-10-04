import React, { useState, useEffect } from 'react';
import {
  Plus,
  Home,
  ListTodo,
  Monitor,
  Globe,
  Folder,
  Smartphone,
  Server,
  Brain,
  Settings,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import AvenMark from './AvenMark';
import settingsService from '../services/settingsService';

export type RouteId =
  | '/'
  | '/tasks'
  | '/task'
  | '/computer'
  | '/browser'
  | '/files'
  | '/phone'
  | '/memory'
  | '/connections'
  | '/settings';

interface SidebarProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  onNewChat?: () => void;
  onNewTask?: () => void;
  isTaskActive?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  onNewChat,
  onNewTask,
  isTaskActive = false,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [userName, setUserName] = useState(() => settingsService.getSettings().userName || 'Alex R.');

  useEffect(() => {
    const s = settingsService.getSettings();
    if (s.userName) setUserName(s.userName);
  }, [currentRoute]);

  const primaryNav = [
    { id: 'home', label: 'Home', route: '/' as RouteId, icon: Home },
    { id: 'tasks', label: 'Tasks', route: '/tasks' as RouteId, icon: ListTodo, badge: isTaskActive ? '1' : undefined },
    { id: 'computer', label: 'Computer', route: '/computer' as RouteId, icon: Monitor },
    { id: 'browser', label: 'Browser', route: '/browser' as RouteId, icon: Globe },
    { id: 'files', label: 'Files', route: '/files' as RouteId, icon: Folder },
    { id: 'phone', label: 'Phone', route: '/phone' as RouteId, icon: Smartphone },
  ];

  const secondaryNav = [
    { id: 'connections', label: 'Connections', route: '/connections' as RouteId, icon: Server },
    { id: 'memory', label: 'Memory', route: '/memory' as RouteId, icon: Brain },
    { id: 'settings', label: 'Settings', route: '/settings' as RouteId, icon: Settings },
  ];

  const sidebarWidth = isCollapsed ? '56px' : '220px';

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100%',
        backgroundColor: 'var(--sidebar-bg, #FAFAFA)',
        borderRight: '1px solid var(--border, #E7E7E7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isCollapsed ? '12px 6px' : '14px 12px',
        userSelect: 'none',
        transition: 'width 0.18s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        zIndex: 20,
      }}
    >
      {/* Top Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Brand Header & Collapse Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '2px 0' : '2px 4px',
            minHeight: '32px',
          }}
        >
          {!isCollapsed ? (
            <>
              {/* Brand: Aven Logo + Aven Name (NO GREEN STATUS DOT) */}
              <div
                onClick={() => onNavigate('/')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                title="Go to Home"
              >
                <AvenMark size={20} color="#2596BE" />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--foreground, #111111)', lineHeight: '1.2' }}>
                    Aven
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--muted, #6B7280)', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                    AI Computer Agent
                  </span>
                </div>
              </div>

              {/* Collapse button */}
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                style={{
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted, #6B7280)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-secondary, #F3F4F6)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <PanelLeftClose size={15} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div
                onClick={() => onNavigate('/')}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Aven — Go to Home"
              >
                <AvenMark size={22} color="#2596BE" />
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted, #6B7280)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-secondary, #F3F4F6)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <PanelLeftOpen size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Primary Action: + New Chat */}
        <button
          type="button"
          onClick={onNewChat || onNewTask}
          title={isCollapsed ? 'New Chat' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isCollapsed ? '0' : '6px',
            width: '100%',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--foreground, #111111)',
            color: 'var(--background, #FFFFFF)',
            fontSize: '12px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            padding: isCollapsed ? '0' : '0 8px',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={15} strokeWidth={2.2} />
          {!isCollapsed && <span>New Chat</span>}
        </button>

        {/* Workspace Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {!isCollapsed && (
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: 'var(--muted, #9CA3AF)',
                padding: '4px 8px 4px',
                textTransform: 'uppercase',
              }}
            >
              Workspace
            </div>
          )}

          {primaryNav.map((item) => {
            const isSelected = currentRoute === item.route || (item.route === '/tasks' && currentRoute === '/task');
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.route)}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  width: '100%',
                  height: '34px',
                  padding: isCollapsed ? '0' : '0 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: isSelected ? 'var(--foreground, #111111)' : 'var(--muted, #4B5563)',
                  backgroundColor: isSelected ? 'var(--surface, #FFFFFF)' : 'transparent',
                  boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                  border: isSelected ? '1px solid var(--border, #E7E7E7)' : '1px solid transparent',
                  fontWeight: isSelected ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={16} color={isSelected ? 'var(--accent, #2596BE)' : 'var(--muted, #6B7280)'} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(37, 150, 190, 0.12)',
                      color: 'var(--accent, #2596BE)',
                      fontWeight: 600,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                {isCollapsed && isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      right: '2px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '14px',
                      borderRadius: '2px',
                      backgroundColor: 'var(--accent, #2596BE)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Connections, Memory, Settings, User Profile */}
      <div
        style={{
          borderTop: '1px solid var(--border, #E7E7E7)',
          paddingTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {!isCollapsed && (
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'var(--muted, #9CA3AF)',
              padding: '2px 8px 4px',
              textTransform: 'uppercase',
            }}
          >
            System
          </div>
        )}

        {secondaryNav.map((item) => {
          const isSelected = currentRoute === item.route;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.route)}
              title={isCollapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? '0' : '8px',
                width: '100%',
                height: '32px',
                padding: isCollapsed ? '0' : '0 8px',
                borderRadius: '6px',
                fontSize: '12px',
                color: isSelected ? 'var(--foreground, #111111)' : 'var(--muted, #4B5563)',
                backgroundColor: isSelected ? 'var(--surface, #FFFFFF)' : 'transparent',
                fontWeight: isSelected ? 500 : 400,
                border: isSelected ? '1px solid var(--border, #E7E7E7)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} color={isSelected ? 'var(--accent, #2596BE)' : 'var(--muted, #6B7280)'} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* User Workspace Profile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '8px',
            padding: isCollapsed ? '8px 0 2px' : '8px 8px 2px',
            marginTop: '4px',
            borderTop: '1px solid var(--border, #F3F4F6)',
          }}
          title={isCollapsed ? `${userName} (Windows Desktop Agent)` : undefined}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-secondary, #E5E7EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--foreground, #374151)',
              flexShrink: 0,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground, #111111)', lineHeight: '1.2', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {userName}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--muted, #9CA3AF)', lineHeight: '1.2' }}>
                Windows Desktop Agent
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
