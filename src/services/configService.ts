import { apiClient } from './apiClient';
import { ApiEndpoints } from '../constants/api';
import { AppEnvironment } from '../config/environment';

export interface PlatformModulePublicConfig {
  id: string;
  key: string;
  nameEn: string;
  nameHi: string;
  badgeEn?: string;
  badgeHi?: string;
  icon: string;
  route: string;
  category: string;
  isEnabled: boolean;
  sortOrder: number;
  rolesAllowed?: string[];
  layoutVariant?: string;
}

export interface PlatformThemeControlConfig {
  allowUserThemeSwitch: boolean;
  defaultTheme: 'light' | 'dark';
}

export interface PlatformLanguageControlConfig {
  allowUserLanguageSwitch: boolean;
  supportedLanguages: string[];
  defaultLanguage: string;
}

export interface PlatformPublicControls {
  modules: PlatformModulePublicConfig[];
  theme: PlatformThemeControlConfig;
  language: PlatformLanguageControlConfig;
  systemSettings: Record<string, string>;
}

export interface RemoteClientConfig {
  mapProvider: string;
  mapboxAccessToken: string;
  paymentProvider: string;
  paymentKeyId?: string;
  environment: string;
  showTestOtp: boolean;
  apiBaseUrl: string;
  signalRHubUrl: string;
  gpsMaxCachedAgeSeconds?: number;
  gpsMaxAccuracyMeters?: number;
  platformControls?: PlatformPublicControls;
}

let cachedRemoteConfig: RemoteClientConfig | null = null;
let fetchPromise: Promise<RemoteClientConfig | null> | null = null;

export const configService = {
  async fetchConfig(forceRefresh = false): Promise<RemoteClientConfig | null> {
    if (!forceRefresh && cachedRemoteConfig) {
      return cachedRemoteConfig;
    }

    if (!forceRefresh && fetchPromise) {
      return fetchPromise;
    }

    fetchPromise = (async () => {
      try {
        const response = await apiClient.get<any>(ApiEndpoints.common.config);
        const data = response.data || response;
        if (data && data.success && data.data) {
          cachedRemoteConfig = data.data as RemoteClientConfig;
          if (cachedRemoteConfig.mapboxAccessToken) {
            AppEnvironment.setRuntimeMapboxToken(cachedRemoteConfig.mapboxAccessToken);
          }
          return cachedRemoteConfig;
        } else if (data && data.mapboxAccessToken) {
          cachedRemoteConfig = data as RemoteClientConfig;
          if (cachedRemoteConfig.mapboxAccessToken) {
            AppEnvironment.setRuntimeMapboxToken(cachedRemoteConfig.mapboxAccessToken);
          }
          return cachedRemoteConfig;
        }
      } catch (err) {
        console.warn('[ConfigService] Could not fetch remote config, using environment defaults:', err);
      } finally {
        fetchPromise = null;
      }
      return cachedRemoteConfig;
    })();

    return fetchPromise;
  },

  getCachedConfig(): RemoteClientConfig | null {
    return cachedRemoteConfig;
  },

  getPlatformControls(): PlatformPublicControls | undefined {
    return cachedRemoteConfig?.platformControls;
  },

  getEnabledModules(): PlatformModulePublicConfig[] | undefined {
    return cachedRemoteConfig?.platformControls?.modules
      .filter((m) => m.isEnabled)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  isThemeSwitchAllowed(): boolean {
    return cachedRemoteConfig?.platformControls?.theme.allowUserThemeSwitch ?? true;
  },

  isLanguageSwitchAllowed(): boolean {
    return cachedRemoteConfig?.platformControls?.language.allowUserLanguageSwitch ?? true;
  },
};
