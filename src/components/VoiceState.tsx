import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AgentOrb, { AgentOrbState } from './AgentOrb';
import { useTheme } from '../context/ThemeContext';

interface VoiceStateProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscribeComplete: (transcription: string) => void;
}

export const VoiceState: React.FC<VoiceStateProps> = ({
  isOpen,
  onClose,
  onTranscribeComplete,
}) => {
  const { resolvedTheme } = useTheme();
  const [orbState, setOrbState] = useState<AgentOrbState>('listening');
  const [stage, setStage] = useState<'listening' | 'released'>('listening');
  const [transcription] = useState('Open Chrome, find the cheapest flight to Hyderabad and compare options.');

  useEffect(() => {
    if (isOpen) {
      setOrbState('listening');
      setStage('listening');
    }
  }, [isOpen]);

  const handleRelease = () => {
    if (stage === 'released') return;
    setStage('released');
    setOrbState('understanding');

    setTimeout(() => {
      onTranscribeComplete(transcription);
    }, 1200);
  };

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === ' ' || e.code === 'Space') {
        handleRelease();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [isOpen, stage]);

  if (!isOpen) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: isDark ? 'rgba(15, 20, 25, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          userSelect: 'none',
          color: 'var(--foreground, #111111)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-secondary, #F3F4F6)',
            color: 'var(--muted, #6B7280)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <X size={18} />
        </button>

        {/* Center Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '560px',
            padding: '20px',
          }}
        >
          {/* Authentic Aven Agent Orb from Aven-Logo-Temp */}
          <AgentOrb state={orbState} size="xl" />

          {/* Voice Content */}
          <div style={{ marginTop: '28px' }}>
            {stage === 'listening' ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: '20px',
                    fontWeight: 500,
                    color: 'var(--foreground, #111111)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Listening...
                </motion.div>

                {/* Subtle Voice Waveform */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    height: '24px',
                    margin: '18px 0',
                  }}
                >
                  {[0.3, 0.7, 1, 0.5, 0.9, 0.4, 0.8, 0.95, 0.6, 0.3].map((height, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scaleY: [height * 0.3, height * 1.3, height * 0.4],
                      }}
                      transition={{
                        duration: 0.8 + (i % 3) * 0.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        width: '3px',
                        height: '18px',
                        borderRadius: '2px',
                        backgroundColor: '#2596BE',
                        transformOrigin: 'center',
                      }}
                    />
                  ))}
                </div>

                {/* Recognized Live Speech */}
                <div
                  style={{
                    fontSize: '14px',
                    color: 'var(--foreground, #4B5563)',
                    marginBottom: '16px',
                    fontStyle: 'italic',
                  }}
                >
                  "{transcription}"
                </div>

                <div style={{ fontSize: '12px', color: 'var(--muted, #9CA3AF)' }}>
                  Release to send <span style={{ color: 'var(--border, #D1D5DB)' }}>•</span> Press <kbd style={{ padding: '2px 6px', background: 'var(--surface-secondary, #F3F4F6)', borderRadius: '4px', border: '1px solid var(--border, #E5E7EB)', color: 'var(--foreground, #6B7280)', fontSize: '11px' }}>Ctrl + Space</kbd>
                </div>

                <button
                  onClick={handleRelease}
                  style={{
                    marginTop: '22px',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--foreground, #111111)',
                    color: 'var(--background, #FFFFFF)',
                    fontSize: '12px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Release to Send
                </button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground, #111111)' }}>
                  "I'll find the cheapest flights and compare options for you."
                </div>
                <div style={{ fontSize: '12px', color: 'var(--accent, #2596BE)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2596BE' }} />
                  <span>Starting autonomous task...</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceState;
