import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';
import { AppSearchBar } from '../../components/common/AppSearchBar';
import { RatingBadge } from '../../components/common/RatingBadge';
import { apiClient } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { FoodCatalogItem, RestaurantSummary } from '../../models/food';
import { useFocusEffect } from '@react-navigation/native';
import { absoluteImageUrl } from '../../services/documentService';
import { useCartStore } from '../../store/cartStore';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';

const DEFAULT_RESTAURANT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600';
const DEFAULT_DISH_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';

export function resolveRestaurantImage(url?: string): string {
  if (!url || !url.trim()) return DEFAULT_RESTAURANT_IMAGE;
  return absoluteImageUrl(url);
}

function resolveDishImage(url?: string): string {
  if (!url || !url.trim()) return DEFAULT_DISH_IMAGE;
  return absoluteImageUrl(url);
}

interface FoodHomeScreenProps {
  navigation: any;
}

export const DEFAULT_RESTAURANTS: RestaurantSummary[] = [
  {
    id: 1,
    name: 'Meghana Foods (Special Biryani)',
    cuisines: 'Biryani • Hyderabadi • Andhra • Kebabs',
    addressLine: '₹500 for two • 1.8 km',
    rating: 4.6,
    totalRatings: 1840,
    avgDeliveryTimeMinutes: 22,
    offerText: '60% OFF UPTO ₹120',
    isVeg: false,
    minOrderAmount: 200,
    deliveryFee: 0,
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600',
  },
  {
    id: 2,
    name: "Haldiram's Sweets & Thali",
    cuisines: 'North Indian • Chaat • Pure Veg • Mithai',
    addressLine: '₹350 for two • 1.2 km',
    rating: 4.5,
    totalRatings: 920,
    avgDeliveryTimeMinutes: 18,
    offerText: 'FLAT 20% OFF',
    isVeg: true,
    minOrderAmount: 150,
    deliveryFee: 0,
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600',
  },
  {
    id: 3,
    name: 'Burger King (Gourmet Burgers)',
    cuisines: 'Burgers • American • Fast Food • Shakes',
    addressLine: '₹400 for two • 2.5 km',
    rating: 4.3,
    totalRatings: 2150,
    avgDeliveryTimeMinutes: 25,
    offerText: 'FREE DELIVERY',
    isVeg: false,
    minOrderAmount: 150,
    deliveryFee: 0,
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
  },
  {
    id: 4,
    name: 'Sagar Ratna (Authentic South Indian)',
    cuisines: 'South Indian • Dosa • Idli • Filter Coffee • Pure Veg',
    addressLine: '₹300 for two • 1.5 km',
    rating: 4.7,
    totalRatings: 3420,
    avgDeliveryTimeMinutes: 20,
    offerText: 'FLAT 15% OFF',
    isVeg: true,
    minOrderAmount: 120,
    deliveryFee: 0,
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600',
  },
  {
    id: 5,
    name: 'Rolls King & Wraps',
    cuisines: 'Rolls • Kathi Rolls • Wraps • Fast Food',
    addressLine: '₹250 for two • 1.9 km',
    rating: 4.4,
    totalRatings: 1100,
    avgDeliveryTimeMinutes: 20,
    offerText: '20% OFF',
    isVeg: false,
    minOrderAmount: 100,
    deliveryFee: 0,
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600',
  },
];

const CATEGORIES = [
  'All',
  'Biryani',
  'North Indian',
  'South Indian',
  'Burgers',
  'Rolls',
  'Desserts',
];

