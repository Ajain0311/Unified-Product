import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { hotelService } from '../../services/hotelService';
import { Hotel } from '../../models/hotel';
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';
import { AppSearchBar } from '../../components/common/AppSearchBar';

export const HotelHomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useAppTheme();
  const { t, language } = useLanguageStore();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');

  const fetchHotels = async () => {
    try {
      const data = await hotelService.getHotels();
      setHotels(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const cities = useMemo(() => {
    return ['All', ...Array.from(new Set(hotels.map((hotel) => hotel.city).filter(Boolean))).sort()];
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    let result = hotels.filter((h) => {
      const matchCity = selectedCity === 'All' || h.city.toLowerCase() === selectedCity.toLowerCase();

      const matchQuery =
        !searchQuery ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.tagline.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCity && matchQuery;
    });

    return result.sort((a, b) => b.userRating - a.userRating);
  }, [hotels, selectedCity, searchQuery]);

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

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {t('hotelTitle') || 'Luxury Stays & Resorts'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {t('hotelSubtitle') || 'Curated boutique hotels & verified stays'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('HotelMyBookings')}
          style={[styles.myBookingsBtn, { backgroundColor: theme.chipBg, borderColor: theme.cardBorder }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="briefcase-outline" size={19} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchHotels();
            }}
            tintColor={theme.primary}
          />
        }
      >
        {/* Anti No-Show Safeguard Guarantee Banner */}
        <View
          style={[
            styles.guaranteeBanner,
            { backgroundColor: isDark ? '#064E3B25' : '#ECFDF5', borderColor: '#10B98144' },
          ]}
        >
          <View style={styles.guaranteeIconWrap}>
            <Ionicons name="shield-checkmark" size={18} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: '#059669' }]}>
              {language === 'hi' ? 'नो-शो सुरक्षा और 100% रिफंड' : 'Anti-No-Show & 100% Room Assurance'}
            </Text>
            <Text style={[styles.bannerText, { color: theme.textSecondary }]}>
              {language === 'hi'
                ? 'शाम 6:00 बजे तक पे-एट-होटल होल्ड या टोकन एडवांस। कोई छिपे हुए शुल्क नहीं।'
                : 'Guaranteed room hold until 6:00 PM for Pay-at-Hotel with instant confirmation.'}
            </Text>
          </View>
        </View>

        {/* Global Search */}
        <View style={styles.searchWrapper}>
          <AppSearchBar
            placeholder={
              language === 'hi'
                ? 'होटल, शहर या रिसॉर्ट खोजें...'
                : 'Search resort, city, or boutique stay...'
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </View>

        {/* City Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityScroll}
        >
          {cities.map((c) => {
            const active = selectedCity === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedCity(c)}
                style={[
                  styles.cityPill,
                  {
                    backgroundColor: active ? theme.primary : theme.card,
                    borderColor: active ? theme.primary : theme.cardBorder,
                  },
                  AppShadows.subtle,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.cityPillText,
                    { color: active ? '#FFFFFF' : theme.textPrimary, fontWeight: active ? '700' : '500' },
                  ]}
                >
                  {c === 'All' ? (language === 'hi' ? 'सभी शहर' : 'All Destinations') : c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Hotel List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {language === 'hi' ? 'होटल लोड हो रहे हैं...' : 'Curating verified boutique stays...'}
            </Text>
          </View>
        ) : filteredHotels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bed-outline" size={44} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {language === 'hi' ? 'कोई होटल नहीं मिला' : 'No Stays Found'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {language === 'hi'
                ? 'कृपया दूसरा शहर या नाम खोजें।'
                : 'Try clearing your search query or selecting a different city.'}
            </Text>
          </View>
        ) : (
          filteredHotels.map((hotel) => (
            <TouchableOpacity
              key={hotel.id}
              activeOpacity={0.92}
              onPress={() => navigation.navigate('HotelDetail', { hotelId: hotel.id })}
              style={[
                styles.hotelCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                AppShadows.md,
              ]}
            >
              <View style={styles.imageWrap}>
                <Image
                  source={{ uri: hotel.featuredPhoto }}
                  style={styles.hotelImg}
                  resizeMode="cover"
                />

                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>{hotel.userRating.toFixed(1)}</Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.hotelName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {hotel.name}
                  </Text>
                  <View style={styles.priceColumn}>
                    <Text style={[styles.hotelPrice, { color: theme.primary }]}>
                      ₹{hotel.startingPricePerNight}
                    </Text>
                    <Text style={[styles.perNight, { color: theme.textTertiary }]}>
                      {language === 'hi' ? ' /रात' : ' /night'}
                    </Text>
                  </View>
                </View>

                <View style={styles.locRow}>
                  <Ionicons name="location-outline" size={13} color={theme.textTertiary} style={{ marginRight: 4 }} />
                  <Text style={[styles.locText, { color: theme.textSecondary }]} numberOfLines={1}>
                    {hotel.address}, {hotel.city}
                  </Text>
                </View>

                {/* Amenity tags */}
                <View style={styles.amenitiesRow}>
                  {hotel.amenities.slice(0, 3).map((a, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.amenityTag,
                        { backgroundColor: theme.chipBg, borderColor: theme.cardBorder },
                      ]}
                    >
                      <Text style={[styles.amenityTagText, { color: theme.textSecondary }]}>{a}</Text>
                    </View>
                  ))}
                  {hotel.amenities.length > 3 && (
                    <Text style={[styles.moreAmenities, { color: theme.textTertiary }]}>
                      +{hotel.amenities.length - 3} more
                    </Text>
                  )}
                </View>

                {/* Policy tags */}
                <View style={styles.policyRow}>
                  <View style={[styles.badgePill, { backgroundColor: '#10B98118' }]}>
                    <Ionicons name="checkmark-done" size={12} color="#10B981" />
                    <Text style={[styles.badgeText, { color: '#059669' }]}>
                      {hotel.cancellationPolicy.freeCancellationHoursBeforeCheckIn > 0
                        ? `${hotel.cancellationPolicy.freeCancellationHoursBeforeCheckIn}h Free Cancel`
                        : 'Instant Confirmation'}
                    </Text>
                  </View>
                  {hotel.payAtHotelPolicy.allowPayAtHotel && (
                    <View style={[styles.badgePill, { backgroundColor: '#3B82F618', marginLeft: 6 }]}>
                      <Ionicons name="cash-outline" size={12} color="#3B82F6" />
                      <Text style={[styles.badgeText, { color: '#2563EB' }]}>Pay at Hotel</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  myBookingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.md,
    paddingBottom: AppSpacing.huge,
  },
  guaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AppSpacing.md,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    marginBottom: AppSpacing.md,
  },
  guaranteeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: AppRadius.md,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bannerTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  bannerText: { fontSize: 11, lineHeight: 15 },
  searchWrapper: {
    marginBottom: AppSpacing.md,
  },
  cityScroll: {
    gap: AppSpacing.sm,
    marginBottom: AppSpacing.lg,
  },
  cityPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
  },
  cityPillText: { fontSize: 12 },
  centerContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 10, fontSize: 13 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { fontSize: 12, textAlign: 'center', marginTop: 4, paddingHorizontal: 30 },
  hotelCard: {
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    marginBottom: AppSpacing.lg,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  hotelImg: { width: '100%', height: '100%' },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AppRadius.pill,
    gap: 3,
  },
  ratingText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cardContent: { padding: AppSpacing.md },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  hotelName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  priceColumn: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hotelPrice: { fontSize: 16, fontWeight: '800' },
  perNight: { fontSize: 11, fontWeight: '500' },
  locRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  locText: { fontSize: 12, flex: 1 },
  amenitiesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 },
  amenityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AppRadius.xs,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 4,
  },
  amenityTagText: { fontSize: 10, fontWeight: '500' },
  moreAmenities: { fontSize: 10, marginLeft: 2 },
  policyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AppRadius.xs,
    gap: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
