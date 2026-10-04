import React, { useState } from 'react';
import { Folder, Check, Trash2, ArrowRight, ShieldCheck, AlertCircle, FileText, Archive } from 'lucide-react';

export const FilesWorkspace: React.FC = () => {
  const [applied, setApplied] = useState(false);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Folder size={16} color="var(--accent, #2596BE)" />
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground, #111111)', margin: 0 }}>
            Files
          </h1>
          <span style={{ fontSize: '12px', color: 'var(--muted, #6B7280)' }}>
            Outcome-focused file management
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10B981' }}>
          <ShieldCheck size={14} />
          <span>Recovery Point Protected</span>
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          padding: '24px 28px',
          overflowY: 'auto',
          maxWidth: '820px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Outcome Header Card */}
        <div
          style={{
            backgroundColor: 'var(--surface, #FFFFFF)',
            borderRadius: '10px',
            border: '1px solid var(--border, #E7E7E7)',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Automated Task Outcome
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground, #111111)', marginTop: '2px', marginBottom: 0 }}>
                Downloads Folder Cleanup
              </h2>
            </div>

            <button
              onClick={() => setApplied(true)}
              disabled={applied}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: applied ? '#10B981' : 'var(--foreground, #111111)',
                color: 'var(--background, #FFFFFF)',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                cursor: applied ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {applied ? '✓ Changes Applied' : 'Apply Organization'}
            </button>
          </div>

          {/* Outcome Metric Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border, #F3F4F6)' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground, #111111)' }}>32</div>
              <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>Items reviewed</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#E05252' }}>12</div>
              <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>Unnecessary files</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent, #2596BE)' }}>8</div>
              <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>Files organized</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#F59E0B' }}>4</div>
              <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)' }}>Awaiting confirmation</div>
            </div>
          </div>
        </div>

        {/* Section 1: Files Organized by Aven */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Organized to Target Folders (8 files)
          </div>
          <div style={{ backgroundColor: 'var(--surface, #FFFFFF)', borderRadius: '8px', border: '1px solid var(--border, #E7E7E7)', overflow: 'hidden' }}>
            {[
              { file: 'Flight_Ticket_Tokyo.pdf', from: 'Downloads', to: 'Documents / Trips' },
              { file: 'Q3_Financial_Summary.xlsx', from: 'Downloads', to: 'Documents / Finance' },
              { file: 'Product_Spec_Sheet.pdf', from: 'Downloads', to: 'Documents / Work' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < 2 ? '1px solid var(--border, #F3F4F6)' : 'none', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} color="#2596BE" />
                  <span style={{ fontWeight: 500, color: 'var(--foreground, #111111)' }}>{item.file}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted, #6B7280)' }}>
                  <span>{item.from}</span>
                  <ArrowRight size={12} />
                  <span style={{ color: '#10B981', fontWeight: 500 }}>{item.to}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Unnecessary Files Identified for Cleaning */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Unnecessary Caches &amp; Old Installers (12 files)
          </div>
          <div style={{ backgroundColor: 'var(--surface, #FFFFFF)', borderRadius: '8px', border: '1px solid var(--border, #E7E7E7)', overflow: 'hidden' }}>
            {[
              { file: 'node-v22-installer.msi', size: '142 MB', reason: 'Old installer already installed' },
              { file: 'slack-setup-cache.tmp', size: '85 MB', reason: 'Temporary installation residual' },
              { file: 'incomplete_dl_7129.crdownload', size: '14 MB', reason: 'Corrupted aborted download' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < 2 ? '1px solid var(--border, #F3F4F6)' : 'none', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trash2 size={13} color="#E05252" />
                  <span style={{ color: 'var(--foreground, #111111)' }}>{item.file}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--muted, #9CA3AF)' }}>{item.reason}</span>
                  <span style={{ color: '#E05252', fontWeight: 500 }}>{item.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Awaiting Confirmation */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Awaiting Your Confirmation (4 files)
          </div>
          <div style={{ backgroundColor: 'var(--surface, #FFFFFF)', borderRadius: '8px', border: '1px solid var(--border, #E7E7E7)', overflow: 'hidden' }}>
            {[
              { file: 'Client_Assets_Backup_2025.zip', size: '1.2 GB', prompt: 'Keep in Downloads or Archive to External Drive?' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={14} color="#F59E0B" />
                  <div>
                    <span style={{ fontWeight: 500, color: 'var(--foreground, #111111)' }}>{item.file}</span>
                    <span style={{ color: 'var(--muted, #6B7280)', marginLeft: '6px' }}>({item.size})</span>
                    <div style={{ fontSize: '11px', color: 'var(--muted, #6B7280)', marginTop: '2px' }}>{item.prompt}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: 'var(--surface-secondary, #F3F4F6)', border: '1px solid var(--border, #E5E7EB)', fontSize: '11px', color: 'var(--foreground, #374151)', cursor: 'pointer' }}>
                    Keep
                  </button>
                  <button style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: 'var(--accent, #2596BE)', border: 'none', fontSize: '11px', color: '#FFFFFF', cursor: 'pointer' }}>
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesWorkspace;
