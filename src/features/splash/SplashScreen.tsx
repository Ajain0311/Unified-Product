import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { shadowStyle, USE_NATIVE_DRIVER } from '../../utils/platformStyles';

interface SplashScreenProps {
  navigation: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Smooth intro animation matching Flutter SingleTickerProviderStateMixin
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();

    // Verify authentication and route
    const timer = setTimeout(async () => {
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        const roles = useAuthStore.getState().user?.roles ?? [];
        const isAdmin = roles.some((role) => role.toUpperCase() === 'ADMIN');
        navigation.replace(isAdmin ? 'AdminPortal' : 'MainTabs');
      } else {
        // Guest mode: route directly to MainTabs so users can freely explore
        navigation.replace('MainTabs');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation, checkAuth, fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FF6B35', '#FF8A5C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoContainer}
        >
          <Ionicons name="sparkles" size={44} color="#FFFFFF" />
        </LinearGradient>

        <Text style={styles.appName}>Zupify</Text>
        <Text style={styles.tagline}>Everything in a Tap</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowStyle({
      color: '#FF6B35',
      offsetY: 6,
      opacity: 0.25,
      radius: 16,
      elevation: 6,
    }),
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
});
