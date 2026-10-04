import { invoke } from '@tauri-apps/api/core';

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
};

export const windowService = {
  minimize: async (): Promise<void> => {
    if (isTauri()) {
      try {
        await invoke('app_minimize');
      } catch (err) {
        console.warn('Native minimize failed, fallback:', err);
      }
    } else {
      console.log('[Browser Mode] Window minimize requested');
    }
  },

  toggleMaximize: async (): Promise<void> => {
    if (isTauri()) {
      try {
        await invoke('app_maximize');
      } catch (err) {
        console.warn('Native maximize failed, fallback:', err);
      }
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  },

  close: async (): Promise<void> => {
    if (isTauri()) {
      try {
        await invoke('app_close');
      } catch (err) {
        console.warn('Native close failed, fallback:', err);
      }
    } else {
      console.log('[Browser Mode] Window close requested');
    }
  },

  isMaximized: async (): Promise<boolean> => {
    if (isTauri()) {
      try {
        return await invoke<boolean>('app_is_maximized');
      } catch {
        return false;
      }
    }
    return !!document.fullscreenElement;
  },
};

export default windowService;
