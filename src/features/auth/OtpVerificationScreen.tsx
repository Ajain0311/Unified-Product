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
import { masterAdminService, MasterAdminTotpSetupResponse } from '../../services/masterAdminService';
import { useRoleStore } from '../../store/roleStore';
import { storage } from '../../services/storage';

interface OtpVerificationScreenProps {
  route: {
    params: {
      mobileNumber: string;
      isNewUser?: boolean;
      isAdmin?: boolean;
      isMasterAdmin?: boolean;
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
    isMasterAdmin = false,
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

  // Master Admin State
  const [showPassword, setShowPassword] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  // Master Admin MFA First-Time Enrollment State
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<MasterAdminTotpSetupResponse | null>(null);
  const [enrollmentToken, setEnrollmentToken] = useState<string | null>(null);
  const [enrollmentConfirmCode, setEnrollmentConfirmCode] = useState('');
  const [isConfirmingMfa, setIsConfirmingMfa] = useState(false);

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

    if (clean.length === AppConstants.otpLength && !isAdmin && !isResettingPassword && !isMasterAdmin) {
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
      // adminLogin signature: (mobileNumber, password, otpCode)
      await adminLogin(mobileNumber, adminPassword, otp);
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

  const handleMasterAdminLogin = async () => {
    if (!adminPassword.trim()) {
      setErrorMessage('Please enter your Master Admin password.');
      return;
    }
    if (useRecoveryCode && !recoveryCode.trim()) {
      setErrorMessage('Please enter your emergency recovery code.');
      return;
    }
    if (!useRecoveryCode && otp.length < AppConstants.otpLength) {
      setErrorMessage('Please enter the 6-digit Authenticator code (TOTP).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await masterAdminService.login({
        usernameOrEmail: mobileNumber,
        password: adminPassword,
        totpCode: !useRecoveryCode && otp.trim() ? otp.trim() : undefined,
        recoveryCode: useRecoveryCode && recoveryCode.trim() ? recoveryCode.trim() : undefined,
      });

      if (response.requiresMfaEnrollment && response.tempEnrollmentToken) {
        setEnrollmentToken(response.tempEnrollmentToken);
        const setup = await masterAdminService.setupTotp(response.tempEnrollmentToken);
        setEnrollmentData(setup);
        setIsEnrolling(true);
        return;
      }

      if (response.success && response.token) {
        await storage.setToken(response.token);
        await storage.setMasterAdminMfaVerified(true);
        const userData = {
          id: response.user?.id ? Number(response.user.id) : 1,
          mobileNumber: response.user?.mobileNumber || mobileNumber,
          fullName: response.user?.fullName || 'Master Administrator',
          roles: response.user?.roles || ['MASTER_ADMIN', 'ADMIN', 'CUSTOMER'],
        };
        await storage.setUserData(userData);
        useAuthStore.setState({
          user: userData,
          token: response.token,
          isAuthenticated: true,
          error: null,
          isFallbackSession: false,
        });
        await useRoleStore.getState().syncWithUserRoles(userData.roles);
        await useRoleStore.getState().switchRole('MASTER_ADMIN');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MasterAdminControlPanel' }],
        });
      } else {
        setErrorMessage(response.message || 'Invalid Master Admin credentials or Authenticator code.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Master Admin authentication failed.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEnrollment = async () => {
    if (!enrollmentConfirmCode.trim() || enrollmentConfirmCode.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code displayed in your Authenticator app.');
      return;
    }

    setIsConfirmingMfa(true);
    try {
      const candidateSecret = enrollmentData?.secretKey || enrollmentData?.manualEntryKey || '';
      const res = await masterAdminService.confirmTotp(
        enrollmentConfirmCode.trim(),
        candidateSecret,
        enrollmentToken || undefined
      );

      if (res.success && res.token) {
        await storage.setToken(res.token);
        await storage.setMasterAdminMfaVerified(true);
        const userData = {
          id: 1,
          mobileNumber,
          fullName: 'Master Administrator',
          roles: ['MASTER_ADMIN', 'ADMIN', 'CUSTOMER'],
        };
        await storage.setUserData(userData);
        useAuthStore.setState({
          user: userData,
          token: res.token,
          isAuthenticated: true,
          error: null,
          isFallbackSession: false,
        });
        await useRoleStore.getState().syncWithUserRoles(userData.roles);
        await useRoleStore.getState().switchRole('MASTER_ADMIN');
        setIsEnrolling(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'MasterAdminControlPanel' }],
        });
      } else {
        Alert.alert('Enrollment Failed', res.message || 'Incorrect confirmation code.');
      }
    } catch (err: any) {
      Alert.alert('Enrollment Error', err.response?.data?.message || err.message || 'Failed to verify TOTP code.');
    } finally {
      setIsConfirmingMfa(false);
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

  const isContinueDisabled = useMemo(() => {
    if (isLoading) return true;
    if (isMasterAdmin) {
      if (!adminPassword.trim()) return true;
      if (useRecoveryCode) return !recoveryCode.trim();
      return otp.length !== AppConstants.otpLength;
    }
    if (isAdmin) {
      return !adminPassword.trim() || otp.length !== AppConstants.otpLength;
    }
    if (isResettingPassword) {
      return !newPassword || !confirmPassword || otp.length !== AppConstants.otpLength;
    }
    return otp.length !== AppConstants.otpLength;
  }, [
    isLoading,
    isMasterAdmin,
    adminPassword,
    useRecoveryCode,
    recoveryCode,
    otp,
    isAdmin,
    isResettingPassword,
    newPassword,
    confirmPassword,
  ]);

  const continueButtonText = useMemo(() => {
    if (isResettingPassword) return 'Reset Password';
    if (isMasterAdmin) return 'Sign In as Master Admin';
    if (isAdmin) return 'Sign In as Admin';
    return 'Verify & Continue';
  }, [isResettingPassword, isMasterAdmin, isAdmin]);

  const handlePressContinue = () => {
    if (isResettingPassword) {
      handleResetPasswordSubmit();
    } else if (isMasterAdmin) {
      handleMasterAdminLogin();
    } else if (isAdmin) {
      handleAdminLogin();
    } else {
      handleVerify();
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
        >
          {/* Back Action */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (isEnrolling) setIsEnrolling(false);
              else if (isResettingPassword) setIsResettingPassword(false);
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
                colors={
                  isMasterAdmin
                    ? ['#D97706', '#F59E0B']
                    : ['#FF5A1F', '#FF8A5C']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerIcon}
              >
                <Ionicons
                  name={isMasterAdmin ? 'key' : 'shield-checkmark'}
                  size={24}
                  color="#FFFFFF"
                />
              </LinearGradient>

              <Text style={styles.title}>
                {isResettingPassword
                  ? 'Reset Password'
                  : isMasterAdmin
                  ? 'Master Admin Sign In'
                  : isAdmin
                  ? 'Admin Sign In'
                  : 'Verify Code'}
              </Text>

              <Text style={styles.subtitle}>
                {isResettingPassword
                  ? 'Enter code and choose a new password.'
                  : isMasterAdmin
                  ? 'Enter Master Password & Authenticator (TOTP) code for'
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
            {displayedOtp && showTestOtp && !isMasterAdmin ? (
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
              {isEnrolling ? (
                /* First-Time MFA Enrollment Flow for Master Admin */
                <View style={styles.enrollmentContainer}>
                  <View style={styles.enrollmentNotice}>
                    <Ionicons name="qr-code-outline" size={20} color="#D97706" />
                    <Text style={styles.enrollmentNoticeText}>
                      First-Time Setup: Enter this Key into Google Authenticator or Microsoft Authenticator, then verify below.
                    </Text>
                  </View>

                  <Text style={styles.enrollmentFieldLabel}>Manual Secret Key (Base32)</Text>
                  <View style={styles.secretKeyBox}>
                    <Text style={styles.secretKeyText} selectable>
                      {enrollmentData?.manualEntryKey || enrollmentData?.secretKey}
                    </Text>
                  </View>

                  {enrollmentData?.recoveryCodes && enrollmentData.recoveryCodes.length > 0 && (
                    <>
                      <Text style={[styles.enrollmentFieldLabel, { marginTop: 12 }]}>
                        Emergency Recovery Codes (Save These!)
                      </Text>
                      <View style={styles.recoveryGrid}>
                        {enrollmentData.recoveryCodes.map((code, idx) => (
                          <View key={idx} style={styles.recoveryPill}>
                            <Text style={styles.recoveryPillText} selectable>
                              {code}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  <Text style={[styles.enrollmentFieldLabel, { marginTop: 14 }]}>
                    Enter 6-Digit Code from Authenticator
                  </Text>
                  <View style={styles.inputCard}>
                    <Ionicons name="keypad-outline" size={18} color="#D97706" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { letterSpacing: 4, fontWeight: '700', fontSize: 18 }]}
                      placeholder="000000"
                      placeholderTextColor={theme.textTertiary}
                      value={enrollmentConfirmCode}
                      onChangeText={(val) => setEnrollmentConfirmCode(val.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.continueBtn,
                      (enrollmentConfirmCode.length !== 6 || isConfirmingMfa) && styles.continueBtnDisabled,
                      { marginTop: 16 },
                    ]}
                    onPress={handleConfirmEnrollment}
                    disabled={enrollmentConfirmCode.length !== 6 || isConfirmingMfa}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={
                        enrollmentConfirmCode.length === 6 && !isConfirmingMfa
                          ? ['#D97706', '#F59E0B']
                          : isDark
                          ? ['#1F293D', '#162032']
                          : ['#E2E8F0', '#CBD5E1']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.continueBtnGradient}
                    >
                      {isConfirmingMfa ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <View style={styles.btnContentRow}>
                          <Text style={styles.continueBtnText}>Confirm & Open Control Panel</Text>
                          <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ alignSelf: 'center', marginTop: 12, paddingVertical: 8 }}
                    onPress={() => setIsEnrolling(false)}
                  >
                    <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '600' }}>
                      Cancel and return to Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Regular Sign-In Card */
                <>
                  {/* Additional inputs for Password / Reset / Name */}
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
                  ) : isMasterAdmin ? (
                    <View style={{ marginBottom: 14 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 6 }]}>
                        Master Admin Password
                      </Text>
                      <View style={styles.inputCard}>
                        <Ionicons
                          name="lock-closed"
                          size={18}
                          color="#D97706"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.textInput, { flex: 1 }]}
                          placeholder="Enter Master Password"
                          placeholderTextColor={theme.textTertiary}
                          secureTextEntry={!showPassword}
                          value={adminPassword}
                          onChangeText={(val) => {
                            setErrorMessage(null);
                            setAdminPassword(val);
                          }}
                          autoFocus
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword((prev) => !prev)}
                          style={styles.eyeBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={theme.textTertiary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
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

                  {/* Code Label & Header */}
                  <View style={styles.codeHeaderRow}>
                    <Text style={styles.otpLabel}>
                      {isResettingPassword
                        ? 'Enter 6-digit verification code'
                        : isMasterAdmin
                        ? useRecoveryCode
                          ? 'Emergency Recovery Code'
                          : 'Authenticator 6-Digit Code (TOTP)'
                        : 'Enter 6-digit code'}
                    </Text>
                    {isMasterAdmin && !useRecoveryCode && (
                      <View style={styles.totpBadge}>
                        <Ionicons name="shield-checkmark" size={11} color="#D97706" style={{ marginRight: 3 }} />
                        <Text style={styles.totpBadgeText}>APP TOTP</Text>
                      </View>
                    )}
                  </View>

                  {isMasterAdmin && useRecoveryCode ? (
                    <View style={styles.inputCard}>
                      <Ionicons name="warning-outline" size={18} color="#EF4444" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 1a2b-3c4d (8-digit code)"
                        placeholderTextColor={theme.textTertiary}
                        value={recoveryCode}
                        onChangeText={(val) => {
                          setErrorMessage(null);
                          setRecoveryCode(val);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  ) : (
                    <>
                      {/* Hidden Actual Input for accessibility & keyboard autofill */}
                      <TextInput
                        ref={hiddenInputRef}
                        value={otp}
                        onChangeText={handleOtpChange}
                        maxLength={AppConstants.otpLength}
                        keyboardType="number-pad"
                        textContentType="oneTimeCode"
                        autoComplete={isMasterAdmin ? 'one-time-code' : 'sms-otp'}
                        importantForAutofill="yes"
                        style={styles.hiddenInput}
                        autoFocus={!isAdmin && !isMasterAdmin}
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
                    </>
                  )}

                  {/* Actions / Resend */}
                  {isMasterAdmin ? (
                    <View style={styles.masterNoticeContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          setUseRecoveryCode(!useRecoveryCode);
                          setErrorMessage(null);
                        }}
                        activeOpacity={0.7}
                        style={styles.recoveryToggleBtn}
                      >
                        <Ionicons
                          name={useRecoveryCode ? 'phone-portrait-outline' : 'key-outline'}
                          size={14}
                          color="#D97706"
                          style={{ marginRight: 5 }}
                        />
                        <Text style={styles.recoveryToggleText}>
                          {useRecoveryCode
                            ? 'Switch to 6-digit Authenticator App Code'
                            : 'Lost Authenticator device? Use Recovery Code'}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.masterAdminHintText}>
                        Note: Master Admin requires Password + Authenticator (TOTP) code. SMS OTP is disabled.
                      </Text>
                    </View>
                  ) : (
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
                  )}

                  {/* Verify / Login Button */}
                  <TouchableOpacity
                    style={[
                      styles.continueBtn,
                      isContinueDisabled && styles.continueBtnDisabled,
                    ]}
                    onPress={handlePressContinue}
                    disabled={isContinueDisabled}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={
                        !isContinueDisabled
                          ? isMasterAdmin
                            ? ['#D97706', '#F59E0B']
                            : ['#FF5A1F', '#FF7A45']
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
                              isContinueDisabled && styles.continueBtnTextDisabled,
                            ]}
                          >
                            {continueButtonText}
                          </Text>
                          <Ionicons
                            name={isMasterAdmin ? 'shield-checkmark' : 'checkmark-done'}
                            size={18}
                            color={!isContinueDisabled ? '#FFFFFF' : theme.textTertiary}
                          />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {!keyboardOpen && !isMasterAdmin && (
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
    inputLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
      marginBottom: 6,
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
    eyeBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    codeHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    totpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(217, 119, 6, 0.3)',
    },
    totpBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#D97706',
      letterSpacing: 0.5,
    },
    masterNoticeContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    recoveryToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.12)' : '#FFFBEB',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(217, 119, 6, 0.25)' : '#FDE68A',
      marginBottom: 8,
    },
    recoveryToggleText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#D97706',
    },
    masterAdminHintText: {
      fontSize: 11,
      color: theme.textTertiary,
      textAlign: 'center',
      lineHeight: 15,
      paddingHorizontal: 8,
    },
    enrollmentContainer: {
      width: '100%',
    },
    enrollmentNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(217, 119, 6, 0.3)',
    },
    enrollmentNoticeText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
      color: isDark ? '#FCD34D' : '#92400E',
      fontWeight: '600',
    },
    enrollmentFieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
      marginBottom: 6,
    },
    secretKeyBox: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: 'center',
      marginBottom: 8,
    },
    secretKeyText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#D97706',
      letterSpacing: 1.5,
    },
    recoveryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    recoveryPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    recoveryPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: 0.8,
    },
  });
