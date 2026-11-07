import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/themeStore';
import { useModuleStore } from '../../store/moduleStore';
import { SuperAppModule } from '../../services/moduleManager';

export const ModuleCatalogScreen: React.FC = () => {
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    modules,
    wifiOnly,
    isDownloading,
    downloadingModuleId,
    downloadProgress,
    totalStorageMb,
    businessStorageMb,
    setWifiOnly,
    downloadModule,
    clearModuleCache,
    clearAllCache,
  } = useModuleStore();

  const handleLaunch = (mod: SuperAppModule) => {
    if (mod.status === 'coming_soon') {
      navigation.navigate('SubmitBusinessRequest', {
        defaultType: 'NEW_MODULE',
        defaultTitle: mod.name,
        defaultCategory: mod.category,
      });
      return;
    }

    try {
      if (mod.route === 'Food') {
        navigation.navigate('MainTabs', { screen: 'Food' });
      } else if (mod.route === 'Rides') {
        navigation.navigate('MainTabs', { screen: 'Rides' });
      } else if (mod.route === 'Bazaar') {
        navigation.navigate('MainTabs', { screen: 'Bazaar' });
      } else if (mod.route === 'Home') {
        navigation.navigate('MainTabs', { screen: 'Home' });
      } else {
        navigation.navigate(mod.route as any);
      }
    } catch {
      Alert.alert('Module Navigation', `Launching ${mod.name}...`);
    }
  };

  const handleDownload = async (mod: SuperAppModule) => {
    const success = await downloadModule(mod.id);
    if (!success) {
      Alert.alert('Download Notice', 'Could not complete download. Check your network or Wi-Fi settings.');
    }
  };

  const handleClearCache = (mod: SuperAppModule) => {
    Alert.alert(
      'Purge Module Cache',
      `Clear cached high-res assets for ${mod.name}? Essential data will be fetched on-demand when you reopen the module.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearModuleCache(mod.id) },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clean All Secondary Cache',
      'Purge non-essential cached media and asset packs across all business modules? Frees up local storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Purge All', style: 'destructive', onPress: () => clearAllCache() },
      ]
    );
  };

  const coreModules = modules.filter(m => m.isCore);
  const businessModules = modules.filter(m => !m.isCore && m.status !== 'coming_soon');
  const futureModules = modules.filter(m => m.status === 'coming_soon');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Module & Resource Manager</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textTertiary }]}>On-Demand Delivery & Storage</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('GrowWithSuperApp')}
          style={[styles.growBadge, { backgroundColor: '#FEF3C7' }]}
          activeOpacity={0.8}
        >
          <Ionicons name="rocket-outline" size={14} color={theme.accent} />
          <Text style={[styles.growBadgeText, { color: theme.accent }]}>Grow</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Storage Summary Card */}
        <View style={[styles.storageCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.storageHeader}>
            <View>
              <Text style={[styles.storageTitle, { color: theme.textPrimary }]}>Local Storage Footprint</Text>
              <Text style={[styles.storageSubtitle, { color: theme.textSecondary }]}>
                Core: 12.5 MB • Modules: {businessStorageMb} MB • Total: {totalStorageMb} MB
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClearAll}
              style={[styles.cleanButton, { borderColor: theme.cardBorder }]}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
              <Text style={styles.cleanButtonText}>Free Storage</Text>
            </TouchableOpacity>
          </View>

          {/* Storage bar */}
          <View style={[styles.storageBarTrack, { backgroundColor: theme.surface }]}>
            <View style={[styles.storageBarCore, { width: '40%', backgroundColor: theme.accent }]} />
            <View style={[styles.storageBarBusiness, { width: '35%', backgroundColor: '#10B981' }]} />
          </View>

          {/* Wi-Fi Only Preference */}
          <View style={[styles.wifiRow, { borderTopColor: theme.cardBorder }]}>
            <View style={styles.wifiTextWrap}>
              <Ionicons name="wifi-outline" size={18} color={theme.textSecondary} />
              <View>
                <Text style={[styles.wifiTitle, { color: theme.textPrimary }]}>Download on Wi-Fi Only</Text>
                <Text style={[styles.wifiDesc, { color: theme.textTertiary }]}>Saves mobile data for on-demand packs</Text>
              </View>
            </View>
            <Switch
              value={wifiOnly}
              onValueChange={setWifiOnly}
              thumbColor={wifiOnly ? theme.accent : '#9CA3AF'}
              trackColor={{ false: '#D1D5DB', true: '#FEF3C7' }}
            />
          </View>
        </View>

        {/* Section 1: Business Modules (Layer B) */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Active Business Modules</Text>
        <Text style={[styles.sectionSub, { color: theme.textTertiary }]}>
          Modules initialize and hydrate resources on-demand.
        </Text>

        {businessModules.map(mod => {
          const isThisDownloading = isDownloading && downloadingModuleId === mod.id;
          return (
            <View
              key={mod.id}
              style={[styles.moduleCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={styles.moduleHeader}>
                <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name={mod.icon as any} size={22} color={theme.accent} />
                </View>
                <View style={styles.moduleInfo}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.moduleName, { color: theme.textPrimary }]}>{mod.name}</Text>
                    <View style={[styles.statusPill, { backgroundColor: '#DEF7EC' }]}>
                      <Text style={[styles.statusText, { color: '#03543F' }]}>Ready</Text>
                    </View>
                  </View>
                  <Text style={[styles.moduleDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {mod.description}
                  </Text>
                  <Text style={[styles.moduleMeta, { color: theme.textTertiary }]}>
                    Category: {mod.category} • Pack Size: ~{mod.estimatedSizeMb} MB
                  </Text>
                </View>
              </View>

              {isThisDownloading && (
                <View style={styles.downloadProgressWrap}>
                  <View style={[styles.progressBarTrack, { backgroundColor: theme.surface }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${downloadProgress}%`, backgroundColor: theme.accent },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: theme.accent }]}>
                    Downloading pack: {downloadProgress}%
                  </Text>
                </View>
              )}

              <View style={[styles.moduleActions, { borderTopColor: theme.cardBorder }]}>
                {mod.cachedBytes > 0 && (
                  <TouchableOpacity
                    onPress={() => handleClearCache(mod)}
                    style={styles.actionSubtle}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh-outline" size={14} color={theme.textTertiary} />
                    <Text style={[styles.actionSubtleText, { color: theme.textTertiary }]}>Clear Cache</Text>
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={() => handleLaunch(mod)}
                  style={[styles.launchButton, { backgroundColor: theme.accent }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.launchButtonText}>Open Experience</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Section 2: Core Runtime (Layer A) */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary, marginTop: 24 }]}>
          Core Application Runtime
        </Text>
        <Text style={[styles.sectionSub, { color: theme.textTertiary }]}>
          Essential baseline: Auth, GPS, Push Notifications, Settings & Navigation.
        </Text>

        {coreModules.map(mod => (
          <View
            key={mod.id}
            style={[styles.moduleCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          >
            <View style={styles.moduleHeader}>
              <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}>
                <Ionicons name={mod.icon as any} size={22} color={theme.textPrimary} />
              </View>
              <View style={styles.moduleInfo}>
                <View style={styles.titleRow}>
                  <Text style={[styles.moduleName, { color: theme.textPrimary }]}>{mod.name}</Text>
                  <View style={[styles.statusPill, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.statusText, { color: theme.textSecondary }]}>Core Native</Text>
                  </View>
                </View>
                <Text style={[styles.moduleDesc, { color: theme.textSecondary }]}>{mod.description}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Section 3: Future Ecosystem & Proposals */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary, marginTop: 24 }]}>
          Grow With SuperApp Ecosystem
        </Text>
        <Text style={[styles.sectionSub, { color: theme.textTertiary }]}>
          Upcoming categories under planning. Submit a proposal to bring your business live.
        </Text>

        {futureModules.map(mod => (
          <View
            key={mod.id}
            style={[
              styles.moduleCard,
              { backgroundColor: theme.card, borderColor: theme.cardBorder, borderStyle: 'dashed' },
            ]}
          >
            <View style={styles.moduleHeader}>
              <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}>
                <Ionicons name={mod.icon as any} size={22} color={theme.textSecondary} />
              </View>
              <View style={styles.moduleInfo}>
                <View style={styles.titleRow}>
                  <Text style={[styles.moduleName, { color: theme.textPrimary }]}>{mod.name}</Text>
                  <View style={[styles.statusPill, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.statusText, { color: '#92400E' }]}>Planning</Text>
                  </View>
                </View>
                <Text style={[styles.moduleDesc, { color: theme.textSecondary }]}>{mod.description}</Text>
              </View>
            </View>

            <View style={[styles.moduleActions, { borderTopColor: theme.cardBorder }]}>
              <TouchableOpacity
                onPress={() => handleLaunch(mod)}
                style={[styles.requestBtn, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
                activeOpacity={0.8}
              >
                <Ionicons name="bulb-outline" size={14} color={theme.accent} />
                <Text style={[styles.requestBtnText, { color: theme.accent }]}>Propose as Partner</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  growBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  growBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  storageCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  storageTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  storageSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  cleanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  cleanButtonText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  storageBarTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  storageBarCore: {
    height: '100%',
  },
  storageBarBusiness: {
    height: '100%',
  },
  wifiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  wifiTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wifiTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  wifiDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    marginBottom: 12,
  },
  moduleCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  moduleHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  moduleName: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  moduleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  moduleMeta: {
    fontSize: 10,
    marginTop: 4,
  },
  downloadProgressWrap: {
    marginTop: 10,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionSubtle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionSubtleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  launchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  launchButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  requestBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
