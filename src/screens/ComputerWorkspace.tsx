import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Maximize2, Minimize2, MousePointer, Shield, Check, AppWindow } from 'lucide-react';
import AvenMark from '../components/AvenMark';

export const ComputerWorkspace: React.FC = () => {
  const [viewMode, setViewMode] = useState<'desktop' | 'fullscreen'>('desktop');
  const [activeApp, setActiveApp] = useState<'excel' | 'chrome' | 'explorer'>('excel');

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background, #FFFFFF)',
        color: 'var(--foreground, #111111)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '52px',
          borderBottom: '1px solid var(--border, #E7E7E7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          backgroundColor: 'var(--surface, #FFFFFF)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground, #111111)', margin: 0 }}>
            Computer
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '11px',
              fontWeight: 500,
              color: '#10B981',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }}
            />
            <span>Connected</span>
          </div>
        </div>

        {/* View Switcher: Desktop vs Fullscreen Application Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setViewMode('desktop')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: viewMode === 'desktop' ? 'var(--foreground, #111111)' : 'var(--muted, #6B7280)',
              backgroundColor: viewMode === 'desktop' ? 'var(--surface-secondary, #F3F4F6)' : 'transparent',
              border: '1px solid var(--border, #E5E7EB)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <AppWindow size={13} />
            <span>Desktop Windows</span>
          </button>

          <button
            onClick={() => setViewMode('fullscreen')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: viewMode === 'fullscreen' ? 'var(--foreground, #111111)' : 'var(--muted, #6B7280)',
              backgroundColor: viewMode === 'fullscreen' ? 'var(--surface-secondary, #F3F4F6)' : 'transparent',
              border: '1px solid var(--border, #E5E7EB)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Maximize2 size={13} />
            <span>Fullscreen Application</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflowY: 'auto',
          backgroundColor: 'var(--background, #FAFAFA)',
        }}
      >
        {/* Dominant Live Screen Preview */}
        <div
          style={{
            flex: 1,
            minHeight: '480px',
            backgroundColor: '#0F172A',
            borderRadius: '10px',
            border: '1px solid var(--border, #D1D5DB)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {viewMode === 'desktop' ? (
            /* DESKTOP MODE: Windows 11 Desktop with multiple applications */
            <div
              style={{
                flex: 1,
                position: 'relative',
                background: 'radial-gradient(ellipse at 50% 60%, #1E293B 0%, #0F172A 100%)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {/* Background Window: Chrome */}
              <div
                onClick={() => setActiveApp('chrome')}
                style={{
                  position: 'absolute',
                  top: '28px',
                  left: '48px',
                  width: '64%',
                  height: '70%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  border: '1px solid #CBD5E1',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  zIndex: activeApp === 'chrome' ? 10 : 2,
                }}
              >
                <div style={{ height: '28px', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span style={{ fontSize: '10px', color: '#475569', marginLeft: '6px' }}>Google Chrome — Flight Comparison</span>
                </div>
                <div style={{ padding: '14px', fontSize: '12px', color: '#334155' }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px' }}>Google Flights Search</div>
                  <div>Showing 12 flights from BLR to HND. Non-stop options sorted by fare.</div>
                </div>
              </div>

              {/* Foreground Active Window: Excel */}
              <motion.div
                animate={{ scale: activeApp === 'excel' ? 1 : 0.98 }}
                onClick={() => setActiveApp('excel')}
                style={{
                  width: '80%',
                  height: '84%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                  border: '1px solid #CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  zIndex: activeApp === 'excel' ? 10 : 3,
                  position: 'relative',
                }}
              >
                {/* Window Header */}
                <div style={{ height: '32px', backgroundColor: '#107C41', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Microsoft Excel — Monthly_Budget_Report.xlsx [Aven Operating]</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.4)' }} />
                  </div>
                </div>

                {/* Excel Ribbon & Grid */}
                <div style={{ flex: 1, padding: '14px 18px', backgroundColor: '#FAFAFA', overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                    Home &gt; Formulas &gt; AutoSum &gt; Calculate Variance
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '6px 8px' }}>A</th>
                        <th style={{ padding: '6px 8px' }}>B (Category)</th>
                        <th style={{ padding: '6px 8px' }}>C (Budget)</th>
                        <th style={{ padding: '6px 8px' }}>D (Actual)</th>
                        <th style={{ padding: '6px 8px' }}>E (Variance)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 8px', color: '#94A3B8' }}>1</td>
                        <td style={{ padding: '6px 8px', fontWeight: 500 }}>Software Tools</td>
                        <td style={{ padding: '6px 8px' }}>$1,200</td>
                        <td style={{ padding: '6px 8px' }}>$980</td>
                        <td style={{ padding: '6px 8px', color: '#10B981' }}>+$220</td>
                      </tr>

                      {/* Active cell operated by Aven */}
                      <tr style={{ backgroundColor: 'rgba(37, 150, 190, 0.08)', borderBottom: '1px solid #F1F5F9', position: 'relative' }}>
                        <td style={{ padding: '6px 8px', color: '#2596BE', fontWeight: 600 }}>2</td>
                        <td style={{ padding: '6px 8px', fontWeight: 500 }}>Office Hardware</td>
                        <td style={{ padding: '6px 8px' }}>$3,500</td>
                        <td style={{ padding: '6px 8px', color: '#2596BE', fontWeight: 600 }}>$3,150</td>
                        <td style={{ padding: '6px 8px', color: '#10B981' }}>+$350</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Aven Virtual Mouse & Activity Badge */}
                <motion.div
                  animate={{ x: [0, 40, 20, 0], y: [0, -15, 10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    top: '55%',
                    left: '52%',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 20,
                  }}
                >
                  <MousePointer size={16} fill="#2596BE" color="#FFFFFF" />
                  <div
                    style={{
                      backgroundColor: '#111111',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#2596BE' }} />
                    <span>Aven updating cell E2</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          ) : (
            /* FULLSCREEN APPLICATION MODE */
            <div
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #18202F 0%, #0F172A 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                padding: '40px',
                color: '#FFFFFF',
                textAlign: 'center',
              }}
            >
              <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Fullscreen Application Surface
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#F8FAFC', marginBottom: '12px' }}>
                  Direct Coordinate Interaction
                </h2>
                <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6', marginBottom: '24px' }}>
                  Aven does not depend exclusively on browser DOMs. It operates maximized desktop suites, creative tools, CAD viewers, presentation displays, and native Windows software via screen perception and mouse/keyboard events.
                </p>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#2596BE',
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#F1F5F9' }}>
                    Aven is interacting with this application
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Windows Taskbar Host Footer */}
          <div
            style={{
              height: '36px',
              backgroundColor: 'rgba(241, 245, 249, 0.95)',
              borderTop: '1px solid #CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 14px',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
              <div style={{ width: '18px', height: '18px', display: 'grid', gridTemplateColumns: 'repeat(2, 8px)', gap: '2px' }}>
                <div style={{ backgroundColor: '#0284C7' }} />
                <div style={{ backgroundColor: '#0284C7' }} />
                <div style={{ backgroundColor: '#0284C7' }} />
                <div style={{ backgroundColor: '#0284C7' }} />
              </div>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                Windows Host Desktop Session
              </span>
            </div>
          </div>
        </div>

        {/* Control & Activity Area Below Preview */}
        <div
          style={{
            backgroundColor: 'var(--surface, #FFFFFF)',
            borderRadius: '8px',
            border: '1px solid var(--border, #E7E7E7)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Aven is controlling:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--foreground, #111111)' }}>
              <span style={{ fontWeight: 500, color: 'var(--accent, #2596BE)' }}>Microsoft Excel</span>
              <span style={{ color: 'var(--muted, #D1D5DB)' }}>•</span>
              <span>Google Chrome</span>
              <span style={{ color: 'var(--muted, #D1D5DB)' }}>•</span>
              <span>Windows Explorer</span>
            </div>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>
            Direct mouse, keyboard, and screen perception active
          </span>
        </div>
      </div>
    </div>
  );
};

export default ComputerWorkspace;
