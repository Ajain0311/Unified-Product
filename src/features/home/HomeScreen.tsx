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
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';
import { AppSearchBar } from '../../components/common/AppSearchBar';
import { AppHeader } from '../../components/common/AppHeader';
import { SectionHeader } from '../../components/common/SectionHeader';
import { ModuleGrid } from '../../components/common/ModuleGrid';
import { PromotionCarousel, BannerItem } from '../../components/common/PromotionCarousel';
import { MarqueeText } from '../../components/common/MarqueeText';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = AppEnvironment.hubBaseUrl.replace(/\/$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

export function resolveDeliveryAddress(payload: any): string {
  const items = Array.isArray(payload) ? payload : [];
  if (items.length > 0) {
    const def = items.find((a: any) => a.isDefault) || items[0];
    const line = [def.addressLine1, def.city].filter(Boolean).join(', ');
    return line || 'Chittorgarh District, Rajasthan';
  }
  return 'Chittorgarh District, Rajasthan';
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
  { id: 'biryani', name: 'Biryani', icon: 'flame', count: '14+ spots', color: '#FF5A1F' },
  { id: 'north_indian', name: 'North Indian', icon: 'restaurant', count: '22+ spots', color: '#10B981' },
  { id: 'south_indian', name: 'South Indian', icon: 'leaf', count: '12+ spots', color: '#06B6D4' },
  { id: 'burgers', name: 'Burgers & Pizza', icon: 'fast-food', count: '18+ spots', color: '#EF4444' },
  { id: 'desserts', name: 'Sweets & Bakes', icon: 'ice-cream', count: '15+ spots', color: '#EC4899' },
  { id: 'cafe', name: 'Coffee & Chai', icon: 'cafe', count: '10+ spots', color: '#8B5CF6' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const addItemToCart = useCartStore((state) => state.addItem);
  const { theme, isDark } = useAppTheme();
  const { language, t } = useLanguageStore();

  const [activeRide, setActiveRide] = useState<any>(null);
  const [banners, setBanners] = useState<BannerItem[]>([]);
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
  const [searchFilter, setSearchFilter] = useState<'ALL' | 'FOOD' | 'BAZAAR' | 'HOTELS'>('ALL');
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
        } else {
          // Curated default banners for premium feel
          setBanners([
            {
              id: 'promo-1',
              title: 'SuperApp Exclusive Discounts',
              subtitle: 'Up to 50% OFF on gourmet meals & boutique stays',
              ctaText: 'Discover',
              badge: 'LIMITED TIME',
              gradient: ['#FF5A1F', '#FF7A45'],
            },
            {
              id: 'promo-2',
              title: 'Instant Rides at Zero Surge',
              subtitle: 'Verified local captains • Fixed transparent pricing',
              ctaText: 'Book Cab',
              badge: 'FASTEST',
              gradient: ['#2563EB', '#3B82F6'],
            },
          ]);
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

      // Defer Today's Deals loading asynchronously so main feed renders immediately
      if (loadedRests.length > 0) {
        const topRest = loadedRests[0];
        apiClient.get<any>(ApiEndpoints.food.restaurantDetail(topRest.id)).then((detailRes) => {
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
            if (deals.length > 0) {
              setTodayDeals(deals);
            }
          }
        }).catch(() => {});
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

    if (targetType === 'HOTEL' || moduleName === 'HOTELS') {
      if (targetId) {
        navigation.navigate('HotelDetail', { hotelId: targetId });
        return;
      }
      navigation.navigate('HotelHome');
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TOP PREMIUM APP HEADER */}
        <AppHeader
          deliverTo={deliverTo}
          onPressLocation={() => navigation.navigate('SavedAddresses')}
          onPressNotifications={() => {
            setUnreadNotifCount(0);
            navigation.navigate('Notifications');
          }}
          onPressProfile={() => navigation.navigate('Profile')}
          unreadCount={unreadNotifCount}
        />

        {/* 2. UNIFIED GLOBAL SEARCH BAR */}
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

        {/* 3. BROADCAST MARQUEE (when active) */}
        {homeAnnouncement ? (
          <View style={[styles.announcementCard, { backgroundColor: isDark ? '#83184322' : '#FDF2F8' }]}>
            <TouchableOpacity
              style={styles.announcementTapArea}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={styles.announcementIconWrap}>
                <Ionicons name="megaphone" size={13} color="#BE185D" />
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={15} color="#9F1239" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 4. ACTIVE RIDE STATUS CARD (Uber-like clean live trip tracker) */}
        {activeRide ? (
          <View
            style={[
              styles.liveRideCard,
              { backgroundColor: theme.card, borderColor: '#10B98155' },
              AppShadows.md,
            ]}
          >
            <View style={styles.liveRideHeader}>
              <View style={styles.liveRideIndicatorGroup}>
                <View style={styles.livePulseDot} />
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
                  size={22}
                  color="#10B981"
                />
              </View>
              <View style={styles.liveRideDetails}>
                <Text style={[styles.liveRideTitle, { color: theme.textPrimary }]}>
                  {activeRide.vehicleType || 'Trip'} ({activeRide.rideNumber})
                </Text>
                <View style={styles.driverOtpRow}>
                  <Text style={[styles.driverText, { color: theme.textSecondary }]}>
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
                <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* 5. PROMOTIONAL HERO BANNERS */}
        {banners.length > 0 && (
          <PromotionCarousel
            banners={banners}
            onPressBanner={openBanner}
            resolveImageUrl={resolveBannerImage}
          />
        )}

        {/* 6. DYNAMIC ECOSYSTEM SERVICES (Future-ready from BUSINESS_MODULES) */}
        <SectionHeader
          title={language === 'hi' ? 'सेवाएं और स्टे' : 'Explore Ecosystem'}
          subtitle={
            language === 'hi'
              ? 'होटल, खाना, कैब, बाज़ार एवं पेय'
              : 'Curated stays, fast delivery & local commerce'
          }
          actionText={language === 'hi' ? 'सभी मॉड्यूल' : 'All Modules'}
          onAction={() => navigation.navigate('ModuleCatalog' as any)}
        />

        <View style={styles.moduleSection}>
          <ModuleGrid
            modules={BUSINESS_MODULES}
            onSelectModule={(route) => {
              if (route === 'Food' || route === 'Rides' || route === 'Bazaar') {
                navigation.navigate(route);
              } else {
                navigation.navigate(route as any);
              }
            }}
          />
        </View>

        {/* 7. QUICK RIDE SHORTCUT STRIP */}
        <TouchableOpacity
          style={[
            styles.rideShortcutStrip,
            { backgroundColor: theme.card, borderColor: isDark ? '#1E3A8A' : '#BFDBFE' },
            AppShadows.subtle,
          ]}
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
              <Text style={[styles.rideShortcutTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'तुरंत कैब या बाइक चाहिए?' : 'Need an instant ride?'}
              </Text>
              <Text style={[styles.rideShortcutSubtitle, { color: theme.textSecondary }]}>
                {language === 'hi' ? 'बाइक, ऑटो व कैब नजदीकी उपलब्ध' : 'Verified captains nearby • Zero surge'}
              </Text>
            </View>
          </View>
          <View style={styles.rideShortcutActionBtn}>
            <Text style={styles.rideShortcutActionText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={12} color="#2563EB" />
          </View>
        </TouchableOpacity>

        {/* 7b. GROW WITH SUPERAPP ENTRY STRIP */}
        <TouchableOpacity
          style={[
            styles.rideShortcutStrip,
            { backgroundColor: isDark ? '#1C1917' : '#FFFBEB', borderColor: isDark ? '#78350F' : '#FDE68A' },
            AppShadows.subtle,
          ]}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('GrowWithSuperApp' as any)}
        >
          <View style={styles.rideShortcutLeft}>
            <LinearGradient
              colors={['#D97706', '#F59E0B']}
              style={styles.rideShortcutIconBox}
            >
              <Ionicons name="rocket" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.rideShortcutTextCol}>
              <Text style={[styles.rideShortcutTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'सुपरऐप के साथ बिज़नेस बढ़ाएं' : 'Grow with SuperApp'}
              </Text>
              <Text style={[styles.rideShortcutSubtitle, { color: theme.textSecondary }]}>
                {language === 'hi' ? 'पार्टनर ऑनबोर्डिंग व न्यू प्रोडक्ट/सर्विस रिक्वेस्ट' : 'Partner onboarding, new product & category requests'}
              </Text>
            </View>
          </View>
          <View style={[styles.rideShortcutActionBtn, { backgroundColor: isDark ? '#292524' : '#FEF3C7' }]}>
            <Text style={[styles.rideShortcutActionText, { color: '#D97706' }]}>Explore</Text>
            <Ionicons name="arrow-forward" size={12} color="#D97706" />
          </View>
        </TouchableOpacity>

        {/* 8. TODAY'S SPECIALS & DEALS */}
        {todayDeals.length > 0 && (
          <View style={styles.sectionContainer}>
            <SectionHeader
              title={language === 'hi' ? 'आज के विशेष ऑफर्स' : "Today's Specials"}
              subtitle={
                language === 'hi'
                  ? 'ताज़ा भोजन सीधे शीर्ष रेस्तरां से'
                  : 'Handpicked discounts from verified kitchens'
              }
              actionText="See all"
              onAction={() => navigation.navigate('Food')}
            />

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
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                    },
                    AppShadows.subtle,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('RestaurantDetail', {
                        restaurantId: deal.restaurantId.toString(),
                      })
                    }
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
                    <Text
                      style={[styles.dealRestName, { color: theme.textTertiary }]}
                      numberOfLines={1}
                    >
                      {deal.restaurantName}
                    </Text>
                    <Text
                      style={[styles.dealItemName, { color: theme.textPrimary }]}
                      numberOfLines={1}
                    >
                      {deal.name}
                    </Text>

                    <View style={styles.dealPriceRow}>
                      <Text style={[styles.dealPrice, { color: theme.primary }]}>
                        ₹{deal.discountedPrice.toFixed(0)}
                      </Text>
                      {deal.basePrice > deal.discountedPrice && (
                        <Text style={[styles.dealBasePrice, { color: theme.textTertiary }]}>
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
          <SectionHeader
            title={language === 'hi' ? 'स्वादिष्ट श्रेणियां' : 'Cuisine Discovery'}
            subtitle={
              language === 'hi'
                ? 'लोकप्रिय भोजन श्रेणियां'
                : 'Browse trending dishes & specialties'
            }
            actionText="Explore"
            onAction={() => navigation.navigate('Food')}
          />

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
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                  AppShadows.subtle,
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Food')}
              >
                <View style={[styles.cuisineIconCircle, { backgroundColor: `${c.color}18` }]}>
                  <Ionicons name={c.icon as any} size={20} color={c.color} />
                </View>
                <Text style={[styles.cuisineName, { color: theme.textPrimary }]}>{c.name}</Text>
                <Text style={[styles.cuisineCount, { color: theme.textTertiary }]}>{c.count}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 10. POPULAR RESTAURANTS */}
        <View style={styles.sectionContainer}>
          <SectionHeader
            title={language === 'hi' ? 'नजदीकी लोकप्रिय रेस्तरां' : 'Top Restaurants Near You'}
            subtitle={
              language === 'hi'
                ? 'रेटेड भोजन एवं तेज़ डिलीवरी'
                : 'Speedy doorstep delivery with live tracking'
            }
            actionText={`View all (${restaurants.length})`}
            onAction={() => navigation.navigate('Food')}
          />

          {restaurants.slice(0, 4).map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              style={[
                styles.restCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                },
                AppShadows.subtle,
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
                  <Text style={[styles.restName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {restaurant.name}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color="#FFFFFF" />
                    <Text style={styles.ratingText}>
                      {Number(restaurant.rating || 4.5).toFixed(1)}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.restCuisines, { color: theme.textSecondary }]} numberOfLines={1}>
                  {restaurant.cuisines || restaurant.description || 'Multi-cuisine • Fast Food'}
                </Text>

                <View style={styles.restMetaRow}>
                  <View style={styles.restMetaItem}>
                    <Ionicons name="time-outline" size={13} color={theme.textTertiary} />
                    <Text style={[styles.restMetaText, { color: theme.textTertiary }]}>
                      {restaurant.avgDeliveryTimeMinutes || 25} mins
                    </Text>
                  </View>
                  <Text style={[styles.metaDot, { color: theme.textTertiary }]}>•</Text>
                  <View style={styles.restMetaItem}>
                    <Ionicons name="bicycle-outline" size={13} color={theme.textTertiary} />
                    <Text style={[styles.restMetaText, { color: theme.textTertiary }]}>
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
          <View style={styles.sectionContainer}>
            <SectionHeader
              title={language === 'hi' ? 'स्थानीय कम्युनिटी बाज़ार' : 'Community Bazaar Finds'}
              subtitle={
                language === 'hi'
                  ? 'सत्यापित स्थानीय विक्रेताओं से'
                  : 'Pre-owned & verified deals from verified neighbours'
              }
              actionText="Browse"
              onAction={() => navigation.navigate('Bazaar')}
            />

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
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                    },
                    AppShadows.subtle,
                  ]}
                  activeOpacity={0.88}
                  onPress={() =>
                    navigation.navigate('ListingDetail', { listingId: String(listing.id) })
                  }
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
                    <Text style={[styles.bazaarPrice, { color: theme.primary }]}>
                      ₹{Number(listing.price || 0).toFixed(0)}
                    </Text>
                    <Text style={[styles.bazaarTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {listing.title}
                    </Text>
                    <Text style={[styles.bazaarCategory, { color: theme.textTertiary }]} numberOfLines={1}>
                      {listing.categoryName || 'General'} • {listing.location || 'Local'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* 12. GLOBAL MULTI-MODULE SEARCH OVERLAY MODAL */}
      <Modal
        visible={isSearchOpen}
        animationType="slide"
        onRequestClose={() => setIsSearchOpen(false)}
      >
        <SafeAreaView style={[styles.searchModalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.searchModalHeader, { borderBottomColor: theme.cardBorder }]}>
            <TouchableOpacity onPress={() => setIsSearchOpen(false)} style={styles.searchBackBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
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

          <View style={[styles.searchFilterRow, { borderBottomColor: theme.cardBorder }]}>
            {(['ALL', 'FOOD', 'BAZAAR'] as const).map((filter) => {
              const active = searchFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.searchFilterChip,
                    {
                      backgroundColor: active ? theme.primary : theme.card,
                      borderColor: active ? theme.primary : theme.cardBorder,
                    },
                  ]}
                  onPress={() => setSearchFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.searchFilterText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {filter === 'ALL'
                      ? 'All'
                      : filter === 'FOOD'
                      ? 'Food & Dining'
                      : 'Bazaar'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {searchLoading ? (
            <View style={styles.searchLoaderContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.searchLoaderText, { color: theme.textSecondary }]}>
                Searching live catalog...
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
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                    },
                    AppShadows.subtle,
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
                      size={12}
                      color={item.type === 'FOOD' ? '#FF5A1F' : '#2563EB'}
                    />
                    <Text
                      style={[
                        styles.searchResultBadgeText,
                        { color: item.type === 'FOOD' ? '#FF5A1F' : '#2563EB' },
                      ]}
                    >
                      {item.type === 'FOOD' ? 'RESTAURANT' : 'MARKETPLACE'}
                    </Text>
                  </View>
                  <Text style={[styles.searchResultTitle, { color: theme.textPrimary }]}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={[styles.searchResultSubtitle, { color: theme.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  {item.price != null ? (
                    <Text style={[styles.searchResultPrice, { color: theme.primary }]}>
                      ₹{Number(item.price).toFixed(0)}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.searchEmptyBox}>
                  <Ionicons name="search-outline" size={44} color={theme.textTertiary} />
                  <Text style={[styles.searchEmptyTitle, { color: theme.textPrimary }]}>
                    {searchQuery.trim().length > 0 ? 'No matching items' : 'Type to search everything'}
                  </Text>
                  <Text style={[styles.searchEmptySubtitle, { color: theme.textSecondary }]}>
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
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    paddingBottom: AppSpacing.huge,
  },
  searchWrapper: {
    marginBottom: AppSpacing.md,
  },
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.35)',
    paddingVertical: 7,
    paddingLeft: 10,
    paddingRight: 6,
    marginBottom: AppSpacing.md,
  },
  announcementTapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
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
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    padding: AppSpacing.md,
    marginBottom: AppSpacing.lg,
  },
  liveRideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppSpacing.sm,
  },
  liveRideIndicatorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveRideStatusText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  etaPill: {
    backgroundColor: '#10B98122',
    borderRadius: AppRadius.sm,
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
    width: 40,
    height: 40,
    borderRadius: AppRadius.md,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: AppSpacing.md,
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
    borderRadius: AppRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 3,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  moduleSection: {
    marginBottom: AppSpacing.lg,
  },
  rideShortcutStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: AppRadius.lg,
    padding: AppSpacing.md,
    marginBottom: AppSpacing.lg,
  },
  rideShortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rideShortcutIconBox: {
    width: 38,
    height: 38,
    borderRadius: AppRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: AppSpacing.sm,
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
    borderRadius: AppRadius.sm,
    backgroundColor: '#2563EB15',
  },
  rideShortcutActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  sectionContainer: {
    marginBottom: AppSpacing.lg,
  },
  horizontalCardList: {
    gap: AppSpacing.md,
  },
  dealCard: {
    width: 165,
    borderRadius: AppRadius.lg,
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
    borderRadius: AppRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dealTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  dealCardContent: {
    padding: AppSpacing.sm,
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
    backgroundColor: '#FF5A1F',
    borderRadius: AppRadius.sm,
    paddingVertical: 5,
    gap: 4,
  },
  addDealBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cuisinesScroll: {
    gap: AppSpacing.sm,
  },
  cuisinePill: {
    alignItems: 'center',
    width: 86,
    paddingVertical: 10,
    borderRadius: AppRadius.lg,
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
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    padding: AppSpacing.md,
    marginBottom: AppSpacing.sm,
    alignItems: 'center',
  },
  restImage: {
    width: 76,
    height: 76,
    borderRadius: AppRadius.md,
    marginRight: AppSpacing.md,
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
    borderRadius: AppRadius.xs,
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
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bazaarCardImage: {
    width: '100%',
    height: 95,
  },
  bazaarCardContent: {
    padding: AppSpacing.sm,
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
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
    paddingBottom: AppSpacing.xs,
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
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: 10,
    gap: AppSpacing.sm,
    borderBottomWidth: 1,
  },
  searchFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
  },
  searchFilterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchResultsList: {
    padding: AppSpacing.lg,
    gap: AppSpacing.md,
  },
  searchResultCard: {
    borderRadius: AppRadius.lg,
    padding: AppSpacing.md,
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
