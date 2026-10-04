import React, { useState } from 'react';
import { Search, Brain, Check, Clock, Bookmark, Sparkles } from 'lucide-react';

export const MemoryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const recentContext = [
    'Monthly budget spreadsheet formulas and variances',
    'Downloads folder cleanup and archiving',
    'Previous browser research on budget laptops',
    'Tokyo flight preferences (Morning departures, non-stop preferred)',
    'Connected Android phone notification and display sync',
  ];

  const preferences = [
    { key: 'Preferred Browser', value: 'Google Chrome' },
    { key: 'Response Style', value: 'Direct & Concise (Take action first, report result)' },
    { key: 'Primary Screen Resolution', value: '2560 × 1440 (Windows 11)' },
    { key: 'Recovery Mode', value: 'Automatic snapshot before file operations' },
  ];

  const decisions = [
    'Always confirm before permanently deleting archives over 500MB',
    'Default output folder for synthesized documents: Documents / Summaries',
    'Keep connected Android phone synced with flight tickets and meeting agendas',
  ];

  const filteredContext = recentContext.filter(c =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={16} color="var(--accent, #2596BE)" />
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground, #111111)', margin: 0 }}>
            Memory
          </h1>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted, #6B7280)' }}>
          Context, preferences, and useful decisions Aven remembers
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          padding: '24px 28px',
          overflowY: 'auto',
          maxWidth: '800px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Search Field */}
        <div
          style={{
            position: 'relative',
            marginBottom: '26px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted, #9CA3AF)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memory..."
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '36px',
              paddingRight: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border, #E7E7E7)',
              backgroundColor: 'var(--surface-secondary, #FAFAFA)',
              fontSize: '13px',
              color: 'var(--foreground, #111111)',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease',
            }}
          />
        </div>

        {/* RECENT CONTEXT */}
        <div style={{ marginBottom: '26px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted, #9CA3AF)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              paddingLeft: '2px',
            }}
          >
            Recent Context
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border, #E7E7E7)',
              overflow: 'hidden',
            }}
          >
            {filteredContext.map((text, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderBottom: idx < filteredContext.length - 1 ? '1px solid var(--border, #F3F4F6)' : 'none',
                }}
              >
                <Clock size={13} color="var(--accent, #2596BE)" />
                <span style={{ fontSize: '13px', color: 'var(--foreground, #111111)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PREFERENCES */}
        <div style={{ marginBottom: '26px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted, #9CA3AF)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              paddingLeft: '2px',
            }}
          >
            Preferences
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border, #E7E7E7)',
              overflow: 'hidden',
            }}
          >
            {preferences.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: idx < preferences.length - 1 ? '1px solid var(--border, #F3F4F6)' : 'none',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--muted, #6B7280)' }}>{item.key}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground, #111111)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* IMPORTANT DECISIONS */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted, #9CA3AF)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              paddingLeft: '2px',
            }}
          >
            Learned Decisions
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border, #E7E7E7)',
              overflow: 'hidden',
            }}
          >
            {decisions.map((text, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderBottom: idx < decisions.length - 1 ? '1px solid var(--border, #F3F4F6)' : 'none',
                }}
              >
                <Check size={13} color="#10B981" />
                <span style={{ fontSize: '13px', color: 'var(--foreground, #374151)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryView;
