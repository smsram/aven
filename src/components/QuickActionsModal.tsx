import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppWindow, Search, FileSearch, FolderCheck, Camera, Eye, Play, MessageSquare, X } from 'lucide-react';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionText: string) => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  if (!isOpen) return null;

  const actions = [
    { label: 'Open application', prompt: 'Open application...', icon: AppWindow },
    { label: 'Search the web', prompt: 'Search the web for...', icon: Search },
    { label: 'Find a file', prompt: 'Find the file named...', icon: FileSearch },
    { label: 'Organize files', prompt: 'Organize my Downloads folder', icon: FolderCheck },
    { label: 'Take screenshot', prompt: 'Take a screenshot of the current screen and explain it', icon: Camera },
    { label: 'Read screen', prompt: 'Read what is currently displayed on my screen and summarize it', icon: Eye },
    { label: 'Start task', prompt: 'Start a new autonomous task: ', icon: Play },
    { label: 'Ask Aven', prompt: 'How do I...', icon: MessageSquare },
  ];

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 950,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -6 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '90%',
            maxWidth: '440px',
            backgroundColor: 'var(--surface, #FFFFFF)',
            color: 'var(--foreground, #111111)',
            borderRadius: '12px',
            border: '1px solid var(--border, #E7E7E7)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border, #F3F4F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground, #111111)' }}>
              Quick Actions
            </span>
            <button
              onClick={onClose}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted, #6B7280)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Action List */}
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {actions.map((act, i) => {
              const Icon = act.icon;
              return (
                <div
                  key={i}
                  onClick={() => {
                    onSelectAction(act.prompt);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: 'var(--foreground, #111111)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-secondary, #F3F4F6)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Icon size={15} color="var(--accent, #2596BE)" />
                  <span>{act.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickActionsModal;
