import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/spacing';
import { AppSearchBar } from '../../components/common/AppSearchBar';
import { MarqueeText } from '../../components/common/MarqueeText';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { BUSINESS_MODULES } from '../../config/businessModules';
import { apiClient } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { AppEnvironment } from '../../config/environment';
import { RestaurantSummary, FoodItem } from '../../models/food';
import { ListingSummary } from '../../models/marketplace';
import { DEFAULT_RESTAURANTS, resolveRestaurantImage } from '../food/FoodHomeScreen';

const SCREEN_WIDTH = typeof Dimensions !== 'undefined' && Dimensions.get ? (Dimensions.get('window')?.width || 375) : 375;

function parseBroadcastExpiry(referenceId: unknown): Date | null {
  const raw = String(referenceId ?? '').trim();
  if (!raw.toLowerCase().startsWith('exp:')) return null;
  const iso = raw.slice(4);
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isBroadcastStillVisible(
  n: any,
  nowMs: number,
  defaultDisplayHours: number,
): boolean {
  const expiry = parseBroadcastExpiry(n.referenceId ?? n.ReferenceId);
  if (expiry) return expiry.getTime() > nowMs;
  const createdRaw = n.createdAt ?? n.CreatedAt;
  const created = createdRaw ? new Date(createdRaw) : null;
  if (!created || Number.isNaN(created.getTime())) return true;
  const fallbackMs = created.getTime() + Math.max(1, defaultDisplayHours) * 3600_000;
  return fallbackMs > nowMs;
}

function resolveBannerImage(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = AppEnvironment.hubBaseUrl.replace(/\/$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

export function resolveDeliveryAddress(payload: any): string {
  const items = Array.isArray(payload) ? payload : [];
  if (items.length > 0) {
    const def = items.find((a: any) => a.isDefault) || items[0];
    const line = [def.addressLine1, def.city].filter(Boolean).join(', ');
    return line || 'Select Delivery Address';
  }
  return 'Select Delivery Address';
}

interface HomeScreenProps {
  navigation: any;
}

export interface TodayDealItem {
  id: number;
  restaurantId: number;
  restaurantName: string;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  discountedPrice: number;
  discountPercent: number;
  isVeg: boolean;
  isCustomizable: boolean;
  tag: string;
}

const CUISINE_RECOMMENDATIONS = [
  { id: 'biryani', name: 'Biryani', icon: 'flame', count: '14+ spots', color: '#F97316' },
  { id: 'north_indian', name: 'North Indian', icon: 'restaurant', count: '22+ spots', color: '#10B981' },
  { id: 'south_indian', name: 'South Indian', icon: 'leaf', count: '12+ spots', color: '#06B6D4' },
  { id: 'burgers', name: 'Burgers & Pizza', icon: 'fast-food', count: '18+ spots', color: '#EF4444' },
  { id: 'desserts', name: 'Sweets & Bakes', icon: 'ice-cream', count: '15+ spots', color: '#EC4899' },
  { id: 'cafe', name: 'Coffee & Chai', icon: 'cafe', count: '10+ spots', color: '#8B5CF6' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const addItemToCart = useCartStore((state) => state.addItem);
  const { theme, isDark, toggleTheme } = useAppTheme();
  const { language, toggleLanguage, t } = useLanguageStore();

  const [activeRide, setActiveRide] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [deliverTo, setDeliverTo] = useState<string>('Select Delivery Address');
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>(DEFAULT_RESTAURANTS);
  const [todayDeals, setTodayDeals] = useState<TodayDealItem[]>([]);
  const [bazaarListings, setBazaarListings] = useState<ListingSummary[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [homeAnnouncement, setHomeAnnouncement] = useState<{
    id: string;
    title: string;
    body: string;
  } | null>(null);
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<string | null>(null);

  // Multi-Category Search Overlay State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'ALL' | 'FOOD' | 'BAZAAR'>('ALL');
  const [searchLoading, setSearchLoading] = useState(false);
  const [foodPool, setFoodPool] = useState<any[]>([]);
  const [bazaarPool, setBazaarPool] = useState<any[]>([]);

  const loadHomeData = useCallback(async () => {
    try {
      const [bannersRes, restsRes, listingsRes, ridesRes, notifsRes, supportRes] = await Promise.allSettled([
        apiClient.get<any>(ApiEndpoints.common.banners),
        apiClient.get<any>(ApiEndpoints.food.restaurants),
        apiClient.get<any>(ApiEndpoints.marketplace.listings),
        apiClient.get<any>(ApiEndpoints.ride.myRides),
        apiClient.get<any>(ApiEndpoints.common.notifications),
        apiClient.get<any>(ApiEndpoints.common.support),
      ]);

      let defaultDisplayHours = 24;
      if (supportRes.status === 'fulfilled') {
        const supportPayload = supportRes.value?.data?.data || supportRes.value?.data;
        const hours = Number(
          supportPayload?.broadcastDefaultDisplayHours ?? supportPayload?.BroadcastDefaultDisplayHours,
        );
        if (Number.isFinite(hours) && hours > 0) {
          defaultDisplayHours = Math.min(168, Math.max(1, Math.round(hours)));
        }
      }

      // Announcements / Broadcasts
      if (notifsRes.status === 'fulfilled') {
        const raw = notifsRes.value?.data?.data || notifsRes.value?.data;
        const items = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : [];
        const isUnread = (n: any) => !(n.isRead ?? n.IsRead ?? false);
        const unread = items.filter((n: any) => n && isUnread(n)).length;
        setUnreadNotifCount(unread);

        const nowMs = Date.now();
        const broadcastTypes = new Set(['SYSTEM', 'CUSTOMER', 'ANNOUNCEMENT', 'BROADCAST']);
        const latestBroadcast = items.find((n: any) => {
          if (!n) return false;
          const type = String(n.type || n.Type || '').toUpperCase();
          if (!broadcastTypes.has(type)) return false;
          return isBroadcastStillVisible(n, nowMs, defaultDisplayHours);
        });
        if (latestBroadcast) {
          const id = String(latestBroadcast.id ?? latestBroadcast.Id);
          if (dismissedAnnouncementId && id === dismissedAnnouncementId) {
            setHomeAnnouncement(null);
          } else {
            setHomeAnnouncement({
              id,
              title: String(latestBroadcast.title || latestBroadcast.Title || 'Announcement'),
              body: String(latestBroadcast.body || latestBroadcast.Body || latestBroadcast.message || ''),
            });
          }
        } else {
          setHomeAnnouncement(null);
        }
      }

      // Banners
      if (bannersRes.status === 'fulfilled') {
        const data = bannersRes.value?.data?.data || bannersRes.value?.data;
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data);
        }
      }

      // Restaurants & Deals
      let loadedRests: RestaurantSummary[] = DEFAULT_RESTAURANTS;
      if (restsRes.status === 'fulfilled') {
        const payload = restsRes.value?.data?.data || restsRes.value?.data;
        const items = payload?.items || payload;
        if (Array.isArray(items) && items.length > 0) {
          loadedRests = items;
          setRestaurants(items);
        }
      }

      if (loadedRests.length > 0) {
        const topRest = loadedRests[0];
        try {
          const detailRes = await apiClient.get<any>(ApiEndpoints.food.restaurantDetail(topRest.id));
          const detailData = detailRes?.data?.data || detailRes?.data;
          if (detailData && Array.isArray(detailData.categories)) {
            const deals: TodayDealItem[] = [];
            for (const cat of detailData.categories) {
              const catItems: FoodItem[] = cat.items || [];
              for (const item of catItems) {
                if (item.isAvailable) {
                  const discountPct = Number(item.discountPercent) || 0;
                  const isDealOrCombo =
                    item.isBestseller ||
                    discountPct > 0 ||
                    item.name.toLowerCase().includes('combo') ||
                    item.name.toLowerCase().includes('thali') ||
                    item.name.toLowerCase().includes('special');

                  if (isDealOrCombo && deals.length < 6) {
                    deals.push({
                      id: item.id,
                      restaurantId: topRest.id,
                      restaurantName: detailData.name || topRest.name,
                      name: item.name,
                      description: item.description || '',
                      imageUrl: item.imageUrl || topRest.imageUrl || '',
                      basePrice: Number(item.basePrice) || 0,
                      discountedPrice: Number(item.discountedPrice) || Number(item.basePrice) || 0,
                      discountPercent: discountPct,
                      isVeg: Boolean(item.isVeg),
                      isCustomizable: Boolean(item.isCustomizable),
                      tag: discountPct > 0 ? `${discountPct}% OFF` : item.isBestseller ? 'BESTSELLER' : 'SPECIAL',
                    });
                  }
                }
              }
            }
            setTodayDeals(deals);
          }
        } catch {
          // Keep default fallback
        }
      }

      // Bazaar Listings
      if (listingsRes.status === 'fulfilled') {
        const raw = listingsRes.value?.data?.data || listingsRes.value?.data;
        const items = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : [];
        if (items.length > 0) {
          setBazaarListings(items.slice(0, 8));
        }
      }

      // Live Ride
      if (ridesRes.status === 'fulfilled') {
        const rawRides = ridesRes.value?.data?.data || ridesRes.value?.data;
        const ridesList = Array.isArray(rawRides) ? rawRides : [];
        const live = ridesList.find(
          (r: any) =>
            r.status === 'REQUESTED' ||
            r.status === 'SEARCHING' ||
            r.status === 'ACCEPTED' ||
            r.status === 'ARRIVED' ||
            r.status === 'STARTED',
        );
        setActiveRide(live || null);
      }
    } catch {
      // Quiet background fallback
    }
  }, [dismissedAnnouncementId]);

  useEffect(() => {
    loadHomeData();
    // Fetch Saved Addresses
    apiClient
      .get<any>(ApiEndpoints.common.addresses)
      .then((res) => {
        const payload = res.data?.data || res.data;
        setDeliverTo(resolveDeliveryAddress(payload));
      })
      .catch(() => {});
  }, [loadHomeData]);

  const openSearch = async () => {
    setIsSearchOpen(true);
    if (foodPool.length === 0 || bazaarPool.length === 0) {
      setSearchLoading(true);
      try {
        const [rRes, lRes] = await Promise.allSettled([
          apiClient.get<any>(ApiEndpoints.food.restaurants),
          apiClient.get<any>(ApiEndpoints.marketplace.listings),
        ]);
        if (rRes.status === 'fulfilled') {
          const raw = rRes.value?.data?.data || rRes.value?.data;
          setFoodPool(Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : []);
        }
        if (lRes.status === 'fulfilled') {
          const raw = lRes.value?.data?.data || lRes.value?.data;
          setBazaarPool(Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : []);
        }
      } finally {
        setSearchLoading(false);
      }
    }
  };

  const openBanner = async (banner: any) => {
    const targetType = (banner.targetType || banner.TargetType || '').toUpperCase();
    const targetId = String(banner.targetId || banner.TargetId || '');
    const moduleName = (banner.module || banner.Module || '').toUpperCase();

    if (targetType === 'URL' || targetType === 'EXTERNAL' || targetId.startsWith('http')) {
      const urlToOpen = targetId.startsWith('http') ? targetId : banner.linkUrl || banner.LinkUrl;
      if (urlToOpen) {
        try {
          const supported = await Linking.canOpenURL(urlToOpen);
          if (supported) {
            await Linking.openURL(urlToOpen);
            return;
          }
        } catch {}
      }
    }

    if (targetType === 'RESTAURANT' || targetType === 'FOOD_ITEM' || moduleName === 'FOOD') {
      if (targetId) {
        navigation.navigate('RestaurantDetail', { restaurantId: targetId });
        return;
      }
      navigation.navigate('Food');
      return;
    }

    if (targetType === 'RIDE' || targetType === 'RIDE_PROMO' || moduleName === 'RIDE') {
      navigation.navigate('Rides');
      return;
    }

    if (targetType === 'LISTING' || moduleName === 'MARKETPLACE' || moduleName === 'BAZAAR') {
      if (targetId) {
        navigation.navigate('ListingDetail', { listingId: targetId });
        return;
      }
      navigation.navigate('Bazaar');
      return;
    }

    if (banner.title) {
      Alert.alert(banner.title, banner.subtitle || 'Special offer available on SuperApp services.');
    }
  };

  const handleAddDealToCart = (deal: TodayDealItem) => {
    if (deal.isCustomizable) {
      navigation.navigate('RestaurantDetail', { restaurantId: deal.restaurantId.toString() });
      return;
    }
    addItemToCart(deal.restaurantId, deal.restaurantName, {
      id: Date.now(),
      foodItemId: deal.id,
      name: deal.name,
      basePrice: deal.discountedPrice,
      quantity: 1,
      addons: [],
      totalPrice: deal.discountedPrice,
    });
    Alert.alert('Added to Cart', `${deal.name} added to your food cart.`);
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: any[] = [];
    if (searchFilter === 'ALL' || searchFilter === 'FOOD') {
      for (const r of foodPool) {
        if (
          r.name?.toLowerCase().includes(q) ||
          r.cuisines?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
        ) {
          results.push({
            type: 'FOOD',
            id: String(r.id),
            title: r.name,
            subtitle: r.cuisines || r.description || 'Restaurant & Fast Food',
          });
        }
      }
    }
    if (searchFilter === 'ALL' || searchFilter === 'BAZAAR') {
      for (const b of bazaarPool) {
        if (
          b.title?.toLowerCase().includes(q) ||
          b.categoryName?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
        ) {
          results.push({
            type: 'BAZAAR',
            id: String(b.id),
            title: b.title,
            subtitle: `${b.categoryName || 'General'} • ${b.location || 'Local'}`,
            price: b.price,
          });
        }
      }
    }
    return results.slice(0, 20);
  }, [searchQuery, searchFilter, foodPool, bazaarPool]);

  const getInitials = () => {
    if (!user || !user.fullName) return 'U';
    const parts = user.fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.fullName.substring(0, 2).toUpperCase();
  };

  const isDarkUi = isDark;
  const currentColors = isDarkUi
    ? {
        bg: '#0A0E21',
        card: '#141829',
        cardBorder: '#232946',
        textMain: '#FFFFFF',
        textMuted: '#94A3B8',
        surfaceChip: '#1E243D',
      }
    : {
        bg: '#F8FAFC',
        card: '#FFFFFF',
        cardBorder: '#E2E8F0',
        textMain: '#0F172A',
        textMuted: '#64748B',
        surfaceChip: '#F1F5F9',
      };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.bg }]}>
      <StatusBar barStyle={isDarkUi ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TOP PREMIUM HEADER */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.locationGroup, { backgroundColor: currentColors.card, borderColor: currentColors.cardBorder }]}
            onPress={() => navigation.navigate('SavedAddresses')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF8A5C']}
              style={styles.locationIconBox}
            >
              <Ionicons name="location-sharp" size={16} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.locationTextColumn}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.deliverToCaption}>{language === 'hi' ? 'डिलीवरी पता' : 'DELIVER TO'}</Text>
                <View style={styles.livePulseDot} />
              </View>
              <View style={styles.cityRow}>
                <Text style={[styles.cityName, { color: currentColors.textMain }]} numberOfLines={1}>
                  {deliverTo}
                </Text>
                <Ionicons name="chevron-down" size={14} color={currentColors.textMuted} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            {/* Language Switcher */}
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: currentColors.card, borderColor: currentColors.cardBorder }]}
              onPress={toggleLanguage}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: AppColors.primary }}>
                {language === 'hi' ? 'EN' : 'हि'}
              </Text>
            </TouchableOpacity>

            {/* Dark/Light Mode */}
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: currentColors.card, borderColor: currentColors.cardBorder }]}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isDarkUi ? 'sunny' : 'moon'}
                size={18}
                color={isDarkUi ? '#F59E0B' : '#475569'}
              />
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: currentColors.card, borderColor: currentColors.cardBorder }]}
              onPress={() => {
                setUnreadNotifCount(0);
                navigation.navigate('Notifications');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={19} color={currentColors.textMain} />
              {unreadNotifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifCount > 99 ? '99+' : String(unreadNotifCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* User Avatar */}
            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={styles.profileGradient}
              >
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. UNIFIED SEARCH BAR */}
        <View style={styles.searchWrapper}>
          <AppSearchBar
            placeholder={
              language === 'hi'
                ? 'होटल, खाना, कैब एवं बाज़ार सर्च करें...'
                : 'Search stays, food dishes, rides & bazaar...'
            }
            editable={false}
            onPress={openSearch}
          />
        </View>

        {/* 3. BROADCAST MARQUEE */}
        {homeAnnouncement ? (
          <View style={styles.announcementCard}>
            <TouchableOpacity
              style={styles.announcementTapArea}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={styles.announcementIconWrap}>
                <Ionicons name="megaphone" size={14} color="#BE185D" />
              </View>
              <MarqueeText
                text={
                  homeAnnouncement.body
                    ? `${homeAnnouncement.title}  ·  ${homeAnnouncement.body}`
                    : homeAnnouncement.title
                }
                speedPxPerSec={38}
                gap={56}
                style={styles.announcementMarquee}
                textStyle={styles.announcementMarqueeText}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.announcementClose}
              onPress={() => {
                setDismissedAnnouncementId(homeAnnouncement.id);
                setHomeAnnouncement(null);
              }}
            >
              <Ionicons name="close" size={16} color="#9F1239" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 4. ACTIVE RIDE STATUS CARD */}
        {activeRide ? (
          <View style={[styles.liveRideCard, { backgroundColor: currentColors.card, borderColor: '#10B98155' }]}>
            <View style={styles.liveRideHeader}>
              <View style={styles.liveRideIndicatorGroup}>
                <View style={[styles.livePulseDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.liveRideStatusText}>
                  LIVE TRIP • {activeRide.status === 'STARTED' ? 'IN TRANSIT' : 'CAPTAIN ASSIGNED'}
                </Text>
              </View>
              <View style={styles.etaPill}>
                <Text style={styles.etaPillText}>Track Live</Text>
              </View>
            </View>

            <View style={styles.liveRideBody}>
              <View style={styles.vehicleIconCircle}>
                <Ionicons
                  name={activeRide.vehicleType === 'CAB' ? 'car' : 'bicycle'}
                  size={24}
                  color="#10B981"
                />
              </View>
              <View style={styles.liveRideDetails}>
                <Text style={[styles.liveRideTitle, { color: currentColors.textMain }]}>
                  {activeRide.vehicleType || 'Trip'} ({activeRide.rideNumber})
                </Text>
                <View style={styles.driverOtpRow}>
                  <Text style={[styles.driverText, { color: currentColors.textMuted }]}>
                    {activeRide.driver?.fullName ? `Captain: ${activeRide.driver.fullName} • ` : ''}OTP:{' '}
                  </Text>
                  <Text style={styles.otpHighlight}>{activeRide.otpCode || '----'}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.trackButton}
                onPress={() =>
                  navigation.navigate('ActiveRide', {
                    rideId: activeRide.rideNumber || 'RD-LIVE',
                    rideNumericId: activeRide.id,
                  })
                }
                activeOpacity={0.8}
              >
                <Text style={styles.trackButtonText}>View</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* 5. PROMOTIONAL HERO BANNERS */}
        {banners.length > 0 && (
          <View style={styles.bannerSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bannersScroll}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH - 44}
            >
              {banners.map((banner) => (
                <TouchableOpacity
                  key={String(banner.id)}
                  style={styles.bannerCard}
                  activeOpacity={0.92}
                  onPress={() => openBanner(banner)}
                >
                  {banner.imageUrl ? (
                    <Image
                      source={{ uri: resolveBannerImage(banner.imageUrl) }}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={['#3B82F6', '#8B5CF6']}
                      style={styles.bannerImagePlaceholder}
                    >
                      <Ionicons name="sparkles" size={36} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(10, 14, 33, 0.9)']}
                    style={styles.bannerOverlay}
                  >
                    <Text style={styles.bannerTitle} numberOfLines={1}>{banner.title}</Text>
                    {banner.subtitle ? (
                      <Text style={styles.bannerSubtitle} numberOfLines={1}>{banner.subtitle}</Text>
                    ) : null}
                    {banner.ctaText ? (
                      <View style={styles.bannerCtaBadge}>
                        <Text style={styles.bannerCtaText}>{banner.ctaText} →</Text>
                      </View>
                    ) : null}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 6. ECOSYSTEM BUSINESS MODULES GRID */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionHeading, { color: currentColors.textMain }]}>
              {language === 'hi' ? 'सेवाएं और स्टे' : 'Explore Ecosystem'}
            </Text>
            <Text style={[styles.sectionSubheading, { color: currentColors.textMuted }]}>
              {language === 'hi' ? 'होटल, खाना, कैब, बाज़ार एवं पेय' : 'Curated services, stays & local commerce'}
            </Text>
          </View>
        </View>

        <View style={styles.moduleGridContainer}>
          {BUSINESS_MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              activeOpacity={0.88}
              onPress={() => {
                if (mod.route === 'Food' || mod.route === 'Rides' || mod.route === 'Bazaar') {
                  navigation.navigate(mod.route);
                } else {
                  navigation.navigate(mod.route as any);
                }
              }}
              style={[
                styles.moduleCard,
                {
                  backgroundColor: currentColors.card,
                  borderColor: currentColors.cardBorder,
                },
              ]}
            >
              <View style={styles.moduleCardTop}>
                <LinearGradient
                  colors={mod.gradient}
                  style={styles.moduleIconBox}
                >
                  <Ionicons name={mod.icon as any} size={22} color="#FFFFFF" />
                </LinearGradient>
                {mod.badgeEn && (
                  <View style={[styles.moduleBadge, { backgroundColor: currentColors.surfaceChip }]}>
                    <Text style={[styles.moduleBadgeText, { color: mod.gradient[0] }]}>
                      {language === 'hi' ? mod.badgeHi : mod.badgeEn}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[styles.moduleName, { color: currentColors.textMain }]}
                numberOfLines={1}
              >
                {language === 'hi' ? mod.nameHi : mod.nameEn}
              </Text>

              <Text
                style={[styles.moduleDesc, { color: currentColors.textMuted }]}
                numberOfLines={2}
              >
                {language === 'hi' ? mod.descriptionHi : mod.descriptionEn}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 7. QUICK RIDE SHORTCUT STRIP */}
        <TouchableOpacity
          style={[styles.rideShortcutStrip, { backgroundColor: currentColors.card, borderColor: '#3B82F644' }]}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Rides')}
        >
          <View style={styles.rideShortcutLeft}>
            <LinearGradient
              colors={['#2563EB', '#3B82F6']}
              style={styles.rideShortcutIconBox}
            >
              <Ionicons name="car-sport" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.rideShortcutTextCol}>
              <Text style={[styles.rideShortcutTitle, { color: currentColors.textMain }]}>
                {language === 'hi' ? 'तुरंत कैब या बाइक चाहिए?' : 'Need an instant ride?'}
              </Text>
              <Text style={[styles.rideShortcutSubtitle, { color: currentColors.textMuted }]}>
                {language === 'hi' ? 'बाइक, ऑटो व कैब नजदीकी उपलब्ध' : 'Verified captains nearby • Transparent fares'}
              </Text>
            </View>
          </View>
          <View style={styles.rideShortcutActionBtn}>
            <Text style={styles.rideShortcutActionText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={13} color="#2563EB" />
          </View>
        </TouchableOpacity>

        {/* 8. TODAY'S DEALS & COMBOS SECTION */}
        {todayDeals.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionHeading, { color: currentColors.textMain }]}>
                  {language === 'hi' ? 'आज के विशेष ऑफर्स एवं थाली' : "Today's Deals & Combos"}
                </Text>
                <Text style={[styles.sectionSubheading, { color: currentColors.textMuted }]}>
                  {language === 'hi' ? 'ताज़ा भोजन सीधे शीर्ष रेस्तरां से' : 'Fresh discounts from verified kitchens'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Food')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCardList}
            >
              {todayDeals.map((deal) => (
                <View
                  key={deal.id}
                  style={[
                    styles.dealCard,
                    {
                      backgroundColor: currentColors.card,
                      borderColor: currentColors.cardBorder,
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: deal.restaurantId.toString() })}
                  >
                    <Image
                      source={{ uri: resolveRestaurantImage(deal.imageUrl) }}
                      style={styles.dealCardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.dealTagBadge}>
                      <Text style={styles.dealTagText}>{deal.tag}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.dealCardContent}>
                    <Text style={[styles.dealRestName, { color: currentColors.textMuted }]} numberOfLines={1}>
                      {deal.restaurantName}
                    </Text>
                    <Text style={[styles.dealItemName, { color: currentColors.textMain }]} numberOfLines={1}>
                      {deal.name}
                    </Text>

                    <View style={styles.dealPriceRow}>
                      <Text style={[styles.dealPrice, { color: currentColors.textMain }]}>
                        ₹{deal.discountedPrice.toFixed(0)}
                      </Text>
                      {deal.basePrice > deal.discountedPrice && (
                        <Text style={[styles.dealBasePrice, { color: currentColors.textMuted }]}>
                          ₹{deal.basePrice.toFixed(0)}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.addDealBtn}
                      activeOpacity={0.8}
                      onPress={() => handleAddDealToCart(deal)}
                    >
                      <Ionicons name="add" size={15} color="#FFFFFF" />
                      <Text style={styles.addDealBtnText}>ADD</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 9. FOOD DISCOVERY CUISINES */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionHeading, { color: currentColors.textMain }]}>
                {language === 'hi' ? 'स्वादिष्ट श्रेणियां' : 'Cuisine Discovery'}
              </Text>
              <Text style={[styles.sectionSubheading, { color: currentColors.textMuted }]}>
                {language === 'hi' ? 'लोकप्रिय भोजन विकल्प' : 'Curated dishes & beverage delights'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Food')}>
              <Text style={styles.seeAllText}>Explore</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cuisinesScroll}
          >
            {CUISINE_RECOMMENDATIONS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.cuisinePill,
                  {
                    backgroundColor: currentColors.card,
                    borderColor: currentColors.cardBorder,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Food')}
              >
                <View style={[styles.cuisineIconCircle, { backgroundColor: `${c.color}1E` }]}>
                  <Ionicons name={c.icon as any} size={20} color={c.color} />
                </View>
                <Text style={[styles.cuisineName, { color: currentColors.textMain }]}>{c.name}</Text>
                <Text style={[styles.cuisineCount, { color: currentColors.textMuted }]}>{c.count}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 10. POPULAR RESTAURANTS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionHeading, { color: currentColors.textMain }]}>
                {language === 'hi' ? 'नजदीकी लोकप्रिय रेस्तरां' : 'Top Restaurants Near You'}
              </Text>
              <Text style={[styles.sectionSubheading, { color: currentColors.textMuted }]}>
                {language === 'hi' ? 'रेटेड भोजन एवं तेज़ डिलीवरी' : 'Fast doorstep drop with live tracking'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Food')}>
              <Text style={styles.seeAllText}>View all ({restaurants.length})</Text>
            </TouchableOpacity>
          </View>

          {restaurants.slice(0, 4).map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              style={[
                styles.restCard,
                {
                  backgroundColor: currentColors.card,
                  borderColor: currentColors.cardBorder,
                },
              ]}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate('RestaurantDetail', {
                  restaurantId: restaurant.id.toString(),
                })
              }
            >
              <Image
                source={{ uri: resolveRestaurantImage(restaurant.imageUrl) }}
                style={styles.restImage}
                resizeMode="cover"
              />
              <View style={styles.restInfo}>
                <View style={styles.restTitleRow}>
                  <Text style={[styles.restName, { color: currentColors.textMain }]} numberOfLines={1}>
                    {restaurant.name}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color="#FFFFFF" />
                    <Text style={styles.ratingText}>{Number(restaurant.rating || 4.5).toFixed(1)}</Text>
                  </View>
                </View>

                <Text style={[styles.restCuisines, { color: currentColors.textMuted }]} numberOfLines={1}>
                  {restaurant.cuisines || restaurant.description || 'Multi-cuisine • Fast Food'}
                </Text>

                <View style={styles.restMetaRow}>
                  <View style={styles.restMetaItem}>
                    <Ionicons name="time-outline" size={13} color={currentColors.textMuted} />
                    <Text style={[styles.restMetaText, { color: currentColors.textMuted }]}>
                      {restaurant.avgDeliveryTimeMinutes || 25} mins
                    </Text>
                  </View>
                  <Text style={[styles.metaDot, { color: currentColors.textMuted }]}>•</Text>
                  <View style={styles.restMetaItem}>
                    <Ionicons name="bicycle-outline" size={13} color={currentColors.textMuted} />
                    <Text style={[styles.restMetaText, { color: currentColors.textMuted }]}>
                      {restaurant.deliveryFee === 0 ? 'Free Delivery' : `₹${restaurant.deliveryFee} drop`}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 11. BAZAAR PICKS */}
        {bazaarListings.length > 0 && (
          <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionHeading, { color: currentColors.textMain }]}>
                  {language === 'hi' ? 'स्थानीय कम्युनिटी बाज़ार' : 'Community Bazaar Finds'}
                </Text>
                <Text style={[styles.sectionSubheading, { color: currentColors.textMuted }]}>
                  {language === 'hi' ? 'सत्यापित स्थानीय विक्रेताओं से' : 'Pre-loved & local verified listings'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Bazaar')}>
                <Text style={styles.seeAllText}>Browse</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCardList}
            >
              {bazaarListings.map((listing) => (
                <TouchableOpacity
                  key={listing.id}
                  style={[
                    styles.bazaarCard,
                    {
                      backgroundColor: currentColors.card,
                      borderColor: currentColors.cardBorder,
                    },
                  ]}
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('ListingDetail', { listingId: String(listing.id) })}
                >
                  <Image
                    source={{
                      uri:
                        listing.primaryImageUrl ||
                        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400',
                    }}
                    style={styles.bazaarCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.bazaarCardContent}>
                    <Text style={[styles.bazaarPrice, { color: currentColors.textMain }]}>
                      ₹{Number(listing.price || 0).toFixed(0)}
                    </Text>
                    <Text style={[styles.bazaarTitle, { color: currentColors.textMain }]} numberOfLines={1}>
                      {listing.title}
                    </Text>
                    <Text style={[styles.bazaarCategory, { color: currentColors.textMuted }]} numberOfLines={1}>
                      {listing.categoryName || 'General'} • {listing.location || 'Local'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* GLOBAL SEARCH OVERLAY MODAL */}
      <Modal visible={isSearchOpen} animationType="slide" onRequestClose={() => setIsSearchOpen(false)}>
        <SafeAreaView style={[styles.searchModalContainer, { backgroundColor: currentColors.bg }]}>
          <View style={[styles.searchModalHeader, { borderBottomColor: currentColors.cardBorder }]}>
            <TouchableOpacity onPress={() => setIsSearchOpen(false)} style={styles.searchBackBtn}>
              <Ionicons name="arrow-back" size={24} color={currentColors.textMain} />
            </TouchableOpacity>
            <View style={styles.searchModalInputWrapper}>
              <AppSearchBar
                placeholder="Search food, stays, products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery('')}
                editable={true}
              />
            </View>
          </View>

          <View style={[styles.searchFilterRow, { borderBottomColor: currentColors.cardBorder }]}>
            {(['ALL', 'FOOD', 'BAZAAR'] as const).map((filter) => {
              const active = searchFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.searchFilterChip,
                    {
                      backgroundColor: active ? AppColors.primary : currentColors.card,
                      borderColor: active ? AppColors.primary : currentColors.cardBorder,
                    },
                  ]}
                  onPress={() => setSearchFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.searchFilterText,
                      { color: active ? '#FFFFFF' : currentColors.textMuted },
                    ]}
                  >
                    {filter === 'ALL' ? 'All Results' : filter === 'FOOD' ? 'Food & Restaurants' : 'Bazaar Products'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {searchLoading ? (
            <View style={styles.searchLoaderContainer}>
              <ActivityIndicator size="large" color={AppColors.primary} />
              <Text style={[styles.searchLoaderText, { color: currentColors.textMuted }]}>
                Loading live catalog...
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.searchResultsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.searchResultCard,
                    {
                      backgroundColor: currentColors.card,
                      borderColor: currentColors.cardBorder,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setIsSearchOpen(false);
                    if (item.type === 'FOOD') {
                      navigation.navigate('RestaurantDetail', { restaurantId: item.id });
                    } else if (item.type === 'BAZAAR') {
                      navigation.navigate('ListingDetail', { listingId: String(item.id) });
                    }
                  }}
                >
                  <View style={styles.searchResultBadge}>
                    <Ionicons
                      name={item.type === 'FOOD' ? 'restaurant' : 'pricetag'}
                      size={13}
                      color={item.type === 'FOOD' ? '#EA580C' : '#2563EB'}
                    />
                    <Text
                      style={[
                        styles.searchResultBadgeText,
                        { color: item.type === 'FOOD' ? '#EA580C' : '#2563EB' },
                      ]}
                    >
                      {item.type === 'FOOD' ? 'RESTAURANT' : 'MARKETPLACE'}
                    </Text>
                  </View>
                  <Text style={[styles.searchResultTitle, { color: currentColors.textMain }]}>{item.title}</Text>
                  {item.subtitle ? (
                    <Text style={[styles.searchResultSubtitle, { color: currentColors.textMuted }]}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  {item.price != null ? (
                    <Text style={styles.searchResultPrice}>₹{Number(item.price).toFixed(0)}</Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.searchEmptyBox}>
                  <Ionicons name="search-outline" size={44} color={currentColors.textMuted} />
                  <Text style={[styles.searchEmptyTitle, { color: currentColors.textMain }]}>
                    {searchQuery.trim().length > 0 ? 'No matching items' : 'Type to search everything'}
                  </Text>
                  <Text style={[styles.searchEmptySubtitle, { color: currentColors.textMuted }]}>
                    Find verified restaurants, dishes, luxury hotel stays and community bazaar listings.
                  </Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
  },
  locationIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
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
    color: '#FF6B35',
    letterSpacing: 0.8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginLeft: 6,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  cityName: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 3,
    maxWidth: '85%',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#0A0E21',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  profileGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchWrapper: {
    marginBottom: 14,
  },
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.35)',
    paddingVertical: 7,
    paddingLeft: 10,
    paddingRight: 6,
    marginBottom: 14,
  },
  announcementTapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  announcementMarquee: {
    flex: 1,
    height: 20,
  },
  announcementMarqueeText: {
    color: '#BE185D',
    fontSize: 12,
    fontWeight: '600',
  },
  announcementClose: {
    padding: 4,
    marginLeft: 2,
  },
  liveRideCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  liveRideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveRideIndicatorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveRideStatusText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  etaPill: {
    backgroundColor: '#10B98122',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  etaPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  liveRideBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  liveRideDetails: {
    flex: 1,
  },
  liveRideTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  driverOtpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverText: {
    fontSize: 12,
  },
  otpHighlight: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 3,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerSection: {
    marginBottom: 18,
  },
  bannersScroll: {
    gap: 12,
  },
  bannerCard: {
    width: SCREEN_WIDTH - 52,
    height: 145,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    justifyContent: 'flex-end',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  bannerCtaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  bannerCtaText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSubheading: {
    fontSize: 12,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  moduleGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moduleCard: {
    width: '48.5%',
    borderRadius: 16,
    padding: 13,
    marginBottom: 11,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  moduleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 2,
  },
  moduleDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  rideShortcutStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  rideShortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rideShortcutIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rideShortcutTextCol: {
    flex: 1,
  },
  rideShortcutTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rideShortcutSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  rideShortcutActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2563EB18',
  },
  rideShortcutActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  horizontalCardList: {
    gap: 12,
  },
  dealCard: {
    width: 165,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dealCardImage: {
    width: '100%',
    height: 105,
  },
  dealTagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dealTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  dealCardContent: {
    padding: 10,
  },
  dealRestName: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  dealItemName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dealPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  dealBasePrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  addDealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 5,
    gap: 4,
  },
  addDealBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cuisinesScroll: {
    gap: 10,
  },
  cuisinePill: {
    alignItems: 'center',
    width: 86,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  cuisineIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cuisineName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  cuisineCount: {
    fontSize: 9,
    marginTop: 2,
  },
  restCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  restImage: {
    width: 76,
    height: 76,
    borderRadius: 12,
    marginRight: 12,
  },
  restInfo: {
    flex: 1,
  },
  restTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  restName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  restCuisines: {
    fontSize: 11,
    marginBottom: 6,
  },
  restMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaDot: {
    marginHorizontal: 6,
    fontSize: 11,
  },
  bazaarCard: {
    width: 140,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bazaarCardImage: {
    width: '100%',
    height: 95,
  },
  bazaarCardContent: {
    padding: 8,
  },
  bazaarPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  bazaarTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  bazaarCategory: {
    fontSize: 10,
    marginTop: 3,
  },
  searchModalContainer: {
    flex: 1,
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  searchBackBtn: {
    padding: 8,
    marginRight: 4,
  },
  searchModalInputWrapper: {
    flex: 1,
  },
  searchFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  searchFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  searchFilterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchResultsList: {
    padding: 16,
    gap: 12,
  },
  searchResultCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  searchResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  searchResultBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  searchResultSubtitle: {
    fontSize: 12,
  },
  searchResultPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 6,
  },
  searchLoaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  searchLoaderText: {
    marginTop: 12,
    fontSize: 13,
  },
  searchEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  searchEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  searchEmptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
