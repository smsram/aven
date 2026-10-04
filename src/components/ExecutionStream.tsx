import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Pause, Play } from 'lucide-react';
import AvenMark from './AvenMark';

export interface ExecutionStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
  detail?: string;
}

interface ExecutionStreamProps {
  steps?: ExecutionStep[];
  agentMessage?: string;
  isPaused?: boolean;
  onTogglePause?: () => void;
  className?: string;
}

const defaultSteps: ExecutionStep[] = [
  { id: '1', label: 'Found previous session', status: 'completed' },
  { id: '2', label: 'Opened VS Code', status: 'completed' },
  { id: '3', label: 'Restored workspace', status: 'completed' },
  { id: '4', label: 'Inspecting unfinished changes', status: 'active', detail: 'Reading diff in MapScreen.tsx:35' },
  { id: '5', label: 'Continue implementation', status: 'pending' },
  { id: '6', label: 'Verify result', status: 'pending' },
];

export const ExecutionStream: React.FC<ExecutionStreamProps> = ({
  steps = defaultSteps,
  agentMessage = 'I found your previous LocalMiles session.',
  isPaused = false,
  onTogglePause,
  className = '',
}) => {
  return (
    <div
      className={`execution-stream-container ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E7E7E7',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Agent Natural Language Statement */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(37, 150, 190, 0.08)',
              border: '1px solid rgba(37, 150, 190, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AvenMark size={14} color="#2596BE" />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Aven
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
              "{agentMessage}"
            </div>
          </div>
        </div>

        {/* Stream Actions */}
        {onTogglePause && (
          <button
            type="button"
            onClick={onTogglePause}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: '#F3F4F6',
              border: '1px solid #E5E7EB',
              color: '#4B5563',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E5E7EB')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
          >
            {isPaused ? <Play size={12} fill="#4B5563" /> : <Pause size={12} />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        )}
      </div>

      {/* Natural Language Steps Stream */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '8px 18px',
          alignItems: 'center',
          paddingTop: '8px',
          borderTop: '1px solid #F3F4F6',
        }}
      >
        {steps.map((step) => {
          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: step.status === 'completed'
                  ? '#111111'
                  : step.status === 'active'
                  ? '#2596BE'
                  : '#9CA3AF',
                fontWeight: step.status === 'active' ? 500 : 400,
              }}
            >
              {step.status === 'completed' && (
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#E5E7EB',
                    color: '#4B5563',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={9} strokeWidth={2.5} />
                </div>
              )}

              {step.status === 'active' && (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(37, 150, 190, 0.4)',
                    }}
                  />
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#2596BE',
                      zIndex: 1,
                    }}
                  />
                </div>
              )}

              {step.status === 'pending' && (
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '1.5px solid #D1D5DB',
                  }}
                />
              )}

              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExecutionStream;
