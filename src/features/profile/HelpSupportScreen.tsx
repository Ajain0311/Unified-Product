import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { typography } from '../../theme/typography';
import { spacing, AppRadius, AppShadows } from '../../theme/spacing';
import { apiClient } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';

type SupportConfig = {
  phone: string;
  whatsApp: string;
  email: string;
  hours: string;
  faq: string;
};

function digitsOnly(value: string) {
  return String(value || '').replace(/\D/g, '');
}

function parseFaqBlocks(faq: string): { q: string; a: string }[] {
  const text = String(faq || '').trim();
  if (!text) return [];
  const chunks = text.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  const blocks: { q: string; a: string }[] = [];
  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    let q = '';
    let a = '';
    for (const line of lines) {
      if (/^q\s*:/i.test(line)) q = line.replace(/^q\s*:/i, '').trim();
      else if (/^a\s*:/i.test(line)) a = line.replace(/^a\s*:/i, '').trim();
      else if (!q) q = line;
      else a = a ? `${a} ${line}` : line;
    }
    if (q || a) blocks.push({ q: q || 'FAQ', a });
  }
  return blocks;
}

export const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();
  const [config, setConfig] = useState<SupportConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get<any>(ApiEndpoints.common.support);
      const raw = res?.data?.data || res?.data || {};
      setConfig({
        phone: String(raw.phone || raw.Phone || ''),
        whatsApp: String(raw.whatsApp || raw.WhatsApp || ''),
        email: String(raw.email || raw.Email || ''),
        hours: String(raw.hours || raw.Hours || ''),
        faq: String(raw.faq || raw.Faq || ''),
      });
    } catch (e: any) {
      Alert.alert('Support Unavailable', e?.message || 'Could not load help & support details.');
      setConfig(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const openTel = async () => {
    const phone = digitsOnly(config?.phone || '');
    if (!phone) {
      Alert.alert('Not Configured', 'Support phone number is not set by admin yet.');
      return;
    }
    const url = `tel:${phone}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok || Platform.OS === 'web') await Linking.openURL(url);
      else Alert.alert('Dialer Unavailable', 'Cannot open phone dialer on this device.');
    } catch {
      Alert.alert('Error', 'Could not start the phone call.');
    }
  };

  const openWhatsApp = async () => {
    let phone = digitsOnly(config?.whatsApp || '');
    if (!phone) {
      Alert.alert('Not Configured', 'WhatsApp number is not set by admin yet.');
      return;
    }
    if (phone.length === 10) {
      phone = `91${phone}`;
    }
    const url = `https://wa.me/${phone}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open WhatsApp.');
    }
  };

  const openEmail = async () => {
    const email = String(config?.email || '').trim();
    if (!email || !email.includes('@')) {
      Alert.alert('Not Configured', 'Support email is not set by admin yet.');
      return;
    }
    const url = `mailto:${email}?subject=${encodeURIComponent('SuperApp Support')}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open email app.');
    }
  };

  const faqBlocks = parseFaqBlocks(config?.faq || '');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {language === 'hi' ? 'सहायता एवं समर्थन' : 'Help & Support'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={theme.primary}
            />
          }
        >
          {/* Operating Hours Card */}
          <View style={[styles.hoursCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}>
            <MaterialIcons name="schedule" size={20} color={theme.primary} />
            <View style={styles.hoursTextCol}>
              <Text style={[styles.hoursLabel, { color: theme.primary }]}>
                {language === 'hi' ? 'समर्थन समय' : 'SUPPORT HOURS'}
              </Text>
              <Text style={[styles.hoursValue, { color: theme.textPrimary }]}>
                {config?.hours || 'Contact us anytime'}
              </Text>
            </View>
          </View>

          {/* WhatsApp Support Hero Card */}
          <TouchableOpacity
            style={[
              styles.whatsAppCard,
              {
                backgroundColor: isDark ? 'rgba(37,211,102,0.12)' : '#F0FDF4',
                borderColor: isDark ? 'rgba(37,211,102,0.3)' : '#BBF7D0',
              },
              AppShadows.subtle,
            ]}
            onPress={openWhatsApp}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Chat on WhatsApp"
            testID="support-whatsapp-card"
          >
            <View style={styles.whatsAppCardIcon}>
              <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
            </View>
            <View style={styles.whatsAppCardContent}>
              <View style={styles.whatsAppCardTagRow}>
                <Text style={styles.whatsAppCardTag}>FASTEST RESPONSE</Text>
              </View>
              <Text style={[styles.whatsAppCardTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'व्हाट्सएप सहायता' : 'Chat on WhatsApp'}
              </Text>
              <Text style={[styles.whatsAppCardSub, { color: theme.textSecondary }]}>
                {config?.whatsApp || 'Instant support for rides, food & orders'}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#25D366" />
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: spacing.md }]}>
            {language === 'hi' ? 'अन्य संपर्क विकल्प' : 'Other Ways to Reach Us'}
          </Text>

          {/* Call Support */}
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}
            onPress={openTel}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.12)' }]}>
              <MaterialIcons name="call" size={20} color="#16A34A" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'फ़ोन कॉल' : 'Call Support'}
              </Text>
              <Text style={[styles.actionSub, { color: theme.textSecondary }]}>{config?.phone || 'Not configured'}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.textTertiary} />
          </TouchableOpacity>

          {/* Email Support */}
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}
            onPress={openEmail}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)' }]}>
              <MaterialIcons name="email" size={20} color="#2563EB" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'ईमेल भेजें' : 'Email Support'}
              </Text>
              <Text style={[styles.actionSub, { color: theme.textSecondary }]}>{config?.email || 'Not configured'}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.textTertiary} />
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: spacing.lg }]}>
            {language === 'hi' ? 'कानूनी एवं वैधानिक नीतियां' : 'Legal & Statutory Policies'}
          </Text>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}
            onPress={() => Linking.openURL('https://superapp-website-ashen.vercel.app/privacy-policy')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.12)' }]}>
              <MaterialIcons name="privacy-tip" size={20} color="#10B981" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'गोपनीयता नीति' : 'Privacy Policy'}
              </Text>
              <Text style={[styles.actionSub, { color: theme.textSecondary }]}>
                {language === 'hi' ? 'डेटा संग्रह, अनुमतियां एवं सुरक्षा' : 'Data collection, permissions & security'}
              </Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}
            onPress={() => Linking.openURL('https://superapp-website-ashen.vercel.app/terms-and-conditions')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)' }]}>
              <MaterialIcons name="description" size={20} color="#3B82F6" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'नियम एवं शर्तें' : 'Terms & Conditions'}
              </Text>
              <Text style={[styles.actionSub, { color: theme.textSecondary }]}>
                {language === 'hi' ? 'उपयोगकर्ता समझौता एवं शर्तें' : 'User agreement & terms of use'}
              </Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}
            onPress={() => Linking.openURL('https://superapp-website-ashen.vercel.app/refund-cancellation')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)' }]}>
              <MaterialIcons name="replay" size={20} color="#F59E0B" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'रिफंड एवं रद्दीकरण नीति' : 'Refund & Cancellation'}
              </Text>
              <Text style={[styles.actionSub, { color: theme.textSecondary }]}>
                {language === 'hi' ? 'रद्द की गई राइड और फूड ऑर्डर की नीति' : 'Policy on cancelled rides & food orders'}
              </Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}
            onPress={() => Linking.openURL('https://superapp-website-ashen.vercel.app/delete-account')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)' }]}>
              <MaterialIcons name="delete-forever" size={20} color="#EF4444" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'खाता हटाएं / डेटा निष्कासन' : 'Delete Account / Data Erasure'}
              </Text>
              <Text style={[styles.actionSub, { color: theme.textSecondary }]}>
                {language === 'hi' ? 'खाता हटाने का अनुरोध जमा करें' : 'Submit account & data deletion request'}
              </Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}
            onPress={() => Linking.openURL('https://superapp-website-ashen.vercel.app')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.12)' }]}>
              <MaterialIcons name="language" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'आधिकारिक वेबसाइट' : 'Official Website'}
              </Text>
              <Text style={[styles.actionSub, { color: theme.textSecondary }]}>superapp-website-ashen.vercel.app</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={theme.textTertiary} />
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: spacing.lg }]}>FAQ</Text>
          {faqBlocks.length === 0 ? (
            <Text style={[styles.emptyFaq, { color: theme.textTertiary }]}>
              {language === 'hi' ? 'कोई अक्सर पूछे जाने वाले प्रश्न उपलब्ध नहीं हैं।' : 'No FAQ configured by admin yet.'}
            </Text>
          ) : (
            faqBlocks.map((block, idx) => (
              <View
                key={`${idx}-${block.q}`}
                style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}
              >
                <Text style={[styles.faqQ, { color: theme.textPrimary }]}>{block.q}</Text>
                {block.a ? <Text style={[styles.faqA, { color: theme.textSecondary }]}>{block.a}</Text> : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h4,
    fontWeight: '700',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: AppRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 12,
  },
  hoursTextCol: { flex: 1 },
  hoursLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  hoursValue: { ...typography.bodyMedium, fontWeight: '600' },
  whatsAppCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: AppRadius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  whatsAppCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25D36620',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  whatsAppCardContent: {
    flex: 1,
  },
  whatsAppCardTagRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  whatsAppCardTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  whatsAppCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  whatsAppCardSub: {
    fontSize: 12,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: AppRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextCol: { flex: 1 },
  actionTitle: { ...typography.bodyLarge, fontWeight: '700' },
  actionSub: { ...typography.caption, marginTop: 2 },
  faqCard: {
    borderRadius: AppRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  faqQ: { ...typography.bodyLarge, fontWeight: '700', marginBottom: 6 },
  faqA: { ...typography.bodyMedium, lineHeight: 20 },
  emptyFaq: { ...typography.bodyMedium },
});
