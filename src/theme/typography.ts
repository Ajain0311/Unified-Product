import { TextStyle, StyleSheet } from 'react-native';
import { AppColors } from './colors';

export const AppTypography = StyleSheet.create({
  display: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.6,
    lineHeight: 34,
  } as TextStyle,
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 30,
  } as TextStyle,
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 26,
  } as TextStyle,
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 24,
  } as TextStyle,
  h4: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    lineHeight: 22,
  } as TextStyle,
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 24,
  } as TextStyle,
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: AppColors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  } as TextStyle,
  bodyLarge: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textPrimary,
    lineHeight: 22,
  } as TextStyle,
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    color: AppColors.textSecondary,
    lineHeight: 20,
  } as TextStyle,
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    color: AppColors.textTertiary,
    lineHeight: 16,
  } as TextStyle,
  bodySm: {
    fontSize: 12,
    fontWeight: '400',
    color: AppColors.textTertiary,
    lineHeight: 16,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textSecondary,
    lineHeight: 16,
  } as TextStyle,
  micro: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 14,
  } as TextStyle,
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textPrimary,
    lineHeight: 18,
  } as TextStyle,
  button: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  } as TextStyle,
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.primary,
    letterSpacing: -0.2,
  } as TextStyle,
  priceStrike: {
    fontSize: 12,
    fontWeight: '400',
    color: AppColors.textTertiary,
    textDecorationLine: 'line-through',
  } as TextStyle,
});

export const typography = AppTypography;
