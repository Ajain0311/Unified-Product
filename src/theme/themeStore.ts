import { Appearance } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface ThemePalette {
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceMuted: string;
  surfaceHover: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryMuted: string;
  secondary: string;
  secondaryMuted: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderSubtle: string;
  cardBg: string;
  card: string;
  cardBorder: string;
  headerBg: string;
  tabBarBg: string;
  inputBg: string;
  chipBg: string;
  chipActiveBg: string;
  chipActiveText: string;
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
  surfaceHover: '#F8FAFC',
  primary: '#FF5A1F',
  primaryLight: '#FF7A45',
  primaryDark: '#E04812',
  primaryMuted: '#FFF3EE',
  secondary: '#10B981',
  secondaryMuted: '#ECFDF5',
  accent: '#F59E0B',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  cardBg: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  headerBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  inputBg: '#F8FAFC',
  chipBg: '#F1F5F9',
  chipActiveBg: '#FF5A1F',
  chipActiveText: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#2563EB',
  statusBar: 'dark-content',
};

export const darkTheme: ThemePalette = {
  background: '#090D16',
  surface: '#111827',
  surfaceLight: '#1A2234',
  surfaceMuted: '#1E293B',
  surfaceHover: '#1E293B',
  primary: '#FF7A45',
  primaryLight: '#FFA07A',
  primaryDark: '#FF5A1F',
  primaryMuted: '#2A1810',
  secondary: '#34D399',
  secondaryMuted: '#062E1F',
  accent: '#FBBF24',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: '#1F293D',
  borderSubtle: '#162032',
  cardBg: '#111827',
  card: '#111827',
  cardBorder: '#1F293D',
  headerBg: '#090D16',
  tabBarBg: '#111827',
  inputBg: '#1A2234',
  chipBg: '#1A2234',
  chipActiveBg: '#FF7A45',
  chipActiveText: '#FFFFFF',
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
  theme: ThemePalette;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => Promise<void>;
}

const systemIsDark = Appearance.getColorScheme() === 'dark';
const initialMode: ThemeMode = systemIsDark ? 'dark' : 'light';
const initialPalette = systemIsDark ? darkTheme : lightTheme;

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  isDark: systemIsDark,
  colors: initialPalette,
  theme: initialPalette,

  setMode: (mode: ThemeMode) => {
    const chosenColors = mode === 'dark' ? darkTheme : lightTheme;
    // 1. Immediate synchronous UI state transition (0ms latency)
    set({
      mode,
      isDark: mode === 'dark',
      colors: chosenColors,
      theme: chosenColors,
    });
    // 2. Non-blocking asynchronous persistence in background
    AsyncStorage.setItem('superapp_theme_mode', mode).catch((err) => {
      console.warn('[ThemeStore] Failed to persist theme:', err);
    });
  },

  toggleTheme: () => {
    const next: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
    get().setMode(next);
  },

  initTheme: async () => {
    const saved = await AsyncStorage.getItem('superapp_theme_mode');
    if (saved === 'light' || saved === 'dark') {
      const chosenColors = saved === 'dark' ? darkTheme : lightTheme;
      set({
        mode: saved,
        isDark: saved === 'dark',
        colors: chosenColors,
        theme: chosenColors,
      });
    } else {
      const isSysDark = Appearance.getColorScheme() === 'dark';
      const chosenColors = isSysDark ? darkTheme : lightTheme;
      set({
        mode: isSysDark ? 'dark' : 'light',
        isDark: isSysDark,
        colors: chosenColors,
        theme: chosenColors,
      });
    }
  },
}));

Appearance.addChangeListener(({ colorScheme }) => {
  AsyncStorage.getItem('superapp_theme_mode').then((saved) => {
    if (!saved) {
      const isSysDark = colorScheme === 'dark';
      const chosenColors = isSysDark ? darkTheme : lightTheme;
      useThemeStore.setState({
        mode: isSysDark ? 'dark' : 'light',
        isDark: isSysDark,
        colors: chosenColors,
        theme: chosenColors,
      });
    }
  });
});

export function useAppTheme() {
  const { colors, theme, isDark, mode, toggleTheme, setMode } = useThemeStore();
  return { colors, theme, isDark, mode, toggleTheme, setMode };
}
