import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, CheckCircle2, History, FileText, Monitor, ShieldCheck, X } from 'lucide-react';

interface ContextPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onViewCheckpoint: () => void;
  taskTitle?: string;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  isOpen,
  onToggle,
  onViewCheckpoint,
  taskTitle = 'Continue LocalMiles project',
}) => {
  const [filesExpanded, setFilesExpanded] = useState(false);

  const changedFiles = [
    { name: 'MapScreen.tsx', path: 'src/screens/MapScreen.tsx', diff: '+42, -12' },
    { name: 'location_service.dart', path: 'lib/services/location_service.dart', diff: '+18, -3' },
    { name: 'pubspec.yaml', path: 'pubspec.yaml', diff: '+2, -0' },
    { name: 'README.md', path: 'README.md', diff: '+5, -1' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{
            height: '100%',
            backgroundColor: '#FAFAFA',
            borderLeft: '1px solid #E7E7E7',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #E7E7E7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#111111' }}>
                Context
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(37, 150, 190, 0.08)',
                  color: '#2596BE',
                }}
              >
                Active
              </span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              title="Collapse Context Panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                color: '#6B7280',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0F2F5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X size={14} />
            </button>
          </div>

          {/* Panel Content (Scrollable compact rows) */}
          <div
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {/* TASK SECTION */}
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: '#9CA3AF',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                }}
              >
                Task
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#111111',
                  lineHeight: '1.4',
                }}
              >
                {taskTitle}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                Restoring cache layer in Flutter & React workspace
              </div>
            </div>

            {/* CURRENT ENVIRONMENT */}
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: '#9CA3AF',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                }}
              >
                Current Environment
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7E7E7',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Monitor size={13} color="#2596BE" />
                    <span style={{ fontSize: '12px', color: '#111111' }}>Windows 11</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 500 }}>Host</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7E7E7',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2596BE' }} />
                    <span style={{ fontSize: '12px', color: '#111111' }}>VS Code</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#2596BE', fontWeight: 500 }}>Active</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7E7E7',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#9CA3AF' }} />
                    <span style={{ fontSize: '12px', color: '#111111' }}>Chrome</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#6B7280' }}>Background</span>
                </div>
              </div>
            </div>

            {/* FILES */}
            <div>
              <div
                onClick={() => setFilesExpanded(!filesExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                  }}
                >
                  Files
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#111111' }}>4 changed</span>
                  {filesExpanded ? <ChevronDown size={12} color="#6B7280" /> : <ChevronRight size={12} color="#6B7280" />}
                </div>
              </div>

              {filesExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  {changedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E7E7E7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <FileText size={12} color="#6B7280" />
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#111111',
                            fontFamily: 'var(--font-mono)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {file.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#10B981',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {file.diff}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CHECKPOINT */}
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: '#9CA3AF',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                }}
              >
                Checkpoint
              </div>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E7E7E7',
                  borderRadius: '8px',
                  padding: '10px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <History size={13} color="#2596BE" />
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#111111' }}>
                    Created 2 min ago
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                  Automatic snapshot before edit
                </div>
                <button
                  type="button"
                  onClick={onViewCheckpoint}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#111111',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E5E7EB')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                >
                  View Checkpoint
                </button>
              </div>
            </div>

            {/* INTEGRITY / PERMISSIONS */}
            <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #E7E7E7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '11px' }}>
                <ShieldCheck size={13} color="#10B981" />
                <span>Sandbox Active • Read/Write</span>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default ContextPanel;
