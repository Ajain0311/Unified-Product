import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useAlertStore } from '../../store/alertStore';
import { useAppTheme } from '../../theme/themeStore';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { shadowStyle } from '../../utils/platformStyles';

export const AppAlert: React.FC = () => {
  const { isVisible, config, hideAlert } = useAlertStore();
  const { theme, isDark } = useAppTheme();

  if (!config) return null;

  const { title, message, buttons, options } = config;

  const handleBackdropPress = () => {
    if (options?.cancelable) {
      options.onDismiss?.();
      hideAlert();
    }
  };

  const renderButtons = () => {
    const defaultButtons = [{ text: 'OK', onPress: () => {}, style: 'default' as const }];
    const activeButtons = buttons && buttons.length > 0 ? buttons : defaultButtons;

    return (
      <View style={styles.buttonContainer}>
        {activeButtons.map((button, index) => {
          const isDestructive = button.style === 'destructive';
          const isCancel = button.style === 'cancel';
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.button,
                { backgroundColor: theme.primary },
                isDestructive && { backgroundColor: theme.error },
                isCancel && { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
                activeButtons.length > 2 && styles.buttonStacked
              ]}
              onPress={() => {
                button.onPress?.();
                hideAlert();
              }}
            >
              <Text
                style={[
                  styles.buttonText,
                  isDestructive && styles.buttonTextDestructive,
                  isCancel && { color: theme.textSecondary }
                ]}
              >
                {button.text || 'OK'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.alertBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
              {!!message && <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>}
              {renderButtons()}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  alertBox: {
    borderRadius: spacing.radiusLg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    ...shadowStyle({
      color: '#000',
      offsetY: 4,
      opacity: 0.3,
      radius: 8,
      elevation: 8,
    }),
  },
  title: {
    ...typography.h3,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.radiusMd,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonStacked: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  buttonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
});
