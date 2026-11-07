import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/themeStore';

interface LazyScreenProps {
  title?: string;
  children: React.ReactNode;
  delayMs?: number;
}

export const LazyScreen: React.FC<LazyScreenProps> = ({
  title = 'Loading Experience...',
  children,
  delayMs = 20,
}) => {
  const { theme } = useAppTheme();
  const [isReady, setIsReady] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs > 0) {
      const timer = setTimeout(() => setIsReady(true), delayMs);
      return () => clearTimeout(timer);
    }
  }, [delayMs]);

  if (!isReady) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={[styles.text, { color: theme.textSecondary }]}>{title}</Text>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
