import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'superapp_cached_system_settings';

export interface SystemSettingsState {
  maintenanceMode: boolean;
  allowGuestBrowsing: boolean;
  broadcastAnnouncement: string;
  version: number;
  applySystemSettings: (settings?: Record<string, string>) => void;
  loadCachedSettings: () => Promise<void>;
}

export const useSystemSettingsStore = create<SystemSettingsState>((set) => ({
  maintenanceMode: false,
  allowGuestBrowsing: true,
  broadcastAnnouncement: '',
  version: 0,

  applySystemSettings: (settings?: Record<string, string>) => {
    if (!settings) return;
    const maintenanceMode = settings['maintenance_mode'] === 'true';
    const allowGuestBrowsing = settings['allow_guest_browsing'] !== 'false';
    const broadcastAnnouncement = settings['broadcast_announcement'] || '';

    set((state) => ({
      maintenanceMode,
      allowGuestBrowsing,
      broadcastAnnouncement,
      version: state.version + 1,
    }));

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        maintenance_mode: maintenanceMode ? 'true' : 'false',
        allow_guest_browsing: allowGuestBrowsing ? 'true' : 'false',
        broadcast_announcement: broadcastAnnouncement,
      })
    ).catch(() => {});
  },

  loadCachedSettings: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          set((state) => ({
            maintenanceMode: parsed['maintenance_mode'] === 'true',
            allowGuestBrowsing: parsed['allow_guest_browsing'] !== 'false',
            broadcastAnnouncement: parsed['broadcast_announcement'] || '',
            version: state.version + 1,
          }));
        }
      }
    } catch {}
  },
}));
