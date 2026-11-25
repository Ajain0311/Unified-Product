import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/themeStore';
import { masterAdminService, MasterAdminTotpSetupResponse } from '../../services/masterAdminService';
import { useRoleStore } from '../../store/roleStore';
import { useAuthStore } from '../../store/authStore';
import { storage } from '../../services/storage';
import { User } from '../../models/auth';

interface MasterAdminLoginScreenProps {
  navigation: any;
  route?: any;
}

export const MasterAdminLoginScreen: React.FC<MasterAdminLoginScreenProps> = ({ navigation, route }) => {
  const { theme, isDark } = useAppTheme();
  const switchRole = useRoleStore((s) => s.switchRole);

  const initialIdentifier = route?.params?.identifier || '';

  // Form State
  const [usernameOrEmail, setUsernameOrEmail] = useState(initialIdentifier);

  useEffect(() => {
    if (route?.params?.identifier) {
      setUsernameOrEmail(route.params.identifier);
    }
  }, [route?.params?.identifier]);
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Enrollment State (if first-time MFA)
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<MasterAdminTotpSetupResponse | null>(null);
  const [enrollmentToken, setEnrollmentToken] = useState<string | null>(null);
  const [enrollmentConfirmCode, setEnrollmentConfirmCode] = useState('');
  const [isConfirmingMfa, setIsConfirmingMfa] = useState(false);

  const handleLogin = async () => {
    if (!usernameOrEmail.trim() || !password) {
      Alert.alert('Required Fields', 'Please enter your Master Admin Email/Username and Password.');
      return;
    }

    if (useRecoveryCode && !recoveryCode.trim()) {
      Alert.alert('Recovery Code Required', 'Please enter one of your 8-digit emergency recovery codes.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await masterAdminService.login({
        identifier: usernameOrEmail.trim(),
        usernameOrEmail: usernameOrEmail.trim(),
        password,
        totpCode: !useRecoveryCode && totpCode.trim() ? totpCode.trim() : undefined,
        recoveryCode: useRecoveryCode && recoveryCode.trim() ? recoveryCode.trim() : undefined,
      });

      if (response.requiresMfaEnrollment && response.tempEnrollmentToken) {
        // First-time enrollment required
        setEnrollmentToken(response.tempEnrollmentToken);
        const setup = await masterAdminService.setupTotp(response.tempEnrollmentToken);
        setEnrollmentData(setup);
        setIsEnrolling(true);
        return;
      }

      if (response.success && response.token) {
        await storage.setToken(response.token);
        await storage.setMasterAdminMfaVerified(true);
        const apiUser = response.user;
        const userData: User = {
          id: apiUser?.id ? Number(apiUser.id) : 1,
          mobileNumber: apiUser?.mobileNumber || usernameOrEmail.trim(),
          fullName: apiUser?.fullName || 'Master Administrator',
          email: apiUser?.email || null,
          profileImageUrl: null,
          roles: apiUser?.roles && apiUser.roles.length > 0 ? apiUser.roles : ['MASTER_ADMIN', 'ADMIN', 'CUSTOMER'],
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
        await switchRole('MASTER_ADMIN');
        navigation.replace('MasterAdminControlPanel');
      } else {
        Alert.alert('Authentication Failed', response.message || 'Invalid credentials or Authenticator code.');
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Unable to authenticate. Check server connection.';
      Alert.alert('Authentication Error', errorMsg);
    } finally {
      setIsSubmitting(false);
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
      const candidateCodes = enrollmentData?.recoveryCodes || undefined;
      const res = await masterAdminService.confirmTotp(
        enrollmentConfirmCode.trim(),
        candidateSecret,
        enrollmentToken || undefined,
        candidateCodes
      );

      if (res.success && res.token) {
        await storage.setToken(res.token);
        await storage.setMasterAdminMfaVerified(true);
        const apiUser = res.user;
        const userData: User = {
          id: apiUser?.id ? Number(apiUser.id) : 1,
          mobileNumber: apiUser?.mobileNumber || usernameOrEmail.trim(),
          fullName: apiUser?.fullName || 'Master Administrator',
          email: apiUser?.email || null,
          profileImageUrl: null,
          roles: apiUser?.roles && apiUser.roles.length > 0 ? apiUser.roles : ['MASTER_ADMIN', 'ADMIN', 'CUSTOMER'],
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
        await switchRole('MASTER_ADMIN');
        Alert.alert(
          'MFA Successfully Registered',
          'Google/Microsoft Authenticator is now active for your account. Keep your backup recovery codes safe!',
          [
            {
              text: 'Open Control Panel',
              onPress: () => navigation.replace('MasterAdminControlPanel'),
            },
          ]
        );
      } else {
        Alert.alert('Verification Failed', res.message || 'Invalid code from Authenticator app.');
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Verification failed. Please retry.';
      Alert.alert('Enrollment Error', errorMsg);
    } finally {
      setIsConfirmingMfa(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.surface }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={styles.badgeRow}>
              <View style={styles.crownBox}>
                <Ionicons name="key" size={24} color="#D97706" />
              </View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Master Admin</Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Privileged Remote Platform Killswitch & Control Panel
            </Text>
          </View>

          {!isEnrolling ? (
            /* Standard Login Form */
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.noticeBox}>
                <Ionicons name="shield-checkmark" size={18} color="#D97706" />
                <Text style={styles.noticeText}>
                  Requires Password + Authenticator (TOTP) or Emergency Code. Phone OTP is strictly barred.
                </Text>
              </View>

              {/* Username or Email */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email or Mobile</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="mail-outline" size={18} color={theme.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  placeholder="admin@superapp.com"
                  placeholderTextColor={theme.textTertiary}
                  value={usernameOrEmail}
                  onChangeText={setUsernameOrEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 14 }]}>Master Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={theme.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={theme.textTertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* TOTP or Recovery Code */}
              {!useRecoveryCode ? (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      Authenticator 6-Digit Code (TOTP)
                    </Text>
                    <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '500' }}>
                      (Blank on 1st login)
                    </Text>
                  </View>
                  <View
                    style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}
                  >
                    <Ionicons name="phone-portrait-outline" size={18} color="#D97706" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, styles.totpInput, { color: theme.textPrimary }]}
                      placeholder="123456"
                      placeholderTextColor={theme.textTertiary}
                      value={totpCode}
                      onChangeText={setTotpCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.inputLabel, { color: '#EF4444', marginTop: 14 }]}>
                    Emergency Recovery Code (Single-Use)
                  </Text>
                  <View
                    style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: '#EF4444' }]}
                  >
                    <Ionicons name="warning-outline" size={18} color="#EF4444" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: theme.textPrimary }]}
                      placeholder="e.g. 1a2b-3c4d"
                      placeholderTextColor={theme.textTertiary}
                      value={recoveryCode}
                      onChangeText={setRecoveryCode}
                      autoCapitalize="none"
                    />
                  </View>
                </>
              )}

              {/* Toggle Recovery Code */}
              <TouchableOpacity
                style={styles.toggleRecoveryButton}
                onPress={() => setUseRecoveryCode(!useRecoveryCode)}
              >
                <Text style={styles.toggleRecoveryText}>
                  {useRecoveryCode
                    ? 'Switch back to Authenticator (TOTP) Code'
                    : 'Lost Authenticator device? Use Emergency Recovery Code'}
                </Text>
              </TouchableOpacity>

              {/* Login Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Authenticate Master Session</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* First-Time MFA Enrollment Flow */
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.noticeBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="qr-code-outline" size={20} color="#D97706" />
                <Text style={[styles.noticeText, { color: '#92400E' }]}>
                  First-Time Setup: Scan this key in Google or Microsoft Authenticator, save backup codes, and verify.
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                Manual Base32 Entry Secret
              </Text>
              <View style={[styles.secretBox, { backgroundColor: theme.background }]}>
                <Text style={styles.secretText} selectable>
                  {enrollmentData?.manualEntryKey}
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 14 }]}>
                One-Time Backup Recovery Codes (Save These!)
              </Text>
              <View style={styles.recoveryGrid}>
                {enrollmentData?.recoveryCodes.map((code, index) => (
                  <View key={index} style={[styles.recoveryPill, { backgroundColor: theme.background }]}>
                    <Text style={[styles.recoveryPillText, { color: theme.textPrimary }]} selectable>
                      {code}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 16 }]}>
                Enter 6-Digit Authenticator Code to Confirm
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="keypad-outline" size={18} color="#D97706" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.totpInput, { color: theme.textPrimary }]}
                  placeholder="123456"
                  placeholderTextColor={theme.textTertiary}
                  value={enrollmentConfirmCode}
                  onChangeText={setEnrollmentConfirmCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isConfirmingMfa && { opacity: 0.7 }]}
                onPress={handleConfirmEnrollment}
                disabled={isConfirmingMfa}
                activeOpacity={0.8}
              >
                {isConfirmingMfa ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Confirm & Activate Authenticator</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  crownBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D977061A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  totpInput: {
    letterSpacing: 6,
    fontWeight: '700',
    fontSize: 18,
  },
  eyeButton: {
    padding: 6,
  },
  toggleRecoveryButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  toggleRecoveryText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 10,
    height: 50,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secretBox: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secretText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#D97706',
  },
  recoveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  recoveryPill: {
    width: '48%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  recoveryPillText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    fontSize: 13,
  },
});
