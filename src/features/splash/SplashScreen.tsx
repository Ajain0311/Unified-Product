import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/themeStore';
import { shadowStyle } from '../../utils/platformStyles';

interface SplashScreenProps {
  navigation: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const { theme } = useAppTheme();

  useEffect(() => {
    // Dismiss the native OS splash screen once the React Native splash view is mounted (guarded for backward compatibility)
    try {
      ExpoSplashScreen?.hideAsync?.().catch(() => {});
    } catch (_) {}

    let cancelled = false;
    // Guaranteed intro duration (1.2s) so branding is visible consistently across fast and slow devices
    const minimumIntro = new Promise((resolve) => setTimeout(resolve, 1200));

    Promise.all([checkAuth(), minimumIntro])
      .then(([isAuthenticated]) => {
        if (cancelled) return;
        if (isAuthenticated) {
          const roles = useAuthStore.getState().user?.roles ?? [];
          const isAdmin = roles.some((role) => role.toUpperCase() === 'ADMIN');
          navigation.replace(isAdmin ? 'AdminPortal' : 'MainTabs');
        } else {
          // Guest mode: route directly to MainTabs
          navigation.replace('MainTabs');
        }
      })
      .catch(() => {
        if (!cancelled) navigation.replace('MainTabs');
      });

    return () => {
      cancelled = true;
    };
  }, [navigation, checkAuth]);

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <View style={styles.content}>
        {/* Official RJ09 Sewa App Logo - instantly visible on mount */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.appName, { color: '#0F172A' }]}>RJ09 Sewa</Text>
        <Text style={[styles.tagline, { color: '#64748B' }]}>Everything in a Tap</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...shadowStyle({
      color: '#000000',
      offsetY: 6,
      opacity: 0.12,
      radius: 16,
      elevation: 6,
    }),
    marginBottom: 20,
    overflow: 'hidden',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
