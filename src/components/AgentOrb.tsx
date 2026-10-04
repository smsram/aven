import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AvenMark, { AvenState } from './AvenMark';

export type AgentOrbState = AvenState;

interface AgentOrbProps {
  state?: AgentOrbState;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  onClick?: () => void;
  showStatusLabel?: boolean;
}

export const AgentOrb: React.FC<AgentOrbProps> = ({
  state = 'idle',
  size = 'lg',
  className = '',
  onClick,
  showStatusLabel = false,
}) => {
  let orbSize = 140;
  let markSize = 76;

  if (typeof size === 'number') {
    orbSize = size;
    markSize = Math.round(size * 0.54);
  } else {
    switch (size) {
      case 'sm':
        orbSize = 34;
        markSize = 20;
        break;
      case 'md':
        orbSize = 64;
        markSize = 36;
        break;
      case 'lg':
        orbSize = 140;
        markSize = 76;
        break;
      case 'xl':
        orbSize = 180;
        markSize = 98;
        break;
    }
  }

  // Mark color based on agent state and orb appearance
  const getMarkColor = () => {
    switch (state) {
      case 'idle':
        return '#111111';
      case 'listening':
      case 'understanding':
      case 'thinking':
      case 'working':
      case 'waiting':
      case 'responding':
        return '#2596BE';
      case 'completed':
        return '#10B981';
      case 'error':
        return '#E05252';
      default:
        return '#111111';
    }
  };

  const markColor = getMarkColor();

  return (
    <div
      className={`agent-orb-container ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Dynamic Soundwave Acoustic Rings for Listening State */}
      {state === 'listening' && (
        <div
          className="orb-waves"
          style={{
            position: 'absolute',
            inset: -orbSize * 0.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <div
            className="orb-sound-ring"
            style={{
              width: orbSize,
              height: orbSize,
            }}
          />
          <div
            className="orb-sound-ring"
            style={{
              width: orbSize,
              height: orbSize,
              animationDelay: '0.6s',
            }}
          />
        </div>
      )}

      {/* Completion Aura */}
      {state === 'completed' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0.8 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 1.0, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: orbSize,
            height: orbSize,
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Ground Shadow / Aura */}
      {size !== 'sm' && (
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            width: orbSize * 0.75,
            height: 18,
            borderRadius: '50%',
            background: state === 'error'
              ? 'radial-gradient(ellipse, rgba(224, 82, 82, 0.3) 0%, transparent 75%)'
              : 'radial-gradient(ellipse, rgba(37, 150, 190, 0.25) 0%, transparent 75%)',
            filter: 'blur(6px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Volumetric Agent Orb Glass Body */}
      <motion.div
        animate={
          state === 'idle'
            ? { scale: [1, 1.012, 1] }
            : state === 'listening'
            ? { scale: 1.05 }
            : state === 'working'
            ? { scale: [1, 1.025, 1] }
            : { scale: 1 }
        }
        transition={{
          duration: state === 'idle' ? 4 : state === 'working' ? 1.8 : 0.3,
          repeat: state === 'idle' || state === 'working' ? Infinity : 0,
          ease: 'easeInOut',
        }}
        className="agent-orb-glass"
        style={{
          width: orbSize,
          height: orbSize,
          zIndex: 2,
        }}
      >
        {/* Canonical Aven Mark rendered inside orb */}
        <div
          style={{
            width: markSize,
            height: markSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4,
            filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.65))',
          }}
        >
          <AvenMark size={markSize} color={markColor} state={state} />
        </div>
      </motion.div>

      {/* Optional Status Label below orb */}
      {showStatusLabel && (
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            style={{
              marginTop: 10,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: state === 'idle' ? '#6B7280' : state === 'error' ? '#E05252' : '#2596BE',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {state === 'working' && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#2596BE',
                  display: 'inline-block',
                }}
              />
            )}
            <span>{state.replace('-', ' ')}</span>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default AgentOrb;
