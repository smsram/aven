import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, RotateCcw, FileText, Check } from 'lucide-react';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
          zIndex: 900,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '90%',
            maxWidth: '560px',
            backgroundColor: 'var(--surface, #FFFFFF)',
            color: 'var(--foreground, #111111)',
            borderRadius: '12px',
            border: '1px solid var(--border, #E7E7E7)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border, #E7E7E7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#10B981" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground, #111111)' }}>
                  Recovery Point #rp-9104
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>
                  Created 3 minutes ago before file organization
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
                color: 'var(--muted, #6B7280)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--foreground, #4B5563)', lineHeight: '1.5', margin: 0 }}>
              If any action doesn't meet your expectations, Aven can restore the exact previous file locations and state with one click.
            </p>

            <div style={{ backgroundColor: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border, #E5E7EB)', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted, #6B7280)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Tracked Operations in this Point
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--foreground, #111111)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} color="#10B981" />
                  <span>8 files moved from Downloads to Documents folder</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} color="#10B981" />
                  <span>12 temporary installer caches queued for trash</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} color="#10B981" />
                  <span>Generated document Laptop_Comparison_Summary.md</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: 'var(--surface-secondary, #FAFAFA)',
              borderTop: '1px solid var(--border, #E7E7E7)',
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
                color: 'var(--foreground, #4B5563)',
                backgroundColor: 'var(--surface, #FFFFFF)',
                border: '1px solid var(--border, #E5E7EB)',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              onClick={() => {
                alert('Restored previous system state from Recovery Point #rp-9104.');
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
                color: 'var(--background, #FFFFFF)',
                backgroundColor: 'var(--foreground, #111111)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} />
              <span>Restore Previous State</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RecoveryModal;
