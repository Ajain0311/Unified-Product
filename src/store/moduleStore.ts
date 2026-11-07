import { create } from 'zustand';
import { moduleManager, SuperAppModule } from '../services/moduleManager';

interface ModuleState {
  modules: SuperAppModule[];
  wifiOnly: boolean;
  isDownloading: boolean;
  downloadingModuleId: string | null;
  downloadProgress: number;
  totalStorageMb: number;
  businessStorageMb: number;
  refreshModules: () => void;
  setWifiOnly: (enabled: boolean) => Promise<void>;
  downloadModule: (moduleId: string) => Promise<boolean>;
  clearModuleCache: (moduleId: string) => Promise<void>;
  clearAllCache: () => Promise<void>;
}

export const useModuleStore = create<ModuleState>((set, get) => ({
  modules: moduleManager.getModules(),
  wifiOnly: moduleManager.isWifiOnly(),
  isDownloading: false,
  downloadingModuleId: null,
  downloadProgress: 0,
  totalStorageMb: moduleManager.getStorageMetrics().totalMb,
  businessStorageMb: moduleManager.getStorageMetrics().businessMb,

  refreshModules: () => {
    const metrics = moduleManager.getStorageMetrics();
    set({
      modules: [...moduleManager.getModules()],
      totalStorageMb: metrics.totalMb,
      businessStorageMb: metrics.businessMb,
    });
  },

  setWifiOnly: async (enabled: boolean) => {
    await moduleManager.setWifiOnly(enabled);
    set({ wifiOnly: enabled });
  },

  downloadModule: async (moduleId: string) => {
    set({ isDownloading: true, downloadingModuleId: moduleId, downloadProgress: 0 });
    const success = await moduleManager.downloadModuleResources(moduleId, (progress) => {
      set({ downloadProgress: progress });
    });
    const metrics = moduleManager.getStorageMetrics();
    set({
      isDownloading: false,
      downloadingModuleId: null,
      downloadProgress: 0,
      modules: [...moduleManager.getModules()],
      totalStorageMb: metrics.totalMb,
      businessStorageMb: metrics.businessMb,
    });
    return success;
  },

  clearModuleCache: async (moduleId: string) => {
    await moduleManager.clearModuleCache(moduleId);
    const metrics = moduleManager.getStorageMetrics();
    set({
      modules: [...moduleManager.getModules()],
      totalStorageMb: metrics.totalMb,
      businessStorageMb: metrics.businessMb,
    });
  },

  clearAllCache: async () => {
    await moduleManager.clearAllNonCoreCache();
    const metrics = moduleManager.getStorageMetrics();
    set({
      modules: [...moduleManager.getModules()],
      totalStorageMb: metrics.totalMb,
      businessStorageMb: metrics.businessMb,
    });
  },
}));
