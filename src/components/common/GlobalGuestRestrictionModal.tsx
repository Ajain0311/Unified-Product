import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSystemSettingsStore } from '../../store/systemSettingsStore';
import { useAuthStore } from '../../store/authStore';
import { useRoleStore } from '../../store/roleStore';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useAppTheme } from '../../theme/themeStore';
import { navigationRef } from '../../navigation/navigationRef';

export const GlobalGuestRestrictionModal: React.FC = () => {
  const allowGuestBrowsing = useSystemSettingsStore((s) => s.allowGuestBrowsing);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeRole = useRoleStore((s) => s.activeRole);
  const { language } = useLanguageStore();
  const { theme, isDark } = useAppTheme();
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);

  // If guest browsing is permitted, user is logged in, or is master admin, do not restrict
  if (allowGuestBrowsing || isAuthenticated || activeRole === 'MASTER_ADMIN') {
    return null;
  }

  const handleSignIn = () => {
    // Open in-place auth modal or navigate to PhoneEntry
    try {
      openAuthModal({
        title: language === 'hi' ? 'लॉगिन करें' : 'Sign In to Zupify',
        subtitle:
          language === 'hi'
            ? 'गेस्ट ब्राउज़िंग अक्षम है, कृपया जारी रखने के लिए लॉगिन करें।'
            : 'Guest browsing is disabled. Please verify your mobile number to continue.',
      });
    } catch {
      if (navigationRef.isReady()) {
        navigationRef.navigate('PhoneEntry' as any);
      }
    }
  };

  return (
    <Modal visible={true} transparent={true} animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            {/* Lock Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={36} color="#FF5A1F" />
            </View>

            {/* Header Text */}
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {language === 'hi' ? 'लॉगिन अनिवार्य है' : 'Sign In Required'}
            </Text>

            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {language === 'hi'
                ? 'प्रशासन द्वारा गेस्ट ब्राउज़िंग अस्थायी रूप से बंद है। ज़ुपिफाई का उपयोग करने के लिए कृपया अपने मोबाइल नंबर से लॉगिन करें।'
                : 'Guest browsing is currently disabled by platform administration. Please sign in with your phone number to access Zupify services.'}
            </Text>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.signInButtonText}>
                {language === 'hi' ? 'मोबाइल नंबर से साइन इन करें' : 'Sign In With Mobile Number'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 90, 31, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  signInButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF5A1F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF5A1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
