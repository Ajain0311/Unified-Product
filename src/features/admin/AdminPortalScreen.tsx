import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/themeStore';
import { AdminNavigator } from './AdminNavigator';

interface AdminPortalScreenProps {
  navigation?: any;
}

export const AdminPortalScreen: React.FC<AdminPortalScreenProps> = () => {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <AdminNavigator />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
