import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';

interface BarVenue {
  id: string;
  name: string;
  tagline: string;
  rating: number;
  location: string;
  cover: string;
  badge: string;
  happyHours: string;
  category: 'Rooftops' | 'Craft Beer' | 'Live Music' | 'Cocktails';
  priceLevel: string;
}

const CURATED_BARS: BarVenue[] = [
  {
    id: 'bar-01',
    name: 'Skyline Rooftop Lounge & Bar',
    tagline: 'Artisanal cocktails with 360° panoramic city skyline views',
    rating: 4.8,
    location: 'Civil Lines, Jaipur',
    cover: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop',
    badge: 'Trending',
    happyHours: '4 PM - 8 PM',
    category: 'Rooftops',
    priceLevel: '₹₹₹',
  },
  {
    id: 'bar-02',
    name: 'The Malt House & Brewery',
    tagline: 'Freshly crafted Belgian wits, IPAs & live acoustic Friday jams',
    rating: 4.7,
    location: 'C-Scheme, Jaipur',
    cover: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop',
    badge: 'Microbrewery',
    happyHours: '5 PM - 9 PM',
    category: 'Craft Beer',
    priceLevel: '₹₹',
  },
  {
    id: 'bar-03',
    name: 'Velvet & Vines Speakeasy',
    tagline: 'Prohibition-era inspired hidden cellar with curated single malts',
    rating: 4.9,
    location: 'Malviya Nagar, Jaipur',
    cover: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop',
    badge: 'Exclusive',
    happyHours: '6 PM - 9 PM',
    category: 'Cocktails',
    priceLevel: '₹₹₹₹',
  },
  {
    id: 'bar-04',
    name: 'Echoes Jazz & Blues Club',
    tagline: 'Intimate candlelight tables, tapas & touring international artists',
    rating: 4.6,
    location: 'Tonk Road, Jaipur',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop',
    badge: 'Live Stage',
    happyHours: '4 PM - 7 PM',
    category: 'Live Music',
    priceLevel: '₹₹',
  },
];

const CATEGORIES = ['All', 'Rooftops', 'Craft Beer', 'Cocktails', 'Live Music'] as const;

export const BarHubScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredBars = CURATED_BARS.filter(
    (b) => selectedCategory === 'All' || b.category === selectedCategory
  );

  const handleReserve = (bar: BarVenue) => {
    Alert.alert(
      language === 'hi' ? 'टेबल आरक्षण' : 'VIP Table Reservation',
      language === 'hi'
        ? `${bar.name} में टेबल आरक्षित करने के लिए आपका अनुरोध दर्ज हो गया है। होटल टीम पुष्टि करेगी।`
        : `Your VIP table booking request for "${bar.name}" has been placed. Priority entry confirmation will arrive shortly.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.chipBg, borderColor: theme.cardBorder }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'बार्स और लाउंज' : 'Bars & Nightlife Lounges'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {language === 'hi'
              ? 'नाइटलाइफ़, कॉकटेल बार्स एवं वीआईपी रिजर्वेशन'
              : 'Premium craft breweries, speakeasies & VIP reservations'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* VIP Access Scrim Banner */}
        <View
          style={[
            styles.vipBanner,
            { backgroundColor: isDark ? '#581C8725' : '#FAF5FF', borderColor: '#7C3AED44' },
          ]}
        >
          <View style={styles.vipIconWrap}>
            <Ionicons name="wine" size={20} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.vipTitle, { color: '#7C3AED' }]}>
              {language === 'hi' ? 'वीआईपी टेबल और प्रायोरिटी एंट्री' : 'VIP Tables & Guest Passes'}
            </Text>
            <Text style={[styles.vipDesc, { color: theme.textSecondary }]}>
              {language === 'hi'
                ? 'कपल एंट्री, कॉर्पोरेट बुकिंग्स और वीकेंड लाइव म्यूजिक शो'
                : 'Skip the line, reserve private tables, and access curated craft brews.'}
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? '#7C3AED' : theme.card,
                    borderColor: active ? '#7C3AED' : theme.cardBorder,
                  },
                  AppShadows.subtle,
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: active ? '#FFFFFF' : theme.textPrimary, fontWeight: active ? '700' : '500' },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {language === 'hi' ? 'लोकप्रिय बार्स और क्लब्स' : 'Featured Nightlife Venues'}
        </Text>

        {filteredBars.map((item) => (
          <View
            key={item.id}
            style={[
              styles.barCard,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              AppShadows.md,
            ]}
          >
            <View style={styles.imageWrap}>
              <Image source={{ uri: item.cover }} style={styles.barCover} resizeMode="cover" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
              <View style={styles.pricePill}>
                <Text style={styles.priceText}>{item.priceLevel}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.row}>
                <Text style={[styles.barName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={11} color="#FFF" />
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
              </View>

              <Text style={[styles.barTagline, { color: theme.textSecondary }]} numberOfLines={2}>
                {item.tagline}
              </Text>

              <View style={styles.locRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={theme.textTertiary}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.locText, { color: theme.textTertiary }]}>{item.location}</Text>
              </View>

              <View style={styles.happyHourRow}>
                <Ionicons name="time-outline" size={13} color="#7C3AED" style={{ marginRight: 5 }} />
                <Text style={styles.happyHourText}>Happy Hours: {item.happyHours}</Text>
              </View>

              <TouchableOpacity
                style={styles.reserveBtn}
                onPress={() => handleReserve(item)}
                activeOpacity={0.88}
              >
                <Text style={styles.reserveBtnText}>
                  {language === 'hi' ? 'टेबल आरक्षित करें' : 'Reserve a Table'}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: AppSpacing.md,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  scrollContent: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.md,
    paddingBottom: AppSpacing.huge,
  },
  vipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AppSpacing.md,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    marginBottom: AppSpacing.md,
  },
  vipIconWrap: {
    width: 34,
    height: 34,
    borderRadius: AppRadius.md,
    backgroundColor: '#7C3AED20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  vipTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  vipDesc: { fontSize: 11, lineHeight: 15 },
  categoryScroll: {
    gap: AppSpacing.sm,
    marginBottom: AppSpacing.lg,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
  },
  filterPillText: { fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: AppSpacing.md },
  barCard: {
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    marginBottom: AppSpacing.lg,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 170,
    position: 'relative',
  },
  barCover: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AppRadius.xs,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  pricePill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AppRadius.xs,
  },
  priceText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  cardBody: { padding: AppSpacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  barName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: AppRadius.xs,
    gap: 3,
  },
  ratingText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  barTagline: { fontSize: 12, marginBottom: 8, lineHeight: 16 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locText: { fontSize: 12 },
  happyHourRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  happyHourText: { fontSize: 12, fontWeight: '600', color: '#7C3AED' },
  reserveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: AppRadius.md,
    backgroundColor: '#7C3AED',
    gap: 6,
  },
  reserveBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
