import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';

export const BarHubScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();

  const curatedBars = [
    {
      id: 'bar-01',
      name: 'Skyline Rooftop Lounge & Bar',
      tagline: 'Artisanal cocktails with panoramic city views',
      rating: 4.8,
      location: 'Civil Lines, Jaipur',
      cover: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop',
      badge: 'Trending',
      happyHours: '4 PM - 8 PM',
    },
    {
      id: 'bar-02',
      name: 'The Malt House & Brewery',
      tagline: 'Freshly crafted lagers, IPAs & live acoustic nights',
      rating: 4.7,
      location: 'C-Scheme, Jaipur',
      cover: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop',
      badge: 'Microbrewery',
      happyHours: '5 PM - 9 PM',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.surfaceHover }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'बार्स और लाउंज' : 'Bars, Pubs & Lounges'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {language === 'hi' ? 'नाइटलाइफ़, कॉकटेल बार्स एवं टेबल रिजर्वेशन' : 'Nightlife experiences & VIP reservations'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={[styles.vipBanner, { backgroundColor: '#7C3AED18', borderColor: '#7C3AED40' }]}>
          <Ionicons name="wine" size={24} color="#7C3AED" style={{ marginRight: 10 }} />
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

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {language === 'hi' ? 'लोकप्रिय बार्स और क्लब्स' : 'Featured Nightlife Venues'}
        </Text>

        {curatedBars.map((item) => (
          <View
            key={item.id}
            style={[styles.barCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Image source={{ uri: item.cover }} style={styles.barCover} resizeMode="cover" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.row}>
                <Text style={[styles.barName, { color: theme.textPrimary }]}>{item.name}</Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#FFF" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>

              <Text style={[styles.barTagline, { color: theme.textSecondary }]}>{item.tagline}</Text>

              <View style={styles.locRow}>
                <Ionicons name="location-outline" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.locText, { color: theme.textSecondary }]}>{item.location}</Text>
              </View>

              <View style={styles.happyHourRow}>
                <Ionicons name="time-outline" size={14} color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={[styles.happyHourText, { color: '#7C3AED' }]}>Happy Hours: {item.happyHours}</Text>
              </View>

              <TouchableOpacity style={[styles.reserveBtn, { backgroundColor: '#7C3AED' }]}>
                <Text style={styles.reserveBtnText}>
                  {language === 'hi' ? 'टेबल आरक्षित करें' : 'Reserve a Table'}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  vipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  vipTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  vipDesc: { fontSize: 12, lineHeight: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  barCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  barCover: { width: '100%', height: 160 },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  barName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: { color: '#FFF', fontSize: 11, fontWeight: '700', marginLeft: 3 },
  barTagline: { fontSize: 12, marginBottom: 8 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locText: { fontSize: 12 },
  happyHourRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  happyHourText: { fontSize: 12, fontWeight: '600' },
  reserveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  reserveBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700', marginRight: 6 },
});
