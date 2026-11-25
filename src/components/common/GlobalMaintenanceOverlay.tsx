import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSystemSettingsStore } from '../../store/systemSettingsStore';
import { useRoleStore } from '../../store/roleStore';
import { useLanguageStore } from '../../store/languageStore';
import { configService } from '../../services/configService';
import { navigationRef } from '../../navigation/navigationRef';

export const GlobalMaintenanceOverlay: React.FC = () => {
  const maintenanceMode = useSystemSettingsStore((s) => s.maintenanceMode);
  const broadcastAnnouncement = useSystemSettingsStore((s) => s.broadcastAnnouncement);
  const activeRole = useRoleStore((s) => s.activeRole);
  const { language } = useLanguageStore();
  const [isChecking, setIsChecking] = useState(false);

  // Master Admin is strictly exempted so they can manage and restore operations
  if (!maintenanceMode || activeRole === 'MASTER_ADMIN') {
    return null;
  }

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      await configService.fetchConfig(true);
    } catch {} finally {
      setIsChecking(false);
    }
  };

  const handleOpenMasterAdmin = () => {
    try {
      if (navigationRef.isReady()) {
        navigationRef.navigate('MasterAdminLogin' as any);
      }
    } catch (e) {
      console.warn('[Maintenance] Could not navigate to MasterAdminLogin:', e);
    }
  };

  return (
    <View style={styles.backdrop} pointerEvents="auto">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Warning Icon Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="construct" size={44} color="#F59E0B" />
          </View>

          {/* Titles */}
          <Text style={styles.title}>
            {language === 'hi' ? 'रखरखाव कार्य प्रगति पर है' : 'Under Scheduled Maintenance'}
          </Text>

          <Text style={styles.subtitle}>
            {language === 'hi'
              ? 'ज़ुपिफाई पर आवश्यक तकनीकी उन्नयन कार्य चल रहा है। सेवाएं और बुकिंग्स शीघ्र ही पुनः शुरू होंगी।'
              : 'RJ09 Sewa services are temporarily paused while our engineering team performs system upgrades. All features will resume shortly.'}
          </Text>

          {/* Broadcast Announcement if configured */}
          {Boolean(broadcastAnnouncement) && (
            <View style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <Ionicons name="megaphone" size={16} color="#3B82F6" />
                <Text style={styles.announcementLabel}>
                  {language === 'hi' ? 'प्रशासनिक सूचना' : 'Official Notice'}
                </Text>
              </View>
              <Text style={styles.announcementBody}>{broadcastAnnouncement}</Text>
            </View>
          )}

          {/* Status Check Button */}
          <TouchableOpacity
            style={styles.checkButton}
            onPress={handleCheckStatus}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            {isChecking ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.checkButtonText}>
                  {language === 'hi' ? 'सर्वर स्टेटस जांचें' : 'Check Server Status'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Master Admin Bypass Link */}
          <TouchableOpacity
            style={styles.adminLink}
            onPress={handleOpenMasterAdmin}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark" size={14} color="#64748B" />
            <Text style={styles.adminLinkText}>Master Admin Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#090D16',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  announcementCard: {
    width: '100%',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  announcementLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  announcementBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#E2E8F0',
  },
  checkButton: {
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  adminLinkText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
