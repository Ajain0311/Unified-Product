import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
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
    const list = ['All'];
    hotels.forEach((h) => {
      if (h.city && !list.includes(h.city)) {
        list.push(h.city);
      }
    });
    return list;
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      const matchCity = selectedCity === 'All' || h.city.toLowerCase() === selectedCity.toLowerCase();
      const matchQuery =
        !searchQuery ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCity && matchQuery;
    });
  }, [hotels, selectedCity, searchQuery]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.surfaceHover }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('hotelTitle')}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {t('hotelSubtitle')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('HotelMyBookings')}
          style={[styles.myBookingsBtn, { backgroundColor: theme.surfaceHover }]}
        >
          <Ionicons name="briefcase-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        {/* Anti No-Show Safeguard Banner */}
        <View style={[styles.guaranteeBanner, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '40' }]}>
          <Ionicons name="shield-checkmark" size={22} color={theme.primary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: theme.primary }]}>
              {language === 'hi' ? 'नो-शो सुरक्षा और 100% रिफंड' : 'Anti-No-Show & 100% Assurance'}
            </Text>
            <Text style={[styles.bannerText, { color: theme.textSecondary }]}>
              {language === 'hi'
                ? 'शाम 6:00 बजे तक पे-एट-होटल होल्ड या टोकन एडवांस। कोई छिपे हुए शुल्क नहीं।'
                : 'Guaranteed room hold until 6:00 PM for Pay-at-Hotel or zero cancellation on eligible dates.'}
            </Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={20} color={theme.textTertiary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder={t('hotelSearchPlaceholder')}
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.textPrimary }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* City Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityScroll}>
          {cities.map((c) => {
            const active = selectedCity === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedCity(c)}
                style={[
                  styles.cityPill,
                  {
                    backgroundColor: active ? theme.primary : theme.surface,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cityPillText,
                    { color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: active ? '700' : '500' },
                  ]}
                >
                  {c === 'All' ? (language === 'hi' ? 'सभी शहर' : 'All Cities') : c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Hotel list */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {language === 'hi' ? 'होटल लोड हो रहे हैं...' : 'Loading verified hotels...'}
            </Text>
          </View>
        ) : filteredHotels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bed-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {language === 'hi' ? 'कोई होटल नहीं मिला' : 'No Hotels Found'}
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
              activeOpacity={0.88}
              onPress={() => navigation.navigate('HotelDetail', { hotelId: hotel.id })}
              style={[styles.hotelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Image source={{ uri: hotel.featuredPhoto }} style={styles.hotelImg} resizeMode="cover" />
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{hotel.userRating.toFixed(1)}</Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.hotelName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {hotel.name}
                  </Text>
                  <Text style={[styles.hotelPrice, { color: theme.primary }]}>
                    ₹{hotel.startingPricePerNight}
                    <Text style={[styles.perNight, { color: theme.textSecondary }]}>
                      {language === 'hi' ? ' /रात' : ' /night'}
                    </Text>
                  </Text>
                </View>

                <View style={styles.locRow}>
                  <Ionicons name="location-outline" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.locText, { color: theme.textSecondary }]} numberOfLines={1}>
                    {hotel.address}, {hotel.city}
                  </Text>
                </View>

                {/* Amenity tags */}
                <View style={styles.amenitiesRow}>
                  {hotel.amenities.slice(0, 3).map((a, idx) => (
                    <View
                      key={idx}
                      style={[styles.amenityTag, { backgroundColor: theme.surfaceHover, borderColor: theme.border }]}
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
                  <View style={[styles.badgePill, { backgroundColor: '#10B98120' }]}>
                    <Ionicons name="checkmark-done" size={12} color="#10B981" />
                    <Text style={[styles.badgeText, { color: '#10B981' }]}>
                      {hotel.cancellationPolicy.freeCancellationHoursBeforeCheckIn > 0
                        ? `${hotel.cancellationPolicy.freeCancellationHoursBeforeCheckIn}h Free Cancel`
                        : 'Instant Confirmation'}
                    </Text>
                  </View>
                  {hotel.payAtHotelPolicy.allowPayAtHotel && (
                    <View style={[styles.badgePill, { backgroundColor: '#3B82F620', marginLeft: 8 }]}>
                      <Ionicons name="cash-outline" size={12} color="#3B82F6" />
                      <Text style={[styles.badgeText, { color: '#3B82F6' }]}>Pay at Hotel</Text>
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
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  myBookingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  guaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  bannerText: { fontSize: 11, lineHeight: 15 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14 },
  cityScroll: { marginBottom: 16 },
  cityPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  cityPillText: { fontSize: 13 },
  centerContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 10, fontSize: 14 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', marginTop: 4, paddingHorizontal: 30 },
  hotelCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  hotelImg: { width: '100%', height: 170 },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: { color: '#FFF', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  cardContent: { padding: 14 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  hotelName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  hotelPrice: { fontSize: 16, fontWeight: '800' },
  perNight: { fontSize: 11, fontWeight: '400' },
  locRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locText: { fontSize: 12, flex: 1 },
  amenitiesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  amenityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 4,
  },
  amenityTagText: { fontSize: 11 },
  moreAmenities: { fontSize: 11, marginLeft: 2 },
  policyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
});
