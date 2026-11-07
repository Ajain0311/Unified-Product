import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { AppColors } from '../../theme/colors';
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';

interface AppButtonProps {
  text: string;
  onPressed?: () => void;
  isLoading?: boolean;
  isOutlined?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  backgroundColor?: string;
  textColor?: string;
  width?: number | string;
  height?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  text,
  onPressed,
  isLoading = false,
  isOutlined = false,
  variant,
  backgroundColor,
  textColor,
  width = '100%',
  height = 50,
  icon,
  disabled = false,
  style,
  textStyle,
  testID,
}) => {
  const isOutlineStyle = isOutlined || variant === 'outline';
  const isGhostStyle = variant === 'ghost';
  
  const bg = backgroundColor || (variant === 'secondary' ? AppColors.secondary : AppColors.primary);
  const tc = textColor || (isOutlineStyle ? bg : isGhostStyle ? bg : '#FFFFFF');

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      activeOpacity={0.84}
      disabled={disabled || isLoading}
      onPress={onPressed}
      style={[
        styles.base,
        {
          width: width as any,
          height,
          backgroundColor: isOutlineStyle || isGhostStyle ? 'transparent' : bg,
          borderColor: isGhostStyle ? 'transparent' : bg,
          borderWidth: isOutlineStyle ? 1.5 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        !isOutlineStyle && !isGhostStyle && !disabled && AppShadows.subtle,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={tc} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: tc }, textStyle]}>{text}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: AppRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: AppSpacing.sm,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
