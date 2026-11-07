import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/themeStore';
import { AppRadius } from '../../theme/spacing';
import { shadowStyle, USE_NATIVE_DRIVER } from '../../utils/platformStyles';
import { FormKeyboardAvoid } from '../common/FormKeyboardAvoid';

interface AuthOtpModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
}

export const AuthOtpModal: React.FC<AuthOtpModalProps> = ({
  visible,
  onClose,
  onSuccess,
  title = 'Sign In to Continue',
  subtitle = 'Verify your phone number to proceed seamlessly',
}) => {
  const { theme, isDark } = useAppTheme();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useAuthStore((s: any) => s.sendOtp);
  const verifyOtp = useAuthStore((s: any) => s.verifyOtp);
  const adminLogin = useAuthStore((s: any) => s.adminLogin);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const successHandledRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setStep('PHONE');
      setPhone('');
      setOtp('');
      setFullName('');
      setIsNewUser(false);
      setIsAdmin(false);
      setAdminPassword('');
      setShowPassword(false);
      setDevOtp(undefined);
      setTimerSeconds(30);
      setError(null);
      setIsLoading(false);
      successHandledRef.current = false;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
    }
  }, [visible]);

  useEffect(() => {
    if (step !== 'OTP' || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  const cleanNumber = phone.trim().replace(/\D/g, '');
  const isPhoneValid = cleanNumber.length === 10;
  const isOtpValid = otp.trim().length === 6;
  const isPasswordValid = adminPassword.trim().length >= 4;

  const handleSendOtp = async () => {
    if (isLoading) return;
    if (!isPhoneValid) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setIsLoading(true);
    Keyboard.dismiss();
    try {
      const res = await sendOtp(cleanNumber);
      setIsAdmin(Boolean(res.isAdmin));
      setIsNewUser(Boolean(res.isNewUser));
      setDevOtp(res.devOtp);
      setStep('OTP');
      setTimerSeconds(30);
      if (res.devOtp) {
        setOtp(res.devOtp);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (isLoading || successHandledRef.current) return;
    if (!isOtpValid) {
      setError('Please enter a complete 6-digit OTP');
      return;
    }
    if (isAdmin && !isPasswordValid) {
      setError('Please enter your admin password');
      return;
    }
    if (isNewUser && (!fullName.trim() || fullName.trim().length < 2)) {
      setError('Please enter your full name');
      return;
    }
    setError(null);
    setIsLoading(true);
    Keyboard.dismiss();
    try {
      if (isAdmin) {
        await adminLogin(cleanNumber, adminPassword.trim(), otp.trim());
      } else {
        await verifyOtp(cleanNumber, otp.trim(), isNewUser ? fullName.trim() : undefined);
      }
      if (!useAuthStore.getState().isAuthenticated) {
        setError('Sign-in could not be completed. Please try again.');
        setIsLoading(false);
        return;
      }
      successHandledRef.current = true;
      setIsLoading(false);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check your credentials and try again.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timerSeconds > 0 || isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await sendOtp(cleanNumber);
      setTimerSeconds(30);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
        setOtp(res.devOtp);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <FormKeyboardAvoid>
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropPressable} activeOpacity={1} onPress={onClose} />

          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerTitles}>
                <View style={styles.titleIconRow}>
                  <View style={[styles.sparkleBox, { backgroundColor: isDark ? '#FF5A1F25' : '#FFF3EE' }]}>
                    <Ionicons name="shield-checkmark" size={18} color="#FF5A1F" />
                  </View>
                  <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
                </View>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: theme.chipBg }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {step === 'PHONE' ? (
              /* Step 1: Phone input */
              <View style={styles.body}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>MOBILE NUMBER</Text>

                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                      borderColor: isPhoneValid ? '#10B981' : theme.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.countryCodePill}>
                    <Text style={styles.flag}>🇮🇳</Text>
                    <Text style={[styles.countryCode, { color: theme.textPrimary }]}>+91</Text>
                  </View>
                  <View style={[styles.vertDivider, { backgroundColor: theme.cardBorder }]} />
                  <TextInput
                    style={[styles.phoneInput, { color: theme.textPrimary }]}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    autoFocus
                  />
                  {isPhoneValid && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 10 }} />
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, (!isPhoneValid || isLoading) && { opacity: 0.6 }]}
                  onPress={handleSendOtp}
                  disabled={!isPhoneValid || isLoading}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#FF5A1F', '#FF7A45']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.btnRow}>
                        <Text style={styles.btnText}>Send Verification Code</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* Step 2: OTP input */
              <View style={styles.body}>
                <View style={styles.phoneChangeRow}>
                  <Text style={[styles.sentText, { color: theme.textSecondary }]}>
                    Code sent to <Text style={{ fontWeight: '700', color: theme.textPrimary }}>+91 {cleanNumber}</Text>
                  </Text>
                  <TouchableOpacity onPress={() => setStep('PHONE')}>
                    <Text style={[styles.changeText, { color: theme.primary }]}>Change</Text>
                  </TouchableOpacity>
                </View>

                {devOtp ? (
                  <View style={[styles.devOtpBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
                    <Ionicons name="key-outline" size={14} color="#10B981" />
                    <Text style={styles.devOtpText}>
                      Test OTP: <Text style={{ fontWeight: '800' }}>{devOtp}</Text>
                    </Text>
                  </View>
                ) : null}

                {isAdmin ? (
                  <View style={{ marginBottom: 14 }}>
                    <View style={styles.adminBadgeRow}>
                      <Ionicons name="shield-half" size={14} color="#FF5A1F" />
                      <Text style={[styles.adminBadgeText, { color: '#FF5A1F' }]}>ADMIN ACCOUNT VERIFICATION</Text>
                    </View>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>ADMIN PASSWORD</Text>
                    <View
                      style={[
                        styles.passwordContainer,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                          borderColor: isPasswordValid ? '#10B981' : theme.cardBorder,
                        },
                      ]}
                    >
                      <TextInput
                        style={[styles.passwordInput, { color: theme.textPrimary }]}
                        placeholder="Enter admin password (e.g. Admin@123)"
                        placeholderTextColor={theme.textTertiary}
                        secureTextEntry={!showPassword}
                        value={adminPassword}
                        onChangeText={setAdminPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={theme.textTertiary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {isNewUser ? (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>YOUR FULL NAME</Text>
                    <TextInput
                      style={[
                        styles.nameInput,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                          borderColor: theme.cardBorder,
                          color: theme.textPrimary,
                        },
                      ]}
                      placeholder="e.g. Rahul Sharma"
                      placeholderTextColor={theme.textTertiary}
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                ) : null}

                <Text style={[styles.label, { color: theme.textSecondary }]}>ENTER 6-DIGIT OTP</Text>
                <TextInput
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                      borderColor: isOtpValid ? '#10B981' : theme.cardBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="• • • • • •"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  autoFocus
                />

                <View style={styles.resendRow}>
                  {timerSeconds > 0 ? (
                    <Text style={[styles.timerText, { color: theme.textTertiary }]}>
                      Resend code in <Text style={{ fontWeight: '700' }}>{timerSeconds}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResend} disabled={isLoading}>
                      <Text style={[styles.resendAction, { color: theme.primary }]}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, (!isOtpValid || (isAdmin && !isPasswordValid) || isLoading) && { opacity: 0.6 }]}
                  onPress={handleVerifyOtp}
                  disabled={!isOtpValid || (isAdmin && !isPasswordValid) || isLoading}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#FF5A1F', '#FF7A45']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.btnRow}>
                        <Text style={styles.btnText}>
                          {isAdmin ? 'Login as Admin' : 'Verify & Continue'}
                        </Text>
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </FormKeyboardAvoid>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
    ...shadowStyle({
      color: '#000000',
      offsetY: -6,
      opacity: 0.25,
      radius: 20,
      elevation: 16,
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitles: {
    flex: 1,
    paddingRight: 12,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sparkleBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: AppRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  body: {
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    height: 52,
    marginBottom: 16,
  },
  countryCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  flag: {
    fontSize: 18,
    marginRight: 4,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '700',
  },
  vertDivider: {
    width: 1,
    height: 24,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    letterSpacing: 0.5,
  },
  nameInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  otpInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    height: 54,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 12,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    height: 50,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 6,
  },
  phoneChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sentText: {
    fontSize: 13,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  devOtpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 12,
  },
  devOtpText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 12,
  },
  resendAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    ...shadowStyle({
      color: '#FF5A1F',
      offsetY: 4,
      opacity: 0.35,
      radius: 10,
      elevation: 6,
    }),
  },
  gradientBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