export const FoodHomeScreen: React.FC<FoodHomeScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();

  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [filterRating4Plus, setFilterRating4Plus] = useState(false);
  const [filterFastDelivery, setFilterFastDelivery] = useState(false);
  const [filterOffers, setFilterOffers] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'deliveryTime' | 'default'>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<FoodCatalogItem[]>([]);
  const [deliverTo, setDeliverTo] = useState('Add delivery address');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  const loadFoods = () => {
    setIsLoading(true);
    setLoadError(null);
    apiClient
      .get<any>(ApiEndpoints.food.foods, { params: { page: 1, pageSize: 40 } })
      .then((res) => {
        const payload = res?.data ?? res;
        const items = payload?.items || payload;
        if (Array.isArray(items)) {
          setFoods(items);
        } else {
          setFoods([]);
        }
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.message || 'Unable to load dishes. Please check your network connection.';
        setLoadError(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadFoods();
  }, []);

  useFocusEffect(
    useCallback(() => {
      apiClient
        .get<any>(ApiEndpoints.common.addresses)
        .then((res) => {
          const payload = res?.data?.data ?? res?.data ?? res;
          const items = Array.isArray(payload) ? payload : [];
          const def = items.find((a: any) => a.isDefault) || items[0];
          if (def) {
            const line = [def.addressLine1, def.city].filter(Boolean).join(', ');
            setDeliverTo(line || 'Add delivery address');
          } else {
            setDeliverTo('Add delivery address');
          }
        })
        .catch(() => {
          setDeliverTo('Add delivery address');
        });
    }, [])
  );

  const filteredFoods = foods
    .filter((f) => {
      if (filterVegOnly && !f.isVeg) return false;
      if (filterRating4Plus && (f.restaurantRating || 0) < 4.0) return false;
      if (filterFastDelivery && (f.avgDeliveryTimeMinutes || 30) > 25) return false;
      if (filterOffers && !(f.discountPercent && f.discountPercent > 0)) return false;

      const activeCategory = CATEGORIES[selectedCategoryIndex];
      if (activeCategory && activeCategory !== 'All') {
        const catNorm = activeCategory.trim().toLowerCase();
        const hay = `${f.name} ${f.categoryName || ''} ${f.cuisines || ''} ${f.restaurantName || ''}`.toLowerCase();
        let matchesCategory = hay.includes(catNorm);
        if (!matchesCategory && catNorm === 'burgers') matchesCategory = hay.includes('burger');
        if (!matchesCategory && catNorm === 'rolls') matchesCategory = hay.includes('roll') || hay.includes('wrap');
        if (!matchesCategory && catNorm === 'desserts') {
          matchesCategory = hay.includes('dessert') || hay.includes('sweet') || hay.includes('mithai') || hay.includes('ice cream');
        }
        if (!matchesCategory) return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const hay = `${f.name} ${f.restaurantName} ${f.categoryName || ''} ${f.cuisines || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.restaurantRating || 0) - (a.restaurantRating || 0);
      }
      if (sortBy === 'deliveryTime') {
        return (a.avgDeliveryTimeMinutes || 30) - (b.avgDeliveryTimeMinutes || 30);
      }
      return 0;
    });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Location Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[
              styles.locationGroup,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              AppShadows.subtle,
            ]}
            onPress={() => navigation.navigate('SavedAddresses')}
            activeOpacity={0.8}
          >
            <View style={styles.locationIconBox}>
              <Ionicons name="location-sharp" size={17} color="#FF5A1F" />
            </View>
            <View style={styles.locationTextColumn}>
              <Text style={styles.deliverToCaption}>
                {language === 'hi' ? 'डिलीवरी पता' : 'DELIVER TO'}
              </Text>
              <View style={styles.cityRow}>
                <Text
                  style={[styles.cityName, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {deliverTo}
                </Text>
                <Ionicons name="chevron-down" size={14} color={theme.textTertiary} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cartIconButton,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              AppShadows.subtle,
            ]}
            onPress={() => {
              const rid = useCartStore.getState().restaurantId;
              if (rid) {
                navigation.navigate('RestaurantDetail', { restaurantId: String(rid) });
              } else {
                navigation.navigate('Profile');
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="bag-handle-outline" size={20} color={theme.textPrimary} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <AppSearchBar
            testID="food-search-input"
            placeholder={
              language === 'hi'
                ? 'रेस्तरां, बिरयानी, पिज़्ज़ा खोजें...'
                : 'Search dishes, restaurants, cuisines...'
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Quick Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {/* Rating 4.0+ */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: filterRating4Plus ? theme.primary : theme.card,
                borderColor: filterRating4Plus ? theme.primary : theme.cardBorder,
              },
              AppShadows.subtle,
            ]}
            onPress={() => setFilterRating4Plus(!filterRating4Plus)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="star"
              size={13}
              color={filterRating4Plus ? '#FFFFFF' : '#F59E0B'}
              style={styles.chipIcon}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: filterRating4Plus ? '#FFFFFF' : theme.textPrimary },
              ]}
            >
              Rating 4.0+
            </Text>
          </TouchableOpacity>

          {/* Fast Delivery */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: filterFastDelivery ? theme.primary : theme.card,
                borderColor: filterFastDelivery ? theme.primary : theme.cardBorder,
              },
              AppShadows.subtle,
            ]}
            onPress={() => setFilterFastDelivery(!filterFastDelivery)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flash"
              size={13}
              color={filterFastDelivery ? '#FFFFFF' : '#3B82F6'}
              style={styles.chipIcon}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: filterFastDelivery ? '#FFFFFF' : theme.textPrimary },
              ]}
            >
              Fast (≤25m)
            </Text>
          </TouchableOpacity>

          {/* Pure Veg */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: filterVegOnly ? theme.primary : theme.card,
                borderColor: filterVegOnly ? theme.primary : theme.cardBorder,
              },
              AppShadows.subtle,
            ]}
            onPress={() => setFilterVegOnly(!filterVegOnly)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="leaf"
              size={13}
              color={filterVegOnly ? '#FFFFFF' : '#10B981'}
              style={styles.chipIcon}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: filterVegOnly ? '#FFFFFF' : theme.textPrimary },
              ]}
            >
              Pure Veg
            </Text>
          </TouchableOpacity>

          {/* Offers */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: filterOffers ? theme.primary : theme.card,
                borderColor: filterOffers ? theme.primary : theme.cardBorder,
              },
              AppShadows.subtle,
            ]}
            onPress={() => setFilterOffers(!filterOffers)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="pricetag"
              size={13}
              color={filterOffers ? '#FFFFFF' : '#EC4899'}
              style={styles.chipIcon}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: filterOffers ? '#FFFFFF' : theme.textPrimary },
              ]}
            >
              Offers
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsRow}
        >
          {CATEGORIES.map((cat, index) => {
            const isSelected = index === selectedCategoryIndex;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                  },
                  AppShadows.subtle,
                ]}
                onPress={() => setSelectedCategoryIndex(index)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.textPrimary }]}>
            POPULAR DISHES ({filteredFoods.length})
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (sortBy === 'default') setSortBy('rating');
              else if (sortBy === 'rating') setSortBy('deliveryTime');
              else setSortBy('default');
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.sortByText, { color: theme.primary }]}>
              Sort: {sortBy === 'rating' ? 'Rating ★' : sortBy === 'deliveryTime' ? 'Time ⏱' : 'Default'} ▼
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: 12, color: theme.textSecondary, fontSize: 13 }}>
              Finding great dishes near you...
            </Text>
          </View>
        )}

        {/* Error State */}
        {loadError && !isLoading && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
            <Ionicons name="alert-circle-outline" size={44} color={theme.error} />
            <Text style={{ marginTop: 12, color: theme.error, textAlign: 'center', fontSize: 13 }}>
              {loadError}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={loadFoods}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !loadError && filteredFoods.length === 0 && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <Ionicons name="fast-food-outline" size={44} color={theme.textTertiary} />
            <Text style={{ marginTop: 12, color: theme.textPrimary, fontSize: 15, fontWeight: '700' }}>
              No dishes found
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
              Try adjusting your filters or search query.
            </Text>
          </View>
        )}

        {/* Food Dish Cards */}
        {filteredFoods.map((food) => (
          <TouchableOpacity
            key={`${food.restaurantId}-${food.id}`}
            style={[
              styles.restaurantCard,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              AppShadows.subtle,
            ]}
            activeOpacity={0.9}
            accessibilityRole="button"
            testID={`food-card-${food.id}`}
            onPress={() =>
              navigation.navigate('RestaurantDetail', {
                restaurantId: food.restaurantId.toString(),
              })
            }
          >
            <View style={styles.imageHeader}>
              <Image
                source={{ uri: resolveDishImage(food.imageUrl || food.restaurantImageUrl) }}
                style={styles.restaurantImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.75)']}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.deliveryTimeBadge}>
                <Ionicons name="time" size={12} color="#FFFFFF" />
                <Text style={styles.deliveryTimeText}>
                  {food.avgDeliveryTimeMinutes || 20} mins
                </Text>
              </View>

              {food.isVeg && (
                <View style={styles.pureVegTag}>
                  <Ionicons name="leaf" size={11} color="#FFFFFF" />
                  <Text style={styles.pureVegTagText}>PURE VEG</Text>
                </View>
              )}

              <View style={styles.offerBanner}>
                <Ionicons name="pricetag" size={11} color="#FFFFFF" />
                <Text style={styles.offerBannerText}>
                  {food.discountPercent && food.discountPercent > 0
                    ? `${food.discountPercent}% OFF`
                    : food.isBestseller
                      ? 'BESTSELLER'
                      : 'ORDER NOW'}
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.nameRatingRow}>
                <Text style={[styles.restaurantName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {food.name}
                </Text>
                <RatingBadge rating={food.restaurantRating} />
              </View>

              <Text style={[styles.cuisinesText, { color: theme.textTertiary }]} numberOfLines={1}>
                {food.restaurantName}
                {food.categoryName ? ` • ${food.categoryName}` : ''}
              </Text>

              <View style={styles.bottomInfoRow}>
                <View style={styles.priceContainer}>
                  <Text style={[styles.priceForTwoText, { color: theme.textPrimary }]}>
                    ₹{Number(food.discountedPrice || food.basePrice || 0).toFixed(0)}
                  </Text>
                  {food.basePrice && food.discountedPrice && food.basePrice > food.discountedPrice ? (
                    <Text style={[styles.basePriceStrike, { color: theme.textTertiary }]}>
                      ₹{Number(food.basePrice).toFixed(0)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.viewMenuLink}>
                  <Text style={[styles.viewMenuText, { color: theme.primary }]}>View Menu</Text>
                  <Ionicons name="arrow-forward" size={12} color={theme.primary} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={[
            styles.floatingCartBar,
            { backgroundColor: theme.primary },
            AppShadows.float,
          ]}
          onPress={() => {
            const rid = useCartStore.getState().restaurantId;
            if (rid) {
              navigation.navigate('RestaurantDetail', { restaurantId: String(rid) });
            }
          }}
          activeOpacity={0.9}
        >
          <View style={styles.cartBarContent}>
            <View style={styles.cartBarLeft}>
              <View style={styles.cartCountPill}>
                <Text style={styles.cartCountPillText}>{cartCount}</Text>
              </View>
              <Text style={styles.cartBarLabel}>View Food Cart</Text>
            </View>
            <View style={styles.cartBarRight}>
              <Text style={styles.cartBarAction}>Checkout</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    paddingBottom: 80,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppSpacing.md,
    gap: AppSpacing.sm,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
  },
  locationIconBox: {
    width: 32,
    height: 32,
    borderRadius: AppRadius.md,
    backgroundColor: '#FF5A1F18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  locationTextColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  deliverToCaption: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF5A1F',
    letterSpacing: 0.8,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  cityName: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
    maxWidth: '85%',
  },
  cartIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  searchWrapper: {
    marginBottom: AppSpacing.md,
  },
  filterChipsRow: {
    gap: AppSpacing.sm,
    marginBottom: AppSpacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
  },
  chipIcon: {
    marginRight: 5,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPillsRow: {
    gap: AppSpacing.sm,
    marginBottom: AppSpacing.md,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppSpacing.md,
    marginTop: AppSpacing.xs,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sortByText: {
    fontSize: 12,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: AppRadius.sm,
  },
  restaurantCard: {
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: AppSpacing.md,
  },
  imageHeader: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  deliveryTimeBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AppRadius.sm,
    gap: 4,
  },
  deliveryTimeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  pureVegTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: AppRadius.xs,
    gap: 3,
  },
  pureVegTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  offerBanner: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5A1F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AppRadius.sm,
    gap: 4,
  },
  offerBannerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  infoSection: {
    padding: AppSpacing.md,
  },
  nameRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  cuisinesText: {
    fontSize: 12,
    marginBottom: 8,
  },
  bottomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceForTwoText: {
    fontSize: 15,
    fontWeight: '800',
  },
  basePriceStrike: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  viewMenuLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewMenuText: {
    fontSize: 12,
    fontWeight: '700',
  },
  floatingCartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: AppRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cartBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartCountPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountPillText: {
    color: '#FF5A1F',
    fontSize: 12,
    fontWeight: '800',
  },
  cartBarLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cartBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cartBarAction: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
