import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { colors } from './src/theme/colors';
import { notificationService } from './src/services/notificationService';
import { AppEnvironment } from './src/config/environment';
import { mapboxService } from './src/services/mapboxService';
import { configService } from './src/services/configService';
import { polyfillAlert } from './src/utils/alertPolyfill';

polyfillAlert();
import { useAppUpdateChecker } from './src/hooks/useAppUpdateChecker';
import { useAppTheme, useThemeStore } from './src/theme/themeStore';
import { AppAlert } from './src/components/common/AppAlert';
import { GlobalAuthModal } from './src/components/auth/GlobalAuthModal';

import { apiClient } from './src/services/apiClient';
import { useAuthModalStore } from './src/store/authModalStore';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const { theme, isDark } = useAppTheme();
  useAppUpdateChecker();

  const navigationTheme = React.useMemo(() => {
    const baseNavTheme = isDark ? DarkTheme : DefaultTheme;
    return {
      ...baseNavTheme,
      dark: isDark,
      colors: {
        ...baseNavTheme.colors,
        primary: theme.primary,
        background: theme.background,
        card: theme.surface,
        text: theme.textPrimary,
        border: theme.border,
        notification: theme.primary,
      },
    };
  }, [theme, isDark]);
  useEffect(() => {
    useThemeStore.getState().initTheme();
    configService.fetchConfig().then(() => {
      if ((Platform.OS === 'ios' || Platform.OS === 'android') && AppEnvironment.hasMapboxToken) {
        try {
          const Mapbox = require('@rnmapbox/maps').default;
          Mapbox?.setAccessToken?.(mapboxService.getAccessToken());
        } catch (error) {
          console.warn('[Mapbox] Native maps unavailable in this runtime:', error);
        }
      }
    });

    // Wire up global 401 unauthorized interceptor to open in-place AuthOtpModal
    apiClient.registerUnauthorizedHandler(() => {
      if (!useAuthStore.getState().isAuthenticated) return;
      const modalState = useAuthModalStore.getState();
      if (modalState.isOpen) return;
      modalState.openAuthModal({
        title: 'Sign In to Continue',
        subtitle: 'Please verify your phone number to continue seamlessly without losing your progress.',
      });
    });

    // Native push only — web skips expo-notifications (unsupported token listeners).
    if (Platform.OS === 'web') {
      return;
    }

    notificationService.getExpoPushToken().then((token) => {
      if (token) {
        notificationService.registerDeviceTokenWithBackend(token);
      }
    });

    const removeReceived = notificationService.addNotificationReceivedListener((notification) => {
      console.log('[Notification Received Foreground]', notification.request.content.title);
    });

    const removeResponse = notificationService.addNotificationResponseReceivedListener((response) => {
      if (navigationRef.isReady()) {
        notificationService.handleNotificationResponse(response, navigationRef as any);
      }
    });

    return () => {
      removeReceived();
      removeResponse();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        theme={navigationTheme}
        linking={{ enabled: false, prefixes: [] }}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
      <AppAlert />
      <GlobalAuthModal />
    </SafeAreaProvider>
  );
}
