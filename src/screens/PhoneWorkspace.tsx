import React, { useState } from 'react';
import { Smartphone, Wifi, Battery, ChevronRight, Settings, FileText, Bell, Check, ArrowRight } from 'lucide-react';
import AvenMark from '../components/AvenMark';

export const PhoneWorkspace: React.FC = () => {
  const [activeTask, setActiveTask] = useState('Open Settings and adjust display timeout to 5 minutes');

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground, #111111)', margin: 0 }}>
            Phone
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
            <span>Pixel 8 Connected</span>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)' }}>
          Android Device Bridge (Authenticated Pair)
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--background, #FAFAFA)',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <div style={{ marginBottom: '14px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--foreground, #4B5563)', margin: 0 }}>
            Aven connects to your companion phone to automate settings, transfer files, and manage alerts.
          </p>
        </div>

        {/* Realistic Android Phone Device Preview */}
        <div
          style={{
            width: '280px',
            height: '540px',
            backgroundColor: '#111111',
            borderRadius: '36px',
            padding: '10px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
            border: '4px solid var(--border, #D1D5DB)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Phone Screen Glass */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: '26px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Phone Status Bar */}
            <div
              style={{
                height: '24px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '10px',
                fontWeight: 600,
                color: '#111111',
                userSelect: 'none',
              }}
            >
              <span>11:48</span>
              {/* Front Camera Punchhole */}
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#000000', margin: '0 auto' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wifi size={10} />
                <Battery size={10} />
              </div>
            </div>

            {/* Android UI Inside Phone */}
            <div style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#111111', marginBottom: '14px' }}>
                Settings
              </div>

              {/* Android Settings Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={14} color="#6B7280" />
                    <div>
                      <div style={{ fontWeight: 500, color: '#111111' }}>Display Timeout</div>
                      <div style={{ fontSize: '10px', color: '#2596BE' }}>Updating to 5 min by Aven</div>
                    </div>
                  </div>
                  <ChevronRight size={13} color="#9CA3AF" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={14} color="#6B7280" />
                    <div>
                      <div style={{ fontWeight: 500, color: '#111111' }}>Notifications</div>
                      <div style={{ fontSize: '10px', color: '#6B7280' }}>Do Not Disturb schedule</div>
                    </div>
                  </div>
                  <ChevronRight size={13} color="#9CA3AF" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color="#10B981" />
                    <div>
                      <div style={{ fontWeight: 500, color: '#111111' }}>Received Files</div>
                      <div style={{ fontSize: '10px', color: '#10B981' }}>Flight_Ticket_Tokyo.pdf synced</div>
                    </div>
                  </div>
                  <Check size={13} color="#10B981" />
                </div>
              </div>

              {/* Floating Aven Indicator inside Phone Screen */}
              <div
                style={{
                  marginTop: 'auto',
                  backgroundColor: '#111111',
                  color: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  alignSelf: 'center',
                }}
              >
                <AvenMark size={10} color="#2596BE" state="working" />
                <span>Aven is assisting with phone</span>
              </div>
            </div>

            {/* Android Navigation Bar Pill */}
            <div style={{ height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '48px', height: '3px', borderRadius: '2px', backgroundColor: '#CBD5E1' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneWorkspace;
