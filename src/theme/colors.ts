export const AppColors = {
  // Backgrounds - Modern Clean Light Palette
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  surfaceSecondary: '#E2E8F0',
  surfaceMuted: '#E2E8F0',
  card: '#FFFFFF',
  cardLight: '#FFFFFF',
  cardDark: '#FFFFFF',
  cardSubtle: '#F8FAFC',

  // Primary (Modern Warm Sunset Coral / Orange)
  primary: '#FF5A1F',
  primaryLight: '#FF7A45',
  primaryDark: '#E04812',
  primaryMuted: '#FFF3EE',

  // Secondary (Emerald Green)
  secondary: '#10B981',
  secondaryLight: '#34D399',
  secondaryDark: '#059669',
  secondaryMuted: '#ECFDF5',

  // Accent Colors
  blue: '#2563EB',
  blueLight: '#60A5FA',
  blueMuted: '#EFF6FF',
  purple: '#7C3AED',
  purpleLight: '#A78BFA',
  purpleMuted: '#F5F3FF',
  red: '#EF4444',
  redLight: '#F87171',
  redMuted: '#FEF2F2',
  yellow: '#F59E0B',
  yellowLight: '#FCD34D',
  yellowMuted: '#FFFBEB',
  gold: '#D97706',
  cyan: '#0891B2',
  cyanMuted: '#ECFEFF',

  // Module Theming Accents
  foodModule: '#FF5A1F',
  rideModule: '#2563EB',
  marketplaceModule: '#D97706',
  hotelModule: '#047857',
  barModule: '#7C3AED',
  beverageModule: '#0891B2',
  suppliesModule: '#0284C7',

  // Typography Colors - High Contrast Clean Light
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textHint: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#2563EB',

  // UI Elements
  divider: '#E2E8F0',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderFocus: '#FF5A1F',
  inputBg: '#F8FAFC',
  chipBg: '#F1F5F9',
  shimmerBase: '#E2E8F0',
  shimmerHighlight: '#F8FAFC',
  overlay: 'rgba(15, 23, 42, 0.48)',
  glassBackground: 'rgba(255, 255, 255, 0.88)',
  glassBorder: 'rgba(255, 255, 255, 0.4)',
  vegBadge: '#10B981',
  nonVegBadge: '#EF4444',
} as const;

export type AppColorKey = keyof typeof AppColors;

export const colors = AppColors;
