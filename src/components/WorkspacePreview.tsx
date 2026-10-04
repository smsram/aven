import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Terminal, FileCode, Check, Search, GitBranch, RefreshCw, Maximize2, ExternalLink } from 'lucide-react';

interface WorkspacePreviewProps {
  mode?: 'vscode' | 'desktop' | 'browser';
  isAvenActive?: boolean;
  className?: string;
  onOpenExternal?: () => void;
}

export const WorkspacePreview: React.FC<WorkspacePreviewProps> = ({
  isAvenActive = true,
  className = '',
  onOpenExternal,
}) => {
  const [activeTab, setActiveTab] = useState<'MapScreen.tsx' | 'location_service.dart'>('MapScreen.tsx');
  const [showTerminal, setShowTerminal] = useState(true);

  return (
    <div
      className={`workspace-preview-frame ${className}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '440px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E7E7E7',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* VS Code Window Header / Titlebar */}
      <div
        style={{
          height: '36px',
          backgroundColor: '#F3F4F6',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          userSelect: 'none',
        }}
      >
        {/* Left Window Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '8px', fontWeight: 500 }}>
            Visual Studio Code
          </span>
        </div>

        {/* Center Title & Agent Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#111111' }}>
            LocalMiles — MapScreen.tsx
          </span>
          {isAvenActive && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(37, 150, 190, 0.1)',
                border: '1px solid rgba(37, 150, 190, 0.25)',
                fontSize: '11px',
                fontWeight: 500,
                color: '#2596BE',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#2596BE',
                  display: 'inline-block',
                }}
              />
              <span>Aven operating</span>
            </motion.div>
          )}
        </div>

        {/* Right Window Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenExternal && (
            <button
              onClick={onOpenExternal}
              title="Open full computer display"
              style={{ color: '#6B7280', display: 'flex', alignItems: 'center' }}
            >
              <ExternalLink size={13} />
            </button>
          )}
          <Maximize2 size={13} color="#9CA3AF" />
        </div>
      </div>

      {/* Editor Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', backgroundColor: '#FAFAFA' }}>
        {/* Activity Bar (VS Code left rail) */}
        <div
          style={{
            width: '42px',
            backgroundColor: '#F3F4F6',
            borderRight: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '10px',
            gap: '14px',
            userSelect: 'none',
          }}
        >
          <Code2 size={18} color="#2596BE" />
          <Search size={16} color="#9CA3AF" />
          <div style={{ position: 'relative' }}>
            <GitBranch size={16} color="#9CA3AF" />
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                backgroundColor: '#2596BE',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: 700,
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              4
            </span>
          </div>
        </div>

        {/* File Tree Explorer (Compact) */}
        <div
          style={{
            width: '170px',
            backgroundColor: '#F9FAFB',
            borderRight: '1px solid #E5E7EB',
            padding: '10px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            userSelect: 'none',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', padding: '0 4px 6px', letterSpacing: '0.04em' }}>
            LOCALMILES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ color: '#4B5563', padding: '2px 4px' }}>▾ src</div>
            <div style={{ color: '#4B5563', padding: '2px 4px 2px 12px' }}>▾ screens</div>
            <div
              onClick={() => setActiveTab('MapScreen.tsx')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 6px 3px 20px',
                borderRadius: '4px',
                backgroundColor: activeTab === 'MapScreen.tsx' ? '#E5E7EB' : 'transparent',
                color: activeTab === 'MapScreen.tsx' ? '#111111' : '#4B5563',
                cursor: 'pointer',
              }}
            >
              <FileCode size={11} color="#2596BE" />
              <span>MapScreen.tsx</span>
            </div>
            <div
              onClick={() => setActiveTab('location_service.dart')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 6px 3px 20px',
                borderRadius: '4px',
                backgroundColor: activeTab === 'location_service.dart' ? '#E5E7EB' : 'transparent',
                color: activeTab === 'location_service.dart' ? '#111111' : '#4B5563',
                cursor: 'pointer',
              }}
            >
              <FileCode size={11} color="#10B981" />
              <span>location_service.dart</span>
            </div>
            <div style={{ color: '#6B7280', padding: '2px 4px 2px 12px' }}>▸ components</div>
            <div style={{ color: '#6B7280', padding: '2px 4px' }}>• package.json</div>
          </div>
        </div>

        {/* Code Viewport */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
          {/* Editor Tabs */}
          <div
            style={{
              height: '32px',
              backgroundColor: '#F3F4F6',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              onClick={() => setActiveTab('MapScreen.tsx')}
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 14px',
                backgroundColor: activeTab === 'MapScreen.tsx' ? '#FFFFFF' : 'transparent',
                borderRight: '1px solid #E5E7EB',
                borderTop: activeTab === 'MapScreen.tsx' ? '2px solid #2596BE' : '2px solid transparent',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: activeTab === 'MapScreen.tsx' ? '#111111' : '#6B7280',
                cursor: 'pointer',
              }}
            >
              <FileCode size={12} color="#2596BE" />
              <span>MapScreen.tsx</span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2596BE' }} />
            </div>

            <div
              onClick={() => setActiveTab('location_service.dart')}
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 14px',
                backgroundColor: activeTab === 'location_service.dart' ? '#FFFFFF' : 'transparent',
                borderRight: '1px solid #E5E7EB',
                borderTop: activeTab === 'location_service.dart' ? '2px solid #2596BE' : '2px solid transparent',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: activeTab === 'location_service.dart' ? '#111111' : '#6B7280',
                cursor: 'pointer',
              }}
            >
              <FileCode size={12} color="#10B981" />
              <span>location_service.dart</span>
            </div>
          </div>

          {/* Code Lines with Syntax Highlighting and Live Aven Modification */}
          <div
            style={{
              flex: 1,
              padding: '12px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: '1.7',
              color: '#374151',
              overflowY: 'auto',
              position: 'relative',
              backgroundColor: '#FFFFFF',
            }}
          >
            {activeTab === 'MapScreen.tsx' ? (
              <div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>28</span>
                  <span style={{ color: '#8B5CF6' }}>export const </span>
                  <span style={{ color: '#2563EB', fontWeight: 600 }}>MapScreen</span>
                  <span> = ({`{ userSession }`}: MapProps) =&gt; {`{`}</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>29</span>
                  <span style={{ paddingLeft: '16px', color: '#8B5CF6' }}>const </span>
                  <span>[location, setLocation] = useState&lt;GeoPoint | null&gt;(null);</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>30</span>
                  <span style={{ paddingLeft: '16px', color: '#8B5CF6' }}>const </span>
                  <span>[isTracking, setIsTracking] = useState(false);</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>31</span>
                  <span></span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>32</span>
                  <span style={{ paddingLeft: '16px', color: '#059669' }}>// Initialize GPS caching subsystem</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>33</span>
                  <span style={{ paddingLeft: '16px', color: '#8B5CF6' }}>useEffect</span>
                  <span>(() =&gt; {`{`}</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>34</span>
                  <span style={{ paddingLeft: '32px', color: '#8B5CF6' }}>const </span>
                  <span>initLocationService = </span>
                  <span style={{ color: '#8B5CF6' }}>async </span>
                  <span>() =&gt; {`{`}</span>
                </div>

                {/* Highlighted Line operated by Aven */}
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: 'rgba(37, 150, 190, 0.08)',
                    borderRadius: '4px',
                    padding: '2px 0',
                    position: 'relative',
                  }}
                >
                  <span style={{ width: '32px', color: '#2596BE', fontWeight: 600, userSelect: 'none' }}>35</span>
                  <span style={{ paddingLeft: '48px', color: '#2596BE', fontWeight: 500 }}>
                    const cachedCoords = await LocationCache.getLatestCoordinates();
                  </span>

                  {/* Pulsing Aven Operating Cursor */}
                  {isAvenActive && (
                    <motion.div
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{
                        width: '2px',
                        height: '16px',
                        backgroundColor: '#2596BE',
                        display: 'inline-block',
                        marginLeft: '3px',
                        verticalAlign: 'middle',
                      }}
                    />
                  )}

                  {/* Floating Agent Badge */}
                  {isAvenActive && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '-18px',
                        backgroundColor: '#111111',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        zIndex: 10,
                      }}
                    >
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#2596BE' }} />
                      <span>Aven editing</span>
                    </motion.div>
                  )}
                </div>

                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>36</span>
                  <span style={{ paddingLeft: '48px', color: '#8B5CF6' }}>if </span>
                  <span>(cachedCoords &amp;&amp; !cachedCoords.isExpired()) {`{`}</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>37</span>
                  <span style={{ paddingLeft: '64px' }}>setLocation(cachedCoords);</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>38</span>
                  <span style={{ paddingLeft: '64px' }}>setIsTracking(true);</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>39</span>
                  <span style={{ paddingLeft: '48px' }}>{`}`}</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>40</span>
                  <span style={{ paddingLeft: '32px' }}>{`};`}</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>41</span>
                  <span style={{ paddingLeft: '32px' }}>initLocationService();</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF', userSelect: 'none' }}>42</span>
                  <span style={{ paddingLeft: '16px' }}>{`}, [userSession]);`}</span>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF' }}>1</span>
                  <span style={{ color: '#059669' }}>// LocationService Provider for Flutter &amp; Dart</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF' }}>2</span>
                  <span style={{ color: '#8B5CF6' }}>import </span>
                  <span style={{ color: '#2563EB' }}>'package:geolocator/geolocator.dart';</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF' }}>3</span>
                  <span style={{ color: '#8B5CF6' }}>class </span>
                  <span style={{ color: '#111111', fontWeight: 600 }}>LocationCache </span>
                  <span>{`{`}</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF' }}>4</span>
                  <span style={{ paddingLeft: '16px', color: '#8B5CF6' }}>static Future&lt;Position?&gt; </span>
                  <span>getLatestCoordinates() async {`{`}</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF' }}>5</span>
                  <span style={{ paddingLeft: '32px', color: '#8B5CF6' }}>return </span>
                  <span>await Geolocator.getLastKnownPosition();</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF' }}>6</span>
                  <span style={{ paddingLeft: '16px' }}>{`}`}</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '32px', color: '#9CA3AF' }}>7</span>
                  <span>{`}`}</span>
                </div>
              </div>
            )}
          </div>

          {/* Integrated VS Code Terminal (collapsible) */}
          {showTerminal && (
            <div
              style={{
                height: '110px',
                borderTop: '1px solid #E5E7EB',
                backgroundColor: '#F9FAFB',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  height: '24px',
                  backgroundColor: '#F3F4F6',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 10px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#6B7280',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={11} color="#6B7280" />
                  <span>TERMINAL — PowerShell 7</span>
                  <span style={{ color: '#10B981' }}>● Ready</span>
                </div>
                <button
                  onClick={() => setShowTerminal(false)}
                  style={{ color: '#9CA3AF', fontSize: '11px', cursor: 'pointer' }}
                >
                  Hide
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: '#374151',
                  overflowY: 'auto',
                }}
              >
                <div>PS D:\Projects\LocalMiles&gt; git status -s</div>
                <div style={{ color: '#2563EB' }}> M src/screens/MapScreen.tsx</div>
                <div style={{ color: '#2563EB' }}> M lib/services/location_service.dart</div>
                <div style={{ color: '#059669', marginTop: '2px' }}>
                  [Aven] Verified dependency resolution. Restoring cached session snapshot #cp-74f8b2.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspacePreview;
