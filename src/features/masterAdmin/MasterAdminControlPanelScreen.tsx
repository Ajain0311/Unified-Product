import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/themeStore';
import {
  masterAdminService,
  MasterAdminPlatformConfig,
} from '../../services/masterAdminService';
import { PlatformModulePublicConfig, configService } from '../../services/configService';
import { useRoleStore } from '../../store/roleStore';

interface MasterAdminControlPanelScreenProps {
  navigation: any;
}

type TabType = 'modules' | 'theme' | 'language' | 'settings' | 'security';

export const MasterAdminControlPanelScreen: React.FC<MasterAdminControlPanelScreenProps> = ({
  navigation,
}) => {
  const { theme, isDark } = useAppTheme();
  const switchRole = useRoleStore((s) => s.switchRole);

  const [activeTab, setActiveTab] = useState<TabType>('modules');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Platform Configuration State
  const [config, setConfig] = useState<MasterAdminPlatformConfig | null>(null);
  const [modules, setModules] = useState<PlatformModulePublicConfig[]>([]);

  // Theme State
  const [allowThemeSwitch, setAllowThemeSwitch] = useState(true);
  const [defaultTheme, setDefaultTheme] = useState<'light' | 'dark'>('light');

  // Language State
  const [allowLanguageSwitch, setAllowLanguageSwitch] = useState(true);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['en', 'hi']);
  const [defaultLanguage, setDefaultLanguage] = useState('en');

  // System Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowGuestBrowsing, setAllowGuestBrowsing] = useState(true);
  const [announcementText, setAnnouncementText] = useState('');

  const loadConfig = useCallback(async () => {
    try {
      const data = await masterAdminService.getConfig();
      setConfig(data);
      configService.syncPlatformControls(data as any);
      setModules(data.modules || []);
      setAllowThemeSwitch(data.theme.allowUserThemeSwitch);
      setDefaultTheme(data.theme.defaultTheme as 'light' | 'dark');
      setAllowLanguageSwitch(data.language.allowUserLanguageSwitch);
      setSupportedLanguages(data.language.supportedLanguages || ['en', 'hi']);
      setDefaultLanguage(data.language.defaultLanguage || 'en');

      if (data.systemSettings) {
        setMaintenanceMode(data.systemSettings['maintenance_mode'] === 'true');
        setAllowGuestBrowsing(data.systemSettings['allow_guest_browsing'] !== 'false');
        setAnnouncementText(data.systemSettings['broadcast_announcement'] || '');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        Alert.alert(
          'MFA Session Required',
          'Your Master Admin privileged session has expired or requires Authenticator verification.',
          [
            {
              text: 'Login',
              onPress: () => navigation.replace('MasterAdminLogin'),
            },
          ]
        );
      } else {
        Alert.alert('Configuration Error', err.message || 'Failed to fetch platform configuration.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadConfig();
  };

  // Module Reordering and Toggling
  const toggleModuleStatus = (moduleKey: string) => {
    setModules((prev) =>
      prev.map((m) => (m.key === moduleKey ? { ...m, isEnabled: !m.isEnabled } : m))
    );
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const updated = [...modules];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Reassign sort orders sequentially
    const reordered = updated.map((m, idx) => ({ ...m, sortOrder: idx + 1 }));
    setModules(reordered);
  };

  const saveModules = async () => {
    setIsSaving(true);
    try {
      const res = await masterAdminService.updateModules(modules);
      setConfig(res);
      setModules(res.modules);
      Alert.alert('Saved', 'Business modules visibility and sequence updated successfully!');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update modules.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveTheme = async () => {
    setIsSaving(true);
    try {
      const res = await masterAdminService.updateTheme({
        allowUserThemeSwitch: allowThemeSwitch,
        defaultTheme,
      });
      setConfig(res);
      configService.syncPlatformControls(res as any);
      Alert.alert('Saved', 'Theme configuration updated successfully!');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update theme.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveLanguage = async () => {
    if (!supportedLanguages.includes(defaultLanguage)) {
      Alert.alert('Invalid Configuration', `Default language '${defaultLanguage}' must be in the supported languages list.`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await masterAdminService.updateLanguage({
        allowUserLanguageSwitch: allowLanguageSwitch,
        supportedLanguages,
        defaultLanguage,
      });
      setConfig(res);
      configService.syncPlatformControls(res as any);
      Alert.alert('Saved', 'Language controls updated successfully!');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update language settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSupportedLanguage = (lang: string) => {
    if (supportedLanguages.includes(lang)) {
      if (supportedLanguages.length === 1) {
        Alert.alert('Cannot Remove', 'At least one supported language is required.');
        return;
      }
      setSupportedLanguages((prev) => prev.filter((l) => l !== lang));
    } else {
      setSupportedLanguages((prev) => [...prev, lang]);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const updated = {
        maintenance_mode: maintenanceMode ? 'true' : 'false',
        allow_guest_browsing: allowGuestBrowsing ? 'true' : 'false',
        broadcast_announcement: announcementText.trim(),
      };
      const res = await masterAdminService.updateSettings(updated);
      setConfig(res);
      Alert.alert('Saved', 'System settings & killswitches updated successfully!');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('End Master Admin Session', 'Terminate your privileged Master Admin MFA session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await masterAdminService.logout();
          await switchRole('CUSTOMER');
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading Master Admin Platform Config...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.crownCircle}>
            <Ionicons name="key" size={18} color="#D97706" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Master Admin</Text>
              <View style={styles.mfaBadge}>
                <Ionicons name="shield-checkmark" size={11} color="#059669" />
                <Text style={styles.mfaBadgeText}>MFA ACTIVE</Text>
              </View>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Unified Platform Remote Control
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.background }]}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Segment Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'modules' && styles.tabItemActive]}
            onPress={() => setActiveTab('modules')}
          >
            <Ionicons
              name={activeTab === 'modules' ? 'grid' : 'grid-outline'}
              size={16}
              color={activeTab === 'modules' ? '#D97706' : theme.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'modules' && styles.tabTextActive]}>Modules</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'theme' && styles.tabItemActive]}
            onPress={() => setActiveTab('theme')}
          >
            <Ionicons
              name={activeTab === 'theme' ? 'color-palette' : 'color-palette-outline'}
              size={16}
              color={activeTab === 'theme' ? '#D97706' : theme.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'theme' && styles.tabTextActive]}>Theme</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'language' && styles.tabItemActive]}
            onPress={() => setActiveTab('language')}
          >
            <Ionicons
              name={activeTab === 'language' ? 'language' : 'language-outline'}
              size={16}
              color={activeTab === 'language' ? '#D97706' : theme.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'language' && styles.tabTextActive]}>Language</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Ionicons
              name={activeTab === 'settings' ? 'construct' : 'construct-outline'}
              size={16}
              color={activeTab === 'settings' ? '#D97706' : theme.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>Killswitches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'security' && styles.tabItemActive]}
            onPress={() => setActiveTab('security')}
          >
            <Ionicons
              name={activeTab === 'security' ? 'shield-checkmark' : 'shield-outline'}
              size={16}
              color={activeTab === 'security' ? '#D97706' : theme.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'security' && styles.tabTextActive]}>Security</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#D97706" />}
      >
        {/* TAB 1: MODULES MANAGEMENT */}
        {activeTab === 'modules' && (
          <View>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Ecosystem Modules</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Reorder modules or toggle killswitch to show/hide across app
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                onPress={saveModules}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {modules.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.moduleCard,
                  { backgroundColor: theme.surface, borderColor: item.isEnabled ? theme.border : '#EF4444' },
                ]}
              >
                <View style={styles.reorderCol}>
                  <TouchableOpacity
                    style={[styles.arrowBtn, index === 0 && { opacity: 0.2 }]}
                    onPress={() => moveModule(index, 'up')}
                    disabled={index === 0}
                  >
                    <Ionicons name="chevron-up" size={16} color={theme.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.sortOrderText, { color: theme.textSecondary }]}>{index + 1}</Text>
                  <TouchableOpacity
                    style={[styles.arrowBtn, index === modules.length - 1 && { opacity: 0.2 }]}
                    onPress={() => moveModule(index, 'down')}
                    disabled={index === modules.length - 1}
                  >
                    <Ionicons name="chevron-down" size={16} color={theme.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.moduleInfo}>
                  <View style={styles.moduleNameRow}>
                    <Text style={[styles.moduleName, { color: theme.textPrimary }]}>{item.nameEn}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: item.isEnabled ? '#ECFDF5' : '#FEF2F2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: item.isEnabled ? '#059669' : '#DC2626' },
                        ]}
                      >
                        {item.isEnabled ? 'LIVE' : 'DISABLED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.moduleHindiName, { color: theme.textSecondary }]}>
                    {item.nameHi} • Key: {item.key}
                  </Text>
                  <Text style={[styles.moduleRoute, { color: theme.textTertiary }]}>
                    Route: {item.route} • Category: {item.category}
                  </Text>
                </View>

                <View style={styles.moduleSwitchCol}>
                  <Switch
                    value={item.isEnabled}
                    onValueChange={() => toggleModuleStatus(item.key)}
                    trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 2: THEME MANAGEMENT */}
        {activeTab === 'theme' && (
          <View>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Theme Controls</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Manage user switching permission and platform default theme
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                onPress={saveTheme}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                    Allow Normal Users to Switch Theme
                  </Text>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                    When disabled, the theme switch option is hidden in header, drawer and profile.
                  </Text>
                </View>
                <Switch
                  value={allowThemeSwitch}
                  onValueChange={setAllowThemeSwitch}
                  trackColor={{ false: '#E2E8F0', true: '#D97706' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <Text style={[styles.subSectionTitle, { color: theme.textPrimary, marginTop: 20 }]}>
              Default Platform Theme
            </Text>

            <View style={styles.themeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.themeOptionCard,
                  { backgroundColor: '#FFFFFF', borderColor: defaultTheme === 'light' ? '#D97706' : '#E2E8F0' },
                  defaultTheme === 'light' && styles.themeOptionActive,
                ]}
                onPress={() => setDefaultTheme('light')}
                activeOpacity={0.8}
              >
                <Ionicons name="sunny" size={28} color="#F59E0B" />
                <Text style={[styles.themeOptionTitle, { color: '#0F172A' }]}>Light Theme</Text>
                <Text style={styles.themeOptionSubtitle}>Clean, high-visibility bright mode</Text>
                {defaultTheme === 'light' && (
                  <View style={styles.activeCheckmark}>
                    <Ionicons name="checkmark-circle" size={18} color="#D97706" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOptionCard,
                  { backgroundColor: '#0F172A', borderColor: defaultTheme === 'dark' ? '#D97706' : '#334155' },
                  defaultTheme === 'dark' && styles.themeOptionActive,
                ]}
                onPress={() => setDefaultTheme('dark')}
                activeOpacity={0.8}
              >
                <Ionicons name="moon" size={28} color="#818CF8" />
                <Text style={[styles.themeOptionTitle, { color: '#FFFFFF' }]}>Dark Theme</Text>
                <Text style={[styles.themeOptionSubtitle, { color: '#94A3B8' }]}>Battery-efficient sleek night mode</Text>
                {defaultTheme === 'dark' && (
                  <View style={styles.activeCheckmark}>
                    <Ionicons name="checkmark-circle" size={18} color="#D97706" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 3: LANGUAGE MANAGEMENT */}
        {activeTab === 'language' && (
          <View>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Localization Controls</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Manage user language toggling and platform default locale
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                onPress={saveLanguage}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                    Allow Normal Users to Switch Language
                  </Text>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                    When disabled, the language button in header and settings is hidden.
                  </Text>
                </View>
                <Switch
                  value={allowLanguageSwitch}
                  onValueChange={setAllowLanguageSwitch}
                  trackColor={{ false: '#E2E8F0', true: '#D97706' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <Text style={[styles.subSectionTitle, { color: theme.textPrimary, marginTop: 20 }]}>
              Supported Platform Languages
            </Text>

            <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 8 }]}>
              <TouchableOpacity
                style={styles.langCheckRow}
                onPress={() => toggleSupportedLanguage('en')}
              >
                <View>
                  <Text style={[styles.langCheckTitle, { color: theme.textPrimary }]}>English (en)</Text>
                  <Text style={[styles.langCheckSub, { color: theme.textSecondary }]}>Standard International Locale</Text>
                </View>
                <Ionicons
                  name={supportedLanguages.includes('en') ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={supportedLanguages.includes('en') ? '#D97706' : theme.textTertiary}
                />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <TouchableOpacity
                style={styles.langCheckRow}
                onPress={() => toggleSupportedLanguage('hi')}
              >
                <View>
                  <Text style={[styles.langCheckTitle, { color: theme.textPrimary }]}>हिन्दी (hi)</Text>
                  <Text style={[styles.langCheckSub, { color: theme.textSecondary }]}>National Hindi Locale</Text>
                </View>
                <Ionicons
                  name={supportedLanguages.includes('hi') ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={supportedLanguages.includes('hi') ? '#D97706' : theme.textTertiary}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.subSectionTitle, { color: theme.textPrimary, marginTop: 20 }]}>
              Default Language for New Users
            </Text>

            <View style={styles.defaultLangRow}>
              {supportedLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.defaultLangChip,
                    { backgroundColor: theme.surface, borderColor: defaultLanguage === lang ? '#D97706' : theme.border },
                    defaultLanguage === lang && { backgroundColor: '#D9770615' },
                  ]}
                  onPress={() => setDefaultLanguage(lang)}
                >
                  <Ionicons
                    name={defaultLanguage === lang ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={defaultLanguage === lang ? '#D97706' : theme.textTertiary}
                  />
                  <Text
                    style={[
                      styles.defaultLangText,
                      { color: defaultLanguage === lang ? '#D97706' : theme.textPrimary },
                    ]}
                  >
                    {lang === 'en' ? 'English (en)' : 'हिन्दी (hi)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* TAB 4: SYSTEM KILLSWITCHES & SETTINGS */}
        {activeTab === 'settings' && (
          <View>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Platform Killswitches</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Global platform controls and real-time announcement ticker
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                onPress={saveSettings}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: maintenanceMode ? '#EF4444' : theme.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="warning" size={16} color={maintenanceMode ? '#EF4444' : theme.textTertiary} />
                    <Text style={[styles.settingTitle, { color: maintenanceMode ? '#EF4444' : theme.textPrimary }]}>
                      Emergency Maintenance Mode
                    </Text>
                  </View>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                    When active, platforms lock customer transactions while allowing admin operations.
                  </Text>
                </View>
                <Switch
                  value={maintenanceMode}
                  onValueChange={setMaintenanceMode}
                  trackColor={{ false: '#E2E8F0', true: '#EF4444' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 12 }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                    Allow Guest Browsing
                  </Text>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                    Permit unauthenticated users to view restaurants, rides, and catalog.
                  </Text>
                </View>
                <Switch
                  value={allowGuestBrowsing}
                  onValueChange={setAllowGuestBrowsing}
                  trackColor={{ false: '#E2E8F0', true: '#D97706' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <Text style={[styles.subSectionTitle, { color: theme.textPrimary, marginTop: 20 }]}>
              Broadcast Announcement Banner
            </Text>
            <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 8 }]}>
              <TextInput
                style={[styles.announcementInput, { color: theme.textPrimary }]}
                placeholder="Enter live announcement text displayed on user home screen..."
                placeholderTextColor={theme.textTertiary}
                value={announcementText}
                onChangeText={setAnnouncementText}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        )}

        {/* TAB 5: SECURITY AUDIT & CREDENTIALS */}
        {activeTab === 'security' && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Master Admin Security</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              MFA Authenticator credentials and privileged policy verification
            </Text>

            <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 14 }]}>
              <View style={styles.securityRow}>
                <Ionicons name="shield-checkmark" size={24} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.securityTitle, { color: theme.textPrimary }]}>Authenticator MFA: ACTIVE</Text>
                  <Text style={[styles.securityDesc, { color: theme.textSecondary }]}>
                    Time-Based One-Time Password (RFC 6238) active with monotonic replay prevention.
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.securityRow}>
                <Ionicons name="key" size={24} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.securityTitle, { color: theme.textPrimary }]}>Access Policy: MasterAdminOnly</Text>
                  <Text style={[styles.securityDesc, { color: theme.textSecondary }]}>
                    Requires role claim MASTER_ADMIN and backend verified claim mfa_verified=true.
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.securityRow}>
                <Ionicons name="lock-closed" size={24} color="#3B82F6" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.securityTitle, { color: theme.textPrimary }]}>Session Lifetime</Text>
                  <Text style={[styles.securityDesc, { color: theme.textSecondary }]}>
                    Privileged 8-hour token. Phone OTP login and role switching bypass are strictly barred.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.terminateBtn} onPress={handleLogout}>
              <Ionicons name="power" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.terminateBtnText}>Terminate Privileged Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crownCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D977061A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  mfaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mfaBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    borderBottomWidth: 1,
  },
  tabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tabItemActive: {
    backgroundColor: '#D977061A',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#D97706',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  reorderCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  arrowBtn: {
    padding: 2,
  },
  sortOrderText: {
    fontSize: 11,
    fontWeight: '700',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  moduleHindiName: {
    fontSize: 11,
    marginTop: 2,
  },
  moduleRoute: {
    fontSize: 10,
    marginTop: 2,
  },
  moduleSwitchCol: {
    paddingLeft: 4,
  },
  settingCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingTextCol: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  themeOptionCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  themeOptionActive: {
    borderColor: '#D97706',
  },
  themeOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  themeOptionSubtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    color: '#64748B',
  },
  activeCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  langCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  langCheckTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  langCheckSub: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  defaultLangRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  defaultLangChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  defaultLangText: {
    fontSize: 13,
    fontWeight: '600',
  },
  announcementInput: {
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  securityDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  terminateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    height: 48,
    marginTop: 24,
  },
  terminateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
