export const AppColors = {
  // Backgrounds - Modern Clean Light Palette
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  surfaceSecondary: '#E2E8F0',
  cardDark: '#FFFFFF',
  cardLight: '#FFFFFF',

  // Primary (Modern Vibrant Orange / Coral)
  primary: '#FF6B35',
  primaryLight: '#FF8A5C',
  primaryDark: '#E55A2B',

  // Secondary (Emerald Green)
  secondary: '#10B981',
  secondaryLight: '#34D399',
  secondaryDark: '#059669',

  // Accent Colors
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  purple: '#8B5CF6',
  red: '#EF4444',
  yellow: '#F59E0B',

  // Module Colors
  foodModule: '#10B981',
  rideModule: '#3B82F6',
  marketplaceModule: '#FF6B35',

  // Typography Colors - High Contrast Clean Light
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textHint: '#94A3B8',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // UI Elements
  divider: '#E2E8F0',
  border: '#E2E8F0',
  shimmerBase: '#E2E8F0',
  shimmerHighlight: '#F1F5F9',
  overlay: 'rgba(15, 23, 42, 0.45)',
  vegBadge: '#10B981',
  nonVegBadge: '#EF4444',
} as const;

export type AppColorKey = keyof typeof AppColors;

export const colors = AppColors;
