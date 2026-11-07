import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export type ModuleCategory =
  | 'Core'
  | 'Daily Living'
  | 'Mobility'
  | 'Commerce'
  | 'Hospitality'
  | 'Commercial'
  | 'Coming Soon';

export type ModuleStatus =
  | 'ready'
  | 'downloading'
  | 'available'
  | 'update_available'
  | 'failed'
  | 'disabled'
  | 'coming_soon';

export interface SuperAppModule {
  id: string;
  name: string;
  category: ModuleCategory;
  description: string;
  icon: string;
  route: string;
  isCore: boolean;
  isActive: boolean;
  estimatedSizeMb: number;
  status: ModuleStatus;
  isInstalled: boolean;
  downloadProgress: number; // 0 to 100
  lastUpdated?: string;
  cachedBytes: number;
}

export const INITIAL_MODULES: SuperAppModule[] = [
  // Layer A — Core
  {
    id: 'core',
    name: 'SuperApp Base Core',
    category: 'Core',
    description: 'Lightweight core runtime, authentication, notification engine, and global search.',
    icon: 'apps-outline',
    route: 'Home',
    isCore: true,
    isActive: true,
    estimatedSizeMb: 12.5,
    status: 'ready',
    isInstalled: true,
    downloadProgress: 100,
    cachedBytes: 12.5 * 1024 * 1024,
  },
  // Layer B — Business Modules
  {
    id: 'food',
    name: 'Food Delivery',
    category: 'Daily Living',
    description: 'Explore restaurants, cloud kitchens, and gourmet dining with live delivery tracking.',
    icon: 'restaurant-outline',
    route: 'Food',
    isCore: true,
    isActive: true,
    estimatedSizeMb: 3.2,
    status: 'ready',
    isInstalled: true,
    downloadProgress: 100,
    cachedBytes: 3.2 * 1024 * 1024,
  },
  {
    id: 'ride',
    name: 'Cabs & Rides',
    category: 'Mobility',
    description: 'On-demand city cabs, bike taxis, auto rickshaws, and outstation trips in Chittorgarh.',
    icon: 'car-outline',
    route: 'Rides',
    isCore: true,
    isActive: true,
    estimatedSizeMb: 2.8,
    status: 'ready',
    isInstalled: true,
    downloadProgress: 100,
    cachedBytes: 2.8 * 1024 * 1024,
  },
  {
    id: 'bazaar',
    name: 'City Bazaar',
    category: 'Commerce',
    description: 'Hyperlocal peer-to-peer marketplace for mobiles, electronics, vehicles, and lifestyle goods.',
    icon: 'storefront-outline',
    route: 'Bazaar',
    isCore: true,
    isActive: true,
    estimatedSizeMb: 2.4,
    status: 'ready',
    isInstalled: true,
    downloadProgress: 100,
    cachedBytes: 2.4 * 1024 * 1024,
  },
  {
    id: 'hotels',
    name: 'Hotels & Stays',
    category: 'Hospitality',
    description: 'Verified heritage palaces, luxury resorts, boutique villas, and budget rooms.',
    icon: 'business-outline',
    route: 'HotelHome',
    isCore: false,
    isActive: true,
    estimatedSizeMb: 4.5,
    status: 'ready',
    isInstalled: true,
    downloadProgress: 100,
    cachedBytes: 4.5 * 1024 * 1024,
  },
  {
    id: 'bars',
    name: 'Bars & Lounges',
    category: 'Hospitality',
    description: 'Curated nightlife, rooftop lounges, craft taprooms, and premium reservation desks.',
    icon: 'wine-outline',
    route: 'BarHub',
    isCore: false,
    isActive: true,
    estimatedSizeMb: 2.1,
    status: 'ready',
    isInstalled: true,
    downloadProgress: 100,
    cachedBytes: 2.1 * 1024 * 1024,
  },
  {
    id: 'beverages',
    name: 'Beverages & Cafe',
    category: 'Hospitality',
    description: 'Specialty roasters, artisan cafes, organic teas, and freshly squeezed cold beverages.',
    icon: 'cafe-outline',
    route: 'BeverageHub',
    isCore: false,
    isActive: true,
    estimatedSizeMb: 1.9,
    status: 'ready',
    isInstalled: true,
    downloadProgress: 100,
    cachedBytes: 1.9 * 1024 * 1024,
  },
  {
    id: 'supplies',
    name: 'B2B Water Supplies',
    category: 'Commercial',
    description: 'Commercial 20L purified water cans, hospitality supplies, and recurring corporate delivery.',
    icon: 'water-outline',
    route: 'B2BWaterSupplies',
    isCore: false,
    isActive: true,
    estimatedSizeMb: 1.6,
    status: 'ready',
    isInstalled: true,
    downloadProgress: 100,
    cachedBytes: 1.6 * 1024 * 1024,
  },
  // Future Ecosystem Modules
  {
    id: 'grocery',
    name: 'Quick Grocery',
    category: 'Coming Soon',
    description: 'Farm-fresh vegetables, dairy, pulses, and pantry essentials in 15 minutes.',
    icon: 'basket-outline',
    route: 'GrowWithSuperApp',
    isCore: false,
    isActive: false,
    estimatedSizeMb: 3.0,
    status: 'coming_soon',
    isInstalled: false,
    downloadProgress: 0,
    cachedBytes: 0,
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy & Wellness',
    category: 'Coming Soon',
    description: 'Prescription medicines, ayurvedic health, diagnostics, and baby care essentials.',
    icon: 'medkit-outline',
    route: 'GrowWithSuperApp',
    isCore: false,
    isActive: false,
    estimatedSizeMb: 2.6,
    status: 'coming_soon',
    isInstalled: false,
    downloadProgress: 0,
    cachedBytes: 0,
  },
  {
    id: 'home_services',
    name: 'Home & Appliance Repair',
    category: 'Coming Soon',
    description: 'Certified electricians, plumbers, carpenters, and appliance maintenance specialists.',
    icon: 'construct-outline',
    route: 'GrowWithSuperApp',
    isCore: false,
    isActive: false,
    estimatedSizeMb: 2.2,
    status: 'coming_soon',
    isInstalled: false,
    downloadProgress: 0,
    cachedBytes: 0,
  },
  {
    id: 'laundry',
    name: 'Clean Laundry & Dry Cleaning',
    category: 'Coming Soon',
    description: 'Doorstep fabric care, steam pressing, and premium dry cleaning services.',
    icon: 'shirt-outline',
    route: 'GrowWithSuperApp',
    isCore: false,
    isActive: false,
    estimatedSizeMb: 1.8,
    status: 'coming_soon',
    isInstalled: false,
    downloadProgress: 0,
    cachedBytes: 0,
  },
];

