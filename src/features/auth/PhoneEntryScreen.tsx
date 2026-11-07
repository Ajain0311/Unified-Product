import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Keyboard,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme, ThemePalette } from '../../theme/themeStore';
import { shadowStyle } from '../../utils/platformStyles';
import { FormKeyboardAvoid } from '../../components/common/FormKeyboardAvoid';
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';
import { CHITTORGARH_SERVICE_REGION } from '../../config/serviceRegion';

interface PhoneEntryScreenProps {
  navigation: any;
}

export const PhoneEntryScreen: React.FC<PhoneEntryScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const scrollRef = useRef<ScrollView>(null);
  const inputCardY = useRef(0);

  const cleanNumber = phoneNumber.trim().replace(/\D/g, '');
  const isValidLength = cleanNumber.length === 10;

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollInputIntoView = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, inputCardY.current - 24),
        animated: true,
      });
    });
  };

  const handleContinue = async () => {
    if (!cleanNumber) {
      Alert.alert('Phone Number Required', 'Please enter your 10-digit mobile number to proceed.');
      return;
    }

    if (cleanNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a complete 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await sendOtp(cleanNumber);
      navigation.navigate('OtpVerification', {
        mobileNumber: cleanNumber,
        isNewUser: response.isNewUser ?? false,
        isAdmin: response.isAdmin ?? false,
        devOtp: response.devOtp,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <FormKeyboardAvoid offset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardOpen && styles.scrollContentKeyboard,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="always"
        >
          {/* Brand Header */}
          <View style={[styles.brandHeader, keyboardOpen && styles.brandHeaderCompact]}>
            <LinearGradient
              colors={['#FF5A1F', '#FF8A5C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.logoBadge, keyboardOpen && styles.logoBadgeCompact]}
            >
              <Ionicons name="sparkles" size={keyboardOpen ? 22 : 30} color="#FFFFFF" />
            </LinearGradient>

            {!keyboardOpen && (
              <View style={styles.regionBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.regionBadgeText}>
                  {CHITTORGARH_SERVICE_REGION.displayName.toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={[styles.heroTitle, keyboardOpen && styles.heroTitleCompact]}>
              Zupify
            </Text>
            {!keyboardOpen && (
              <Text style={styles.heroSubtitle}>
                The Complete Super App • Food, Rides, Bazaar & Stays
              </Text>
            )}
          </View>

          {/* Module Discovery Feature Chips */}
          {!keyboardOpen && (
            <View style={styles.featureRow}>
              <View style={styles.featureChip}>
                <Ionicons name="fast-food" size={13} color="#FF5A1F" style={{ marginRight: 6 }} />
                <Text style={styles.featureChipText}>Food</Text>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="car-sport" size={13} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={styles.featureChipText}>Rides</Text>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="bag-handle" size={13} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.featureChipText}>Bazaar</Text>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="bed" size={13} color="#047857" style={{ marginRight: 6 }} />
                <Text style={styles.featureChipText}>Hotels</Text>
              </View>
            </View>
          )}

          {/* Phone Entry Card */}
          <View
            style={styles.cardContainer}
            onLayout={(e) => {
              inputCardY.current = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.cardTitle}>Login or Sign Up</Text>
            <Text style={styles.cardSubtitle}>
              Enter your mobile number — we will send an OTP to verify
            </Text>

            <View
              style={[
                styles.phoneInputCard,
                isFocused && styles.phoneInputCardFocused,
                isValidLength && styles.phoneInputCardValid,
              ]}
            >
              <View style={styles.countryCodePill}>
                <Text style={styles.flagIcon}>🇮🇳</Text>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <View style={styles.inputDivider} />
              <TextInput
                style={styles.phoneNumberInput}
                placeholder="10-digit mobile number"
                placeholderTextColor={theme.textTertiary}
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={(t) => setPhoneNumber(t.replace(/\D/g, ''))}
                onFocus={() => {
                  setIsFocused(true);
                  scrollInputIntoView();
                }}
                onBlur={() => setIsFocused(false)}
                returnKeyType="done"
                blurOnSubmit
              />
              {phoneNumber.length > 0 ? (
                isValidLength ? (
                  <View style={styles.verifiedIconBox}>
                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setPhoneNumber('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
                  </TouchableOpacity>
                )
              ) : null}
            </View>

            <View style={styles.helperRow}>
              <Text style={[styles.helperText, isValidLength && styles.helperTextReady]}>
                {isValidLength
                  ? 'Ready to send code'
                  : cleanNumber.length > 0
                  ? `${cleanNumber.length}/10 digits entered`
                  : 'Enter your 10-digit mobile number'}
              </Text>
              <View style={styles.securityBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#10B981" />
                <Text style={styles.securityBadgeText}>Verified & Secure</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.continueBtn,
                (!isValidLength || isLoading) && styles.continueBtnDisabled,
              ]}
              onPress={handleContinue}
              disabled={isLoading || !isValidLength}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={
                  isValidLength && !isLoading
                    ? ['#FF5A1F', '#FF7A45']
                    : isDark
                    ? ['#1F293D', '#162032']
                    : ['#E2E8F0', '#CBD5E1']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueBtnGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.btnContentRow}>
                    <Text
                      style={[
                        styles.continueBtnText,
                        !isValidLength && styles.continueBtnTextDisabled,
                      ]}
                    >
                      Continue with OTP
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={isValidLength ? '#FFFFFF' : theme.textTertiary}
                    />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.replace('MainTabs');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.guestButtonText}>Browse as Guest</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Trust Highlights & Legal */}
          {!keyboardOpen && (
            <>
              <View style={styles.trustGrid}>
                <View style={styles.trustItem}>
                  <Ionicons name="flash-outline" size={16} color={theme.primary} />
                  <Text style={styles.trustText}>Instant SMS OTP</Text>
                </View>
                <View style={styles.trustDot} />
                <View style={styles.trustItem}>
                  <Ionicons name="lock-closed-outline" size={16} color="#10B981" />
                  <Text style={styles.trustText}>256-bit Secure</Text>
                </View>
                <View style={styles.trustDot} />
                <View style={styles.trustItem}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#2563EB" />
                  <Text style={styles.trustText}>Zero Spam</Text>
                </View>
              </View>

              <Text style={styles.termsText}>
                By signing in, you agree to our{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() =>
                    Linking.openURL('https://superapp-website-ashen.vercel.app/terms-and-conditions')
                  }
                >
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() =>
                    Linking.openURL('https://superapp-website-ashen.vercel.app/privacy-policy')
                  }
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </>
          )}
        </ScrollView>
      </FormKeyboardAvoid>
    </SafeAreaView>
  );
};

const createStyles = (theme: ThemePalette, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContentKeyboard: {
      justifyContent: 'flex-start',
      paddingTop: 12,
      paddingBottom: 100,
    },
    brandHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    brandHeaderCompact: {
      marginBottom: 12,
    },
    logoBadge: {
      width: 64,
      height: 64,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadowStyle({
        color: '#FF5A1F',
        offsetY: 8,
        opacity: 0.35,
        radius: 16,
        elevation: 8,
      }),
      marginBottom: 14,
    },
    logoBadgeCompact: {
      width: 44,
      height: 44,
      borderRadius: 14,
      marginBottom: 8,
    },
    regionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 90, 31, 0.15)' : '#FFF3EE',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: AppRadius.pill,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 90, 31, 0.3)' : '#FED7AA',
      marginBottom: 10,
    },
    pulseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FF5A1F',
      marginRight: 6,
    },
    regionBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#FF5A1F',
      letterSpacing: 0.6,
    },
    heroTitle: {
      fontSize: 30,
      fontWeight: '900',
      color: theme.textPrimary,
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    heroTitleCompact: {
      fontSize: 22,
    },
    heroSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 4,
      maxWidth: 320,
      lineHeight: 18,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 24,
    },
    featureChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: AppRadius.pill,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...AppShadows.subtle,
    },
    featureChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    cardContainer: {
      width: '100%',
      backgroundColor: theme.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 22,
      ...AppShadows.md,
      marginBottom: 20,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    cardSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 4,
      marginBottom: 18,
      lineHeight: 18,
    },
    phoneInputCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.cardBorder,
      paddingHorizontal: 12,
      height: 56,
      marginBottom: 10,
    },
    phoneInputCardFocused: {
      borderColor: theme.primary,
      backgroundColor: isDark ? 'rgba(255, 90, 31, 0.08)' : '#FFFFFF',
    },
    phoneInputCardValid: {
      borderColor: '#10B981',
    },
    countryCodePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 4,
    },
    flagIcon: {
      fontSize: 18,
    },
    countryCodeText: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    inputDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.cardBorder,
      marginHorizontal: 10,
    },
    phoneNumberInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      paddingVertical: 0,
    },
    verifiedIconBox: {
      marginLeft: 6,
    },
    helperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingHorizontal: 2,
    },
    helperText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textTertiary,
    },
    helperTextReady: {
      color: '#10B981',
      fontWeight: '700',
    },
    securityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    securityBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#10B981',
    },
    continueBtn: {
      borderRadius: 16,
      overflow: 'hidden',
      ...shadowStyle({
        color: '#FF5A1F',
        offsetY: 6,
        opacity: 0.35,
        radius: 12,
        elevation: 6,
      }),
    },
    continueBtnDisabled: {
      elevation: 0,
      opacity: 0.7,
    },
    continueBtnGradient: {
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    continueBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
    continueBtnTextDisabled: {
      color: isDark ? '#64748B' : '#94A3B8',
    },
    guestButton: {
      marginTop: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    guestButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    trustGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 16,
    },
    trustItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    trustDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.textTertiary,
      opacity: 0.4,
    },
    trustText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    termsText: {
      fontSize: 12,
      color: theme.textTertiary,
      textAlign: 'center',
      maxWidth: 320,
      lineHeight: 18,
    },
    termsLink: {
      color: theme.primary,
      fontWeight: '700',
    },
  });
