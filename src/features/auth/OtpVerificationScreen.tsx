import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
  Animated,
  StatusBar,
  Keyboard,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppConstants } from '../../constants/app';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme, ThemePalette } from '../../theme/themeStore';
import { shadowStyle, USE_NATIVE_DRIVER } from '../../utils/platformStyles';
import { FormKeyboardAvoid } from '../../components/common/FormKeyboardAvoid';
import { AppRadius, AppShadows } from '../../theme/spacing';

interface OtpVerificationScreenProps {
  route: {
    params: {
      mobileNumber: string;
      isNewUser?: boolean;
      isAdmin?: boolean;
      devOtp?: string;
    };
  };
  navigation: any;
}

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  route,
  navigation,
}) => {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const {
    mobileNumber,
    isNewUser = false,
    isAdmin = false,
    devOtp: initialDevOtp,
  } = route.params;

  const { width: windowWidth } = useWindowDimensions();
  const showTestOtp = process.env.EXPO_PUBLIC_SHOW_TEST_OTP === 'true' || Boolean(initialDevOtp);
  const defaultTestOtp = process.env.EXPO_PUBLIC_TEST_OTP;
  const [displayedOtp, setDisplayedOtp] = useState<string | undefined>(
    initialDevOtp || (showTestOtp ? defaultTestOtp : undefined)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(AppConstants.otpTimeoutSeconds);

  const [otp, setOtp] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const isSubmittingRef = useRef(false);
  const [fullName, setFullName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const adminLogin = useAuthStore((state) => state.adminLogin);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const hiddenInputRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const otpSectionY = useRef(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const otpBoxSize = Math.min(50, Math.max(42, Math.floor((windowWidth - 88) / 6) - 4));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

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

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const handleOtpChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, AppConstants.otpLength);
    setOtp(clean);
    setErrorMessage(null);

    if (clean.length === AppConstants.otpLength && !isAdmin && !isResettingPassword) {
      if (!isSubmittingRef.current && !isLoading) {
        requestAnimationFrame(() => {
          triggerAutoVerify(clean);
        });
      }
    }
  };

  const triggerAutoVerify = async (otpCode: string) => {
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await verifyOtp(mobileNumber, otpCode, fullName.trim() || undefined);
      // Explicitly navigate into app on successful verification
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification code. Please check and try again.');
      setOtp('');
      focusOtpInput();
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerify = async () => {
    if (otp.length < AppConstants.otpLength) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }
    await triggerAutoVerify(otp);
  };

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      setErrorMessage('Please enter your admin password.');
      return;
    }
    if (otp.length < AppConstants.otpLength) {
      setErrorMessage('Please enter the 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await adminLogin(mobileNumber, otp, adminPassword);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Admin authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordInitiate = async () => {
    try {
      setIsLoading(true);
      await forgotPassword(mobileNumber);
      setIsResettingPassword(true);
      setTimerSeconds(AppConstants.otpTimeoutSeconds);
      Alert.alert('Reset Code Sent', 'A verification code has been dispatched to your mobile number.');
    } catch (err: any) {
      Alert.alert('Request Failed', err.message || 'Could not initiate password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (otp.length < AppConstants.otpLength) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await resetPassword(mobileNumber, otp, newPassword);
      Alert.alert('Success', 'Password has been reset successfully. Please login.');
      setIsResettingPassword(false);
      setOtp('');
      setAdminPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timerSeconds > 0) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await sendOtp(mobileNumber);
      setTimerSeconds(AppConstants.otpTimeoutSeconds);
      if (response.devOtp) {
        setDisplayedOtp(response.devOtp);
      }
      setOtp('');
      focusOtpInput();
    } catch (err: any) {
      Alert.alert('Resend Failed', err.message || 'Could not resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const focusOtpInput = () => {
    hiddenInputRef.current?.focus();
  };

  const handleAutoFill = (code?: string) => {
    if (code) {
      setOtp(code);
      setErrorMessage(null);
      if (!isAdmin && !isResettingPassword) {
        triggerAutoVerify(code);
      }
    }
  };

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (timerSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const fullOtpEntered = otp.length === AppConstants.otpLength;

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
        >
          {/* Back Action */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (isResettingPassword) setIsResettingPassword(false);
              else navigation.goBack();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Header info */}
            <View style={styles.headerBox}>
              <LinearGradient
                colors={['#FF5A1F', '#FF8A5C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerIcon}
              >
                <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
              </LinearGradient>

              <Text style={styles.title}>
                {isResettingPassword ? 'Reset Password' : isAdmin ? 'Admin Sign In' : 'Verify Code'}
              </Text>

              <Text style={styles.subtitle}>
                {isResettingPassword
                  ? 'Enter code and choose a new password.'
                  : 'Enter the 6-digit verification code sent to'}
              </Text>

              {!isResettingPassword && (
                <View style={styles.phoneRow}>
                  <Text style={styles.phoneHighlight}>+91 {mobileNumber}</Text>
                  <TouchableOpacity
                    style={styles.changeNumberBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pencil" size={12} color={theme.primary} />
                    <Text style={styles.changeNumberText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Dev Mode Banner (Non-prod) */}
            {displayedOtp && showTestOtp ? (
              <View style={styles.testOtpCard}>
                <View style={styles.testOtpHeader}>
                  <View style={styles.testOtpBadge}>
                    <Ionicons name="flask-outline" size={13} color="#0D9488" style={{ marginRight: 4 }} />
                    <Text style={styles.testOtpBadgeText}>DEV AUTO-FILL</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.autoFillBtn}
                    onPress={() => handleAutoFill(displayedOtp)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.autoFillBtnText}>Fill Code</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.testOtpCode}>{displayedOtp}</Text>
              </View>
            ) : null}

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={theme.error} style={{ marginRight: 8 }} />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            {/* Main Interactive Card */}
            <View
              style={styles.cardContainer}
              onLayout={(e) => {
                otpSectionY.current = e.nativeEvent.layout.y;
              }}
            >
              {/* Additional inputs for Admin or New User */}
              {isResettingPassword ? (
                <>
                  <View style={styles.inputCard}>
                    <Ionicons name="lock-closed-outline" size={18} color={theme.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="New Password"
                      placeholderTextColor={theme.textTertiary}
                      secureTextEntry
                      value={newPassword}
                      onChangeText={(val) => {
                        setErrorMessage(null);
                        setNewPassword(val);
                      }}
                    />
                  </View>
                  <View style={styles.inputCard}>
                    <Ionicons name="lock-closed-outline" size={18} color={theme.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Confirm New Password"
                      placeholderTextColor={theme.textTertiary}
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setErrorMessage(null);
                        setConfirmPassword(val);
                      }}
                    />
                  </View>
                </>
              ) : isAdmin ? (
                <>
                  <View style={styles.inputCard}>
                    <Ionicons
                      name="shield-outline"
                      size={18}
                      color={theme.textTertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Admin Password"
                      placeholderTextColor={theme.textTertiary}
                      secureTextEntry
                      value={adminPassword}
                      onChangeText={(val) => {
                        setErrorMessage(null);
                        setAdminPassword(val);
                      }}
                      autoFocus
                    />
                  </View>
                  <TouchableOpacity onPress={handleForgotPasswordInitiate} style={styles.forgotBtn}>
                    <Text style={styles.forgotBtnText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </>
              ) : isNewUser ? (
                <View style={styles.inputCard}>
                  <Ionicons name="person-outline" size={18} color={theme.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Your Full Name (optional)"
                    placeholderTextColor={theme.textTertiary}
                    value={fullName}
                    onChangeText={(val) => {
                      setErrorMessage(null);
                      setFullName(val);
                    }}
                  />
                </View>
              ) : null}

              <Text style={styles.otpLabel}>
                {isResettingPassword ? 'Enter 6-digit verification code' : 'Enter 6-digit code'}
              </Text>

              {/* Hidden Actual Input for accessibility & keyboard autofill */}
              <TextInput
                ref={hiddenInputRef}
                value={otp}
                onChangeText={handleOtpChange}
                maxLength={AppConstants.otpLength}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                importantForAutofill="yes"
                style={styles.hiddenInput}
                autoFocus={!isAdmin}
                onFocus={() => {
                  setIsFocused(true);
                  requestAnimationFrame(() => {
                    scrollRef.current?.scrollTo({
                      y: Math.max(0, otpSectionY.current - 16),
                      animated: true,
                    });
                  });
                }}
                onBlur={() => setIsFocused(false)}
                caretHidden
              />

              {/* Visual 6-Digit OTP Boxes */}
              <TouchableOpacity
                style={styles.otpRow}
                activeOpacity={1}
                onPress={focusOtpInput}
                accessibilityRole="button"
                accessibilityLabel="6-digit verification code input boxes"
              >
                {Array.from({ length: AppConstants.otpLength }).map((_, idx) => {
                  const digit = otp[idx] || '';
                  const isCurrent =
                    isFocused &&
                    (idx === otp.length ||
                      (idx === AppConstants.otpLength - 1 && otp.length === AppConstants.otpLength));
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.otpBox,
                        { width: otpBoxSize, height: otpBoxSize + 8 },
                        digit ? styles.otpBoxFilled : null,
                        isCurrent ? styles.otpBoxFocused : null,
                        errorMessage ? styles.otpBoxError : null,
                      ]}
                    >
                      <Text style={[styles.otpBoxText, digit ? styles.otpBoxTextFilled : null]}>
                        {digit}
                      </Text>
                      {isCurrent && !digit ? <View style={styles.cursorBar} /> : null}
                    </View>
                  );
                })}
              </TouchableOpacity>

              {/* Resend Action */}
              <View style={styles.resendContainer}>
                {timerSeconds > 0 ? (
                  <Text style={styles.timerText}>
                    Resend code in <Text style={styles.timerCountdown}>{formatTimer()}</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} activeOpacity={0.7} style={styles.resendBtn}>
                    <Ionicons name="refresh" size={14} color={theme.primary} />
                    <Text style={styles.resendAction}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.continueBtn,
                  (!fullOtpEntered || isLoading) && styles.continueBtnDisabled,
                ]}
                onPress={() =>
                  isResettingPassword
                    ? handleResetPasswordSubmit()
                    : isAdmin
                    ? handleAdminLogin()
                    : handleVerify()
                }
                disabled={!fullOtpEntered || isLoading}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={
                    fullOtpEntered && !isLoading
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
                          !fullOtpEntered && styles.continueBtnTextDisabled,
                        ]}
                      >
                        {isResettingPassword
                          ? 'Reset Password'
                          : isAdmin
                          ? 'Sign In as Admin'
                          : 'Verify & Continue'}
                      </Text>
                      <Ionicons
                        name="checkmark-done"
                        size={18}
                        color={fullOtpEntered ? '#FFFFFF' : theme.textTertiary}
                      />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {!keyboardOpen && (
              <Text style={styles.hintText}>
                Tip: If SMS permissions are enabled, the code will auto-populate automatically.
              </Text>
            )}
          </Animated.View>
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
      paddingTop: 12,
      paddingBottom: 40,
    },
    scrollContentKeyboard: {
      paddingBottom: 100,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: 20,
      ...AppShadows.subtle,
    },
    headerBox: {
      marginBottom: 22,
      alignItems: 'flex-start',
    },
    headerIcon: {
      width: 50,
      height: 50,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      ...shadowStyle({
        color: '#FF5A1F',
        offsetY: 6,
        opacity: 0.35,
        radius: 12,
        elevation: 6,
      }),
    },
    title: {
      fontSize: 26,
      fontWeight: '900',
      color: theme.textPrimary,
      letterSpacing: -0.4,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    phoneHighlight: {
      color: theme.primary,
      fontWeight: '800',
      fontSize: 16,
    },
    changeNumberBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(255, 90, 31, 0.15)' : '#FFF3EE',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: AppRadius.pill,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 90, 31, 0.3)' : '#FED7AA',
    },
    changeNumberText: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    testOtpCard: {
      backgroundColor: isDark ? 'rgba(13, 148, 136, 0.15)' : '#ECFDF5',
      borderColor: isDark ? 'rgba(13, 148, 136, 0.4)' : '#A7F3D0',
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
    },
    testOtpHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    testOtpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(13, 148, 136, 0.25)' : '#D1FAE5',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    testOtpBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#059669',
      letterSpacing: 0.5,
    },
    autoFillBtn: {
      backgroundColor: '#059669',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    autoFillBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    testOtpCode: {
      fontSize: 22,
      fontWeight: '900',
      color: '#059669',
      letterSpacing: 3,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5',
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 18,
    },
    errorBannerText: {
      flex: 1,
      color: theme.error,
      fontSize: 13,
      fontWeight: '600',
    },
    cardContainer: {
      backgroundColor: theme.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 20,
      ...AppShadows.md,
      marginBottom: 20,
    },
    inputCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 12,
      height: 48,
      marginBottom: 12,
    },
    inputIcon: {
      marginRight: 10,
    },
    textInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
      paddingVertical: 0,
    },
    forgotBtn: {
      alignSelf: 'flex-end',
      marginBottom: 14,
    },
    forgotBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
    otpLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
      marginBottom: 16,
      textAlign: 'center',
    },
    hiddenInput: {
      position: 'absolute',
      opacity: 0,
      width: 1,
      height: 1,
    },
    otpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    otpBox: {
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.cardBorder,
      backgroundColor: theme.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    otpBoxFocused: {
      borderColor: theme.primary,
      backgroundColor: isDark ? 'rgba(255, 90, 31, 0.08)' : '#FFFFFF',
      ...shadowStyle({
        color: '#FF5A1F',
        offsetY: 2,
        opacity: 0.2,
        radius: 6,
        elevation: 2,
      }),
    },
    otpBoxFilled: {
      borderColor: theme.textPrimary,
      backgroundColor: isDark ? theme.surfaceLight : '#FFFFFF',
    },
    otpBoxError: {
      borderColor: theme.error,
    },
    otpBoxText: {
      fontSize: 22,
      fontWeight: '900',
      color: theme.textPrimary,
    },
    otpBoxTextFilled: {
      color: theme.textPrimary,
    },
    cursorBar: {
      position: 'absolute',
      bottom: 10,
      width: 16,
      height: 2.5,
      borderRadius: 1,
      backgroundColor: theme.primary,
    },
    resendContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 22,
    },
    timerText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textTertiary,
    },
    timerCountdown: {
      fontWeight: '800',
      color: theme.primary,
    },
    resendBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    resendAction: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.primary,
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
      paddingVertical: 15,
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
    hintText: {
      fontSize: 12,
      color: theme.textTertiary,
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 16,
    },
  });
