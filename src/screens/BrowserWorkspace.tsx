import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCw, Lock, Star, Search, ExternalLink, Globe, Check, Plane, Laptop } from 'lucide-react';
import AvenMark from '../components/AvenMark';

export const BrowserWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'flights' | 'tech'>('flights');
  const [url, setUrl] = useState('https://www.google.com/travel/flights/search?q=BLR-to-HND');

  const switchTab = (tab: 'flights' | 'tech') => {
    setActiveTab(tab);
    if (tab === 'flights') {
      setUrl('https://www.google.com/travel/flights/search?q=BLR-to-HND');
    } else {
      setUrl('https://www.theverge.com/guide/best-laptops-budget-comparison');
    }
  };

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
      {/* Top Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground, #111111)', margin: 0 }}>
            Browser
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '12px',
              backgroundColor: 'rgba(37, 150, 190, 0.08)',
              border: '1px solid rgba(37, 150, 190, 0.25)',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--accent, #2596BE)',
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
            <span>Aven is navigating</span>
          </div>
        </div>

        {/* Navigation Breadcrumb trail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted, #6B7280)' }}>
          <span style={{ color: 'var(--foreground, #111111)', fontWeight: 500 }}>Open website</span>
          <span>→</span>
          <span style={{ color: 'var(--foreground, #111111)', fontWeight: 500 }}>Compare fares</span>
          <span>→</span>
          <span style={{ color: 'var(--accent, #2596BE)', fontWeight: 600 }}>Save recommendation</span>
        </div>
      </div>

      {/* Main Browser Viewport */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--background, #FAFAFA)',
          overflow: 'hidden',
        }}
      >
        {/* Chrome-Style Window Container */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--surface, #FFFFFF)',
            borderRadius: '10px',
            border: '1px solid var(--border, #E7E7E7)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Chrome Tab Bar */}
          <div
            style={{
              height: '38px',
              backgroundColor: 'var(--surface-secondary, #EBECEE)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '0 10px',
              gap: '6px',
              userSelect: 'none',
            }}
          >
            {/* Window Dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px', marginBottom: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            </div>

            {/* Tab 1 */}
            <div
              onClick={() => switchTab('flights')}
              style={{
                height: '32px',
                padding: '0 12px',
                backgroundColor: activeTab === 'flights' ? 'var(--surface, #FFFFFF)' : 'transparent',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: activeTab === 'flights' ? 'var(--foreground, #111111)' : 'var(--muted, #6B7280)',
                fontWeight: activeTab === 'flights' ? 500 : 400,
                cursor: 'pointer',
              }}
            >
              <Plane size={13} color="#2596BE" />
              <span>Google Flights — BLR to Tokyo</span>
            </div>

            {/* Tab 2 */}
            <div
              onClick={() => switchTab('tech')}
              style={{
                height: '32px',
                padding: '0 12px',
                backgroundColor: activeTab === 'tech' ? 'var(--surface, #FFFFFF)' : 'transparent',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: activeTab === 'tech' ? 'var(--foreground, #111111)' : 'var(--muted, #6B7280)',
                fontWeight: activeTab === 'tech' ? 500 : 400,
                cursor: 'pointer',
              }}
            >
              <Laptop size={13} color="#2596BE" />
              <span>The Verge — Laptop Comparison</span>
            </div>
          </div>

          {/* Chrome URL / Navigation Bar */}
          <div
            style={{
              height: '40px',
              backgroundColor: 'var(--surface, #FFFFFF)',
              borderBottom: '1px solid var(--border, #E7E7E7)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted, #6B7280)' }}>
              <ArrowLeft size={14} style={{ cursor: 'pointer' }} />
              <ArrowRight size={14} style={{ color: 'var(--border, #D1D5DB)' }} />
              <RotateCw size={13} style={{ cursor: 'pointer' }} />
            </div>

            {/* Address Bar */}
            <div
              style={{
                flex: 1,
                height: '28px',
                backgroundColor: 'var(--surface-secondary, #F3F4F6)',
                borderRadius: '14px',
                border: '1px solid var(--border, #E5E7EB)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--foreground, #374151)',
                fontFamily: 'monospace',
              }}
            >
              <Lock size={12} color="#10B981" />
              <span style={{ color: 'var(--foreground, #111111)' }}>{url}</span>
            </div>

            <Star size={14} color="var(--muted, #9CA3AF)" style={{ cursor: 'pointer' }} />
          </div>

          {/* Actual Web Page Content */}
          <div
            style={{
              flex: 1,
              backgroundColor: 'var(--surface, #FFFFFF)',
              overflowY: 'auto',
              padding: '32px 48px',
              position: 'relative',
            }}
          >
            {/* Floating Aven Activity Overlay on the Page */}
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                position: 'sticky',
                top: '0px',
                float: 'right',
                zIndex: 20,
                backgroundColor: 'var(--foreground, #111111)',
                color: 'var(--background, #FFFFFF)',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(37, 150, 190, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AvenMark size={10} color="#2596BE" />
              </div>
              <span>Aven is extracting flight itineraries &amp; lowest fares...</span>
            </motion.div>

            {/* Web Page Content */}
            {activeTab === 'flights' ? (
              <div style={{ maxWidth: '720px' }}>
                <div style={{ fontSize: '12px', color: 'var(--accent, #2596BE)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Google Flights • Search Results
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--foreground, #111111)', margin: '8px 0 16px' }}>
                  Flights from Bengaluru (BLR) to Tokyo (HND)
                </h1>
                <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--foreground, #4B5563)', marginBottom: '20px' }}>
                  Showing 14 options for non-stop and 1-stop flights. Fare dip alert detected on Singapore Airlines connection.
                </p>

                {/* Target inspected flight card */}
                <div
                  style={{
                    backgroundColor: 'rgba(37, 150, 190, 0.04)',
                    border: '1.5px solid #2596BE',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    position: 'relative',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '16px',
                      backgroundColor: '#2596BE',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    Aven Selected Best Deal
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground, #111111)' }}>
                      Singapore Airlines (1 stop, 1h 45m layover in SIN)
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#10B981' }}>
                      ₹42,800
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)' }}>
                    Depart: 11:15 PM BLR → Arrive: 3:30 PM HND (+1) • Total travel time: 11h 45m
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                    border: '1px solid var(--border, #E5E7EB)',
                    borderRadius: '8px',
                    padding: '14px 18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground, #111111)' }}>
                      ANA All Nippon Airways (Direct non-stop)
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground, #111111)' }}>
                      ₹58,400
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)' }}>
                    Depart: 8:40 PM BLR → Arrive: 7:20 AM HND (+1) • Total travel time: 8h 10m
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: '720px' }}>
                <div style={{ fontSize: '12px', color: 'var(--accent, #2596BE)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  The Verge Buying Guide
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--foreground, #111111)', margin: '8px 0 16px' }}>
                  The Best Budget Laptops (2026)
                </h1>
                <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--foreground, #4B5563)', marginBottom: '20px' }}>
                  Tested and reviewed for battery endurance, typing comfort, and display fidelity under ₹50,000.
                </p>

                <div style={{ padding: '16px', border: '1px solid var(--border, #E5E7EB)', borderRadius: '8px', backgroundColor: 'var(--surface-secondary, #F9FAFB)' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground, #111111)', marginBottom: '4px' }}>
                    ASUS Vivobook 15
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--foreground, #374151)' }}>
                    Top recommendation for student &amp; office tasks. Outstanding 8.5-hour battery benchmark and crisp 1080p display.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserWorkspace;
