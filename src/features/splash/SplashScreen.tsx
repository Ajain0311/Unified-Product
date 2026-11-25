import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/themeStore';
import { shadowStyle, USE_NATIVE_DRIVER } from '../../utils/platformStyles';

interface SplashScreenProps {
  navigation: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const { theme } = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Smooth intro animation matching native app icon
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();

    // Verify authentication immediately with maximum 1.5s intro
    let cancelled = false;
    const minimumIntro = new Promise((resolve) => setTimeout(resolve, 800));

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
  }, [navigation, checkAuth, fadeAnim, scaleAnim]);

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Official RJ09 Sewa App Logo */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.appName, { color: '#0F172A' }]}>RJ09 Sewa</Text>
        <Text style={[styles.tagline, { color: '#64748B' }]}>Everything in a Tap</Text>
      </Animated.View>
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
