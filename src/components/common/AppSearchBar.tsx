import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/themeStore';
import { AppRadius, AppShadows, AppSpacing } from '../../theme/spacing';

interface AppSearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmitEditing?: () => void;
  editable?: boolean;
  onPress?: () => void;
  testID?: string;
  style?: ViewStyle;
}

export const AppSearchBar: React.FC<AppSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search dishes, stays, rides & products...',
  onClear,
  onSubmitEditing,
  editable = true,
  onPress,
  testID,
  style,
}) => {
  const { theme, isDark } = useAppTheme();

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? theme.surfaceLight : '#FFFFFF',
          borderColor: theme.cardBorder,
        },
        AppShadows.subtle,
        style,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={19}
        color={theme.textTertiary}
        style={styles.icon}
      />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        style={[styles.input, { color: theme.textPrimary }]}
        editable={editable}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
      />
      {Boolean(value && value.length > 0) && (
        <TouchableOpacity
          onPress={() => {
            if (onChangeText) onChangeText('');
            if (onClear) onClear();
          }}
          style={styles.clearButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress && !editable) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: AppSpacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    height: '100%',
  },
  clearButton: {
    padding: 2,
    marginLeft: 4,
  },
});
