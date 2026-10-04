import React, { useState, useEffect } from 'react';
import windowService from '../services/windowService';

export const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      const max = await windowService.isMaximized();
      setIsMaximized(max);
    };
    checkMaximized();
    window.addEventListener('resize', checkMaximized);
    return () => window.removeEventListener('resize', checkMaximized);
  }, []);

  const handleMinimize = async () => {
    await windowService.minimize();
  };

  const handleToggleMaximize = async () => {
    await windowService.toggleMaximize();
    const max = await windowService.isMaximized();
    setIsMaximized(max);
  };

  const handleClose = async () => {
    await windowService.close();
  };

  return (
    <div
      className="titlebar-no-drag"
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        userSelect: 'none',
      }}
    >
      {/* Minimize */}
      <button
        type="button"
        onClick={handleMinimize}
        title="Minimize"
        aria-label="Minimize"
        style={{
          width: '46px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: 'var(--foreground, #4B5563)',
          cursor: 'pointer',
          padding: 0,
          transition: 'background-color 0.1s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.15)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 5.5H9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </button>

      {/* Maximize / Restore */}
      <button
        type="button"
        onClick={handleToggleMaximize}
        title={isMaximized ? 'Restore' : 'Maximize'}
        aria-label={isMaximized ? 'Restore' : 'Maximize'}
        style={{
          width: '46px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: 'var(--foreground, #4B5563)',
          cursor: 'pointer',
          padding: 0,
          transition: 'background-color 0.1s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.15)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {isMaximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="2.5" y="0.5" width="7" height="7" stroke="currentColor" strokeWidth="1" />
            <path d="M0.5 2.5V9.5H7.5" stroke="currentColor" strokeWidth="1" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" />
          </svg>
        )}
      </button>

      {/* Close */}
      <button
        type="button"
        onClick={handleClose}
        title="Close"
        aria-label="Close"
        style={{
          width: '46px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: 'var(--foreground, #4B5563)',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.1s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#E81123';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--foreground, #4B5563)';
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export default WindowControls;
