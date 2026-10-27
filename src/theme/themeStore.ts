import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface ThemePalette {
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceMuted: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  cardBg: string;
  headerBg: string;
  tabBarBg: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  statusBar: 'light-content' | 'dark-content';
}

export const lightTheme: ThemePalette = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  surfaceMuted: '#E2E8F0',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#10B981',
  accent: '#F59E0B',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  cardBg: '#FFFFFF',
  headerBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  statusBar: 'dark-content',
};

export const darkTheme: ThemePalette = {
  background: '#0B0F19',
  surface: '#111827',
  surfaceLight: '#1F2937',
  surfaceMuted: '#1E293B',
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  primaryDark: '#6366F1',
  secondary: '#34D399',
  accent: '#FBBF24',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: '#1F2937',
  cardBg: '#111827',
  headerBg: '#0B0F19',
  tabBarBg: '#111827',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  statusBar: 'light-content',
};

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemePalette;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  isDark: true,
  colors: darkTheme,

  setMode: async (mode: ThemeMode) => {
    await AsyncStorage.setItem('superapp_theme_mode', mode);
    set({
      mode,
      isDark: mode === 'dark',
      colors: mode === 'dark' ? darkTheme : lightTheme,
    });
  },

  toggleTheme: async () => {
    const next: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
    await get().setMode(next);
  },

  initTheme: async () => {
    const saved = await AsyncStorage.getItem('superapp_theme_mode');
    if (saved === 'light' || saved === 'dark') {
      set({
        mode: saved,
        isDark: saved === 'dark',
        colors: saved === 'dark' ? darkTheme : lightTheme,
      });
    }
  },
}));

export function useAppTheme() {
  const { colors, isDark, mode, toggleTheme, setMode } = useThemeStore();
  return { colors, isDark, mode, toggleTheme, setMode };
}
