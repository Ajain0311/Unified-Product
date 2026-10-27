import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';

export const BeverageHubScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();

  const beverageCategories = [
    { title: 'Artisan Coffee', icon: 'cafe', count: '14 Cafes' },
    { title: 'Fresh Juices & Smoothies', icon: 'nutrition', count: '9 Outlets' },
    { title: 'Boba & Bubble Tea', icon: 'water', count: '6 Spots' },
    { title: 'Kombucha & Mocktails', icon: 'wine', count: '8 Bars' },
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
            {language === 'hi' ? 'कैफे और पेय' : 'Beverages & Specialty Brews'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {language === 'hi' ? 'स्पेशलिटी कॉफी, शेक्स एवं ताज़ा जूस' : 'Hand-crafted coffees, smoothies & juices'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: '#0891B218', borderColor: '#0891B240' }]}>
          <Ionicons name="cafe" size={24} color="#0891B2" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: '#0891B2' }]}>
              {language === 'hi' ? 'ताज़ा और त्वरित पिकअप' : 'Fresh & Quick Brews'}
            </Text>
            <Text style={[styles.bannerDesc, { color: theme.textSecondary }]}>
              {language === 'hi'
                ? 'अपने पसंदीदा कैफे से अग्रिम ऑर्डर करें और काउंटर पर बिना प्रतीक्षा के उठाएं।'
                : 'Order ahead for express barista pick-up or fast 20-min chilled delivery.'}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {language === 'hi' ? 'श्रेणियां' : 'Beverage Collections'}
        </Text>

        <View style={styles.grid}>
          {beverageCategories.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.catCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: '#0891B220' }]}>
                <Ionicons name={cat.icon as any} size={24} color="#0891B2" />
              </View>
              <Text style={[styles.catTitle, { color: theme.textPrimary }]}>{cat.title}</Text>
              <Text style={[styles.catCount, { color: theme.textSecondary }]}>{cat.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  scrollContent: { padding: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  bannerDesc: { fontSize: 12, lineHeight: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  catCard: {
    width: '48%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  catTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  catCount: { fontSize: 11 },
});
