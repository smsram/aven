import React from 'react';
import { Clock, Check, ChevronRight, FileCode, Search } from 'lucide-react';

interface HistoryListProps {
  onSelectTask: (taskTitle: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ onSelectTask }) => {
  const historyGroups = [
    {
      label: 'Today',
      tasks: [
        { id: '1', title: 'Continue LocalMiles project', time: '12m ago', files: '4 files', status: 'completed' },
        { id: '2', title: 'Fix Flutter scanner', time: '2h ago', files: '1 file', status: 'completed' },
        { id: '3', title: 'Research Gemini API', time: '4h ago', files: 'Web research', status: 'completed' },
      ],
    },
    {
      label: 'Yesterday',
      tasks: [
        { id: '4', title: 'Build landing page', time: '4:20 PM', files: '12 files', status: 'completed' },
        { id: '5', title: 'Analyze project', time: '11:00 AM', files: 'Repository review', status: 'completed' },
      ],
    },
    {
      label: 'Last Week',
      tasks: [
        { id: '6', title: 'Setup SQLite database migration', time: 'Oct 1', files: '6 files', status: 'completed' },
        { id: '7', title: 'Configure Android ADB debugging', time: 'Sep 30', files: 'Device sync', status: 'completed' },
      ],
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '52px',
          borderBottom: '1px solid #E7E7E7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        <h1 style={{ fontSize: '15px', fontWeight: 600, color: '#111111' }}>
          Task History
        </h1>
        <div style={{ fontSize: '12px', color: '#6B7280' }}>
          7 previous sessions
        </div>
      </div>

      {/* Main Content Area */}
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
        {historyGroups.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '28px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                paddingLeft: '4px',
              }}
            >
              {group.label}
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E7E7E7',
                overflow: 'hidden',
              }}
            >
              {group.tasks.map((task, tIdx) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.title)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: tIdx < group.tasks.length - 1 ? '1px solid #F3F4F6' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6B7280',
                      }}
                    >
                      <Check size={11} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280', display: 'flex', gap: '8px' }}>
                        <span>{task.files}</span>
                        <span>•</span>
                        <span>{task.time}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280' }}>Open session</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