const STORAGE_KEY = '@superapp_module_cache_metadata';
const WIFI_ONLY_KEY = '@superapp_download_wifi_only';

class ModuleManager {
  private modules: Map<string, SuperAppModule> = new Map();
  private wifiOnly: boolean = false;

  constructor() {
    INITIAL_MODULES.forEach(m => this.modules.set(m.id, { ...m }));
    this.loadPersistedState();
  }

  private async loadPersistedState() {
    try {
      const [savedMeta, savedWifiOnly] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(WIFI_ONLY_KEY),
      ]);

      if (savedWifiOnly !== null) {
        this.wifiOnly = savedWifiOnly === 'true';
      }

      if (savedMeta) {
        const parsed = JSON.parse(savedMeta) as Record<string, Partial<SuperAppModule>>;
        Object.entries(parsed).forEach(([id, meta]) => {
          const mod = this.modules.get(id);
          if (mod) {
            Object.assign(mod, meta);
          }
        });
      }
    } catch {
      // Non-fatal fallback to initial state
    }
  }

  public getModules(): SuperAppModule[] {
    return Array.from(this.modules.values());
  }

  public getModule(id: string): SuperAppModule | undefined {
    return this.modules.get(id);
  }

  public isWifiOnly(): boolean {
    return this.wifiOnly;
  }

  public async setWifiOnly(enabled: boolean): Promise<void> {
    this.wifiOnly = enabled;
    await AsyncStorage.setItem(WIFI_ONLY_KEY, String(enabled));
  }

  public async checkNetworkAllowed(): Promise<{ allowed: boolean; reason?: string }> {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      return { allowed: false, reason: 'No internet connection detected' };
    }
    if (this.wifiOnly && net.type !== 'wifi') {
      return { allowed: false, reason: 'Wi-Fi Only is enabled. Connect to Wi-Fi to download resources.' };
    }
    return { allowed: true };
  }

  /**
   * Smart Background Resource Download (BGMI-style asset pack delivery).
   * 100% Google Play compliant: strictly non-executable JSON, images, and catalogue assets.
   */
  public async downloadModuleResources(
    moduleId: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    const mod = this.modules.get(moduleId);
    if (!mod) return false;

    const netCheck = await this.checkNetworkAllowed();
    if (!netCheck.allowed) {
      mod.status = 'failed';
      return false;
    }

    mod.status = 'downloading';
    mod.downloadProgress = 0;

    // Progressive non-blocking simulated asset pack hydration
    for (let p = 10; p <= 100; p += 15) {
      await new Promise(r => setTimeout(r, 60));
      mod.downloadProgress = Math.min(100, p);
      if (onProgress) onProgress(mod.downloadProgress);
    }

    mod.status = 'ready';
    mod.isInstalled = true;
    mod.cachedBytes = mod.estimatedSizeMb * 1024 * 1024;
    mod.lastUpdated = new Date().toISOString();

    await this.persistState();
    return true;
  }

  public async clearModuleCache(moduleId: string): Promise<void> {
    const mod = this.modules.get(moduleId);
    if (!mod || mod.isCore) return; // Core module runtime cannot be purged

    mod.cachedBytes = 0;
    mod.isInstalled = false;
    mod.status = 'available';
    mod.downloadProgress = 0;

    await this.persistState();
  }

  public async clearAllNonCoreCache(): Promise<void> {
    this.modules.forEach(m => {
      if (!m.isCore && m.status !== 'coming_soon') {
        m.cachedBytes = 0;
        m.isInstalled = false;
        m.status = 'available';
        m.downloadProgress = 0;
      }
    });
    await this.persistState();
  }

  public getStorageMetrics() {
    let totalCachedBytes = 0;
    let coreCachedBytes = 0;
    let businessCachedBytes = 0;

    this.modules.forEach(m => {
      totalCachedBytes += m.cachedBytes;
      if (m.isCore) {
        coreCachedBytes += m.cachedBytes;
      } else {
        businessCachedBytes += m.cachedBytes;
      }
    });

    return {
      totalMb: Number((totalCachedBytes / (1024 * 1024)).toFixed(1)),
      coreMb: Number((coreCachedBytes / (1024 * 1024)).toFixed(1)),
      businessMb: Number((businessCachedBytes / (1024 * 1024)).toFixed(1)),
    };
  }

  private async persistState() {
    try {
      const stateObj: Record<string, Partial<SuperAppModule>> = {};
      this.modules.forEach((mod, id) => {
        stateObj[id] = {
          status: mod.status,
          isInstalled: mod.isInstalled,
          cachedBytes: mod.cachedBytes,
          downloadProgress: mod.downloadProgress,
          lastUpdated: mod.lastUpdated,
        };
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
    } catch {
      // Best-effort persistence
    }
  }
}

export const moduleManager = new ModuleManager();
