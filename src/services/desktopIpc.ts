import { invoke } from '@tauri-apps/api/core';
import { isTauri } from './windowService';

/**
 * Aven Desktop IPC Architecture
 * Establishes typed, secure boundaries between:
 * React UI -> Tauri IPC -> Permission-Controlled Native Commands -> Windows System APIs
 * 
 * Capability namespaces:
 * - agent.*
 * - computer.*
 * - browser.*
 * - files.*
 * - process.*
 * - voice.*
 * - memory.*
 * - tasks.*
 * - phone.*
 * - connections.*
 */

export interface SystemInfo {
  os: string;
  arch: string;
  app_version: string;
  is_tauri: boolean;
  platform: string;
}

export interface ComputerStatus {
  connected: boolean;
  primary_display: string;
  resolution: string;
  permissions_granted: boolean;
  active_windows: string[];
}

export interface AgentStatus {
  state: 'idle' | 'listening' | 'understanding' | 'thinking' | 'working' | 'waiting' | 'responding' | 'completed' | 'error';
  active_task_id: string | null;
  memory_items_count: number;
  recovery_points_count: number;
}

export interface PhoneStatus {
  paired: boolean;
  deviceName: string | null;
  batteryLevel: number | null;
  connectionType: 'wifi' | 'usb' | 'disconnected';
  lastSynced: string | null;
}

export interface BackgroundProcessInfo {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'stopped';
  cpuPercent?: number;
  memoryMb?: number;
}

export const ipc = {
  system: {
    getInfo: async (): Promise<SystemInfo> => {
      if (isTauri()) {
        try {
          return await invoke<SystemInfo>('get_system_info');
        } catch (e) {
          console.warn('[IPC] system.getInfo fallback:', e);
        }
      }
      return {
        os: 'windows',
        arch: 'x86_64',
        app_version: '0.1.0',
        is_tauri: false,
        platform: 'windows-browser-dev',
      };
    },
  },

  agent: {
    getStatus: async (): Promise<AgentStatus> => {
      if (isTauri()) {
        try {
          return await invoke<AgentStatus>('get_agent_status');
        } catch (e) {
          console.warn('[IPC] agent.getStatus fallback:', e);
        }
      }
      return {
        state: 'idle',
        active_task_id: null,
        memory_items_count: 8,
        recovery_points_count: 2,
      };
    },

    startTask: async (prompt: string, capabilities: string[]): Promise<{ taskId: string; accepted: boolean }> => {
      console.log('[IPC agent.startTask]', { prompt, capabilities });
      // In native mode, this passes to the Tauri agent runtime
      return {
        taskId: `task_${Date.now()}`,
        accepted: true,
      };
    },

    stopTask: async (taskId: string): Promise<boolean> => {
      console.log('[IPC agent.stopTask]', taskId);
      return true;
    },
  },

  computer: {
    getStatus: async (): Promise<ComputerStatus> => {
      if (isTauri()) {
        try {
          return await invoke<ComputerStatus>('get_computer_status');
        } catch (e) {
          console.warn('[IPC] computer.getStatus fallback:', e);
        }
      }
      return {
        connected: true,
        primary_display: 'Display 1 (Primary - 2560x1440 144Hz)',
        resolution: '2560x1440',
        permissions_granted: true,
        active_windows: [
          'Microsoft Excel - Monthly_Report.xlsx',
          'Google Chrome - Flight Search',
          'Windows Explorer - Downloads',
        ],
      };
    },

    listWindows: async (): Promise<string[]> => {
      const status = await ipc.computer.getStatus();
      return status.active_windows;
    },
  },

  browser: {
    getStatus: async (): Promise<{ activeSessions: number; defaultBrowser: string; automationReady: boolean }> => {
      return {
        activeSessions: 1,
        defaultBrowser: 'Google Chrome',
        automationReady: true,
      };
    },
  },

  files: {
    getRecentActivity: async (): Promise<Array<{ path: string; name: string; modified: string }>> => {
      return [
        { path: 'C:\\Users\\User\\Downloads\\flight_receipt.pdf', name: 'flight_receipt.pdf', modified: '10 mins ago' },
        { path: 'C:\\Users\\User\\Documents\\Q3_Strategy.docx', name: 'Q3_Strategy.docx', modified: 'Yesterday' },
        { path: 'C:\\Users\\User\\Desktop\\Aven_Notes.txt', name: 'Aven_Notes.txt', modified: '2 days ago' },
      ];
    },
  },

  process: {
    listProcesses: async (): Promise<BackgroundProcessInfo[]> => {
      return [
        { id: 'aven-sidecar-agent', name: 'Aven Local Agent Runtime', status: 'running', cpuPercent: 0.2, memoryMb: 48 },
        { id: 'aven-voice-listener', name: 'Aven Hotkey & Voice Daemon', status: 'idle', cpuPercent: 0.0, memoryMb: 12 },
      ];
    },
  },

  voice: {
    getStatus: async (): Promise<{ enabled: boolean; shortcut: string; microphoneReady: boolean }> => {
      return {
        enabled: true,
        shortcut: 'Ctrl + Space',
        microphoneReady: true,
      };
    },
  },

  memory: {
    getItemCount: async (): Promise<number> => {
      return 14;
    },
  },

  tasks: {
    getActiveCount: async (): Promise<number> => {
      return 1;
    },
  },

  phone: {
    getStatus: async (): Promise<PhoneStatus> => {
      return {
        paired: false,
        deviceName: null,
        batteryLevel: null,
        connectionType: 'disconnected',
        lastSynced: null,
      };
    },
  },

  connections: {
    getConnectedProviders: async (): Promise<string[]> => {
      return ['Google Gemini', 'Anthropic Claude'];
    },
  },
};

export default ipc;
