import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { hotelService } from '../../services/hotelService';
import { Hotel, HotelRoom } from '../../models/hotel';

export const HotelDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'HotelDetail'>>();
  const { hotelId } = route.params;

  const { theme, isDark } = useAppTheme();
  const { t, language } = useLanguageStore();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const h = await hotelService.getHotelById(hotelId);
        const r = await hotelService.getRoomsByHotel(hotelId);
        setHotel(h);
        setRooms(r);
      } catch {
        Alert.alert('Error', 'Unable to load hotel information');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [hotelId]);

  if (loading || !hotel) {
    return (
      <SafeAreaView style={[styles.centerArea, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  const photos = hotel.photos.length > 0 ? hotel.photos : [hotel.featuredPhoto];

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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          {hotel.name}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('HotelMyBookings')}
          style={[styles.backBtn, { backgroundColor: theme.surfaceHover }]}
        >
          <Ionicons name="receipt-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Gallery Carousel */}
        <View style={styles.imageGallery}>
          <Image source={{ uri: photos[selectedPhotoIndex] }} style={styles.mainImage} resizeMode="cover" />
          <View style={styles.starsTag}>
            {Array.from({ length: hotel.starRating }).map((_, i) => (
              <Ionicons key={i} name="star" size={14} color="#F59E0B" style={{ marginRight: 2 }} />
            ))}
          </View>
        </View>

        {photos.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
            {photos.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedPhotoIndex(idx)}
                style={[
                  styles.thumbWrapper,
                  { borderColor: selectedPhotoIndex === idx ? theme.primary : 'transparent' },
                ]}
              >
                <Image source={{ uri: p }} style={styles.thumbImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Info card */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.nameText, { color: theme.textPrimary }]}>{hotel.name}</Text>
          <Text style={[styles.taglineText, { color: theme.textSecondary }]}>{hotel.tagline}</Text>

          <View style={styles.locRow}>
            <Ionicons name="location" size={16} color={theme.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.locText, { color: theme.textPrimary }]}>
              {hotel.address}, {hotel.city}
            </Text>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFF" />
              <Text style={styles.ratingNum}>{hotel.userRating.toFixed(1)}</Text>
            </View>
            <Text style={[styles.ratingReviews, { color: theme.textSecondary }]}>
              ({hotel.totalReviews} {language === 'hi' ? 'समीक्षाएं' : 'verified reviews'})
            </Text>
          </View>
        </View>

        {/* Cancellation & No-Show Guarantee Policy */}
        <View style={[styles.policyCard, { backgroundColor: '#10B98112', borderColor: '#10B98130' }]}>
          <View style={styles.policyHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
            <Text style={[styles.policyTitle, { color: '#10B981' }]}>
              {hotel.cancellationPolicy.title}
            </Text>
          </View>
          <Text style={[styles.policyDesc, { color: theme.textSecondary }]}>
            {hotel.cancellationPolicy.description}
          </Text>
          {hotel.payAtHotelPolicy.allowPayAtHotel && (
            <View style={styles.noShowNotice}>
              <Ionicons name="time-outline" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
              <Text style={[styles.noShowText, { color: theme.textSecondary }]}>
                {language === 'hi'
                  ? `पे-एट-होटल चेक-इन दिन शाम ${hotel.payAtHotelPolicy.holdCutoffHour}:00 बजे तक आरक्षित रहता है।`
                  : `Pay-at-hotel rooms are held until ${hotel.payAtHotelPolicy.holdCutoffHour}:00 PM on check-in day.`}
              </Text>
            </View>
          )}
        </View>

        {/* Amenities */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'सुविधाएं और सेवाएं' : 'Amenities & Highlights'}
          </Text>
          <View style={styles.amenitiesGrid}>
            {hotel.amenities.map((item, idx) => (
              <View key={idx} style={[styles.amenityChip, { backgroundColor: theme.surfaceHover }]}>
                <Ionicons name="checkmark-circle" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.amenityChipText, { color: theme.textPrimary }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Select Room */}
        <Text style={[styles.roomsHeading, { color: theme.textPrimary }]}>
          {language === 'hi' ? 'कमरे चुनें' : 'Available Rooms'}
        </Text>

        {rooms.map((room) => (
          <View
            key={room.id}
            style={[styles.roomCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            {room.photos.length > 0 && (
              <Image source={{ uri: room.photos[0] }} style={styles.roomImage} resizeMode="cover" />
            )}
            <View style={styles.roomDetails}>
              <Text style={[styles.roomName, { color: theme.textPrimary }]}>{room.name}</Text>
              <Text style={[styles.roomDescription, { color: theme.textSecondary }]}>
                {room.description}
              </Text>

              <View style={styles.roomSpecs}>
                <View style={styles.specItem}>
                  <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.specText, { color: theme.textSecondary }]}>Max {room.maxGuests} Guests</Text>
                </View>
                <View style={styles.specItem}>
                  <Ionicons name="bed-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.specText, { color: theme.textSecondary }]}>{room.bedType}</Text>
                </View>
                <View style={styles.specItem}>
                  <Ionicons name="expand-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.specText, { color: theme.textSecondary }]}>{room.roomSizeSqFt} sq ft</Text>
                </View>
              </View>

              <View style={styles.roomActionRow}>
                <View>
                  <Text style={[styles.roomPrice, { color: theme.primary }]}>
                    ₹{room.basePricePerNight}
                    <Text style={[styles.roomPriceSub, { color: theme.textSecondary }]}> /night</Text>
                  </Text>
                  <Text style={[styles.taxNote, { color: theme.textTertiary }]}>
                    +{room.taxPercentage}% taxes & fees
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('HotelCheckout', {
                      hotelId: hotel.id,
                      roomId: room.id,
                    })
                  }
                  style={[styles.bookBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.bookBtnText}>{t('bookNow')}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centerArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    marginRight: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  imageGallery: { position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  mainImage: { width: '100%', height: 220 },
  starsTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  thumbScroll: { marginBottom: 14 },
  thumbWrapper: { width: 64, height: 50, borderRadius: 8, borderWidth: 2, marginRight: 8, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
  sectionCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  nameText: { fontSize: 19, fontWeight: '800', marginBottom: 4 },
  taglineText: { fontSize: 13, marginBottom: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  locText: { fontSize: 13, flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#047857',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  ratingNum: { color: '#FFF', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  ratingReviews: { fontSize: 12 },
  policyCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  policyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  policyTitle: { fontSize: 14, fontWeight: '700', marginLeft: 6 },
  policyDesc: { fontSize: 12, lineHeight: 18 },
  noShowNotice: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  noShowText: { fontSize: 12, flex: 1 },
  sectionHeading: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityChipText: { fontSize: 12 },
  roomsHeading: { fontSize: 18, fontWeight: '800', marginTop: 10, marginBottom: 12 },
  roomCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  roomImage: { width: '100%', height: 160 },
  roomDetails: { padding: 14 },
  roomName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  roomDescription: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  roomSpecs: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 },
  specItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 4 },
  specText: { fontSize: 12, marginLeft: 4 },
  roomActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomPrice: { fontSize: 18, fontWeight: '800' },
  roomPriceSub: { fontSize: 12, fontWeight: '400' },
  taxNote: { fontSize: 10, marginTop: 1 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginRight: 6 },
});
