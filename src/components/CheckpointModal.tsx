import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, RotateCcw, Check, FileCode, Shield } from 'lucide-react';

interface CheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 900,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '90%',
            maxWidth: '620px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E7E7E7',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E7E7E7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} color="#2596BE" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111111' }}>
                  Workspace Checkpoint #cp-74f8b2
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                  Created 2 minutes ago • Automated pre-edit state
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X size={15} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(37, 150, 190, 0.06)',
                border: '1px solid rgba(37, 150, 190, 0.2)',
                fontSize: '12px',
                color: '#1F7FA3',
              }}
            >
              <Shield size={14} color="#2596BE" />
              <span>Aven took this snapshot before modifying MapScreen.tsx and location_service.dart.</span>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                Files in Snapshot
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCode size={13} color="#2596BE" />
                    <span>src/screens/MapScreen.tsx</span>
                  </div>
                  <span style={{ color: '#10B981' }}>+42, -12</span>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCode size={13} color="#10B981" />
                    <span>lib/services/location_service.dart</span>
                  </div>
                  <span style={{ color: '#10B981' }}>+18, -3</span>
                </div>
              </div>
            </div>

            {/* Diff Preview */}
            <div style={{ border: '1px solid #E7E7E7', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 12px', backgroundColor: '#F3F4F6', fontSize: '11px', fontWeight: 500, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>
                Diff: MapScreen.tsx (Line 35)
              </div>
              <div style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: '1.6', backgroundColor: '#FAFAFA' }}>
                <div style={{ color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '1px 4px' }}>
                  - const rawCoords = await Location.getCurrentPosition();
                </div>
                <div style={{ color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '1px 4px' }}>
                  + const cachedCoords = await LocationCache.getLatestCoordinates();
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: '#F9FAFB',
              borderTop: '1px solid #E7E7E7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#4B5563',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
              }}
            >
              Close
            </button>
            <button
              onClick={() => {
                alert('Restored workspace to checkpoint #cp-74f8b2');
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#FFFFFF',
                backgroundColor: '#111111',
              }}
            >
              <RotateCcw size={13} />
              <span>Restore Snapshot</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CheckpointModal;
