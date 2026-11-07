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
import { useCartStore } from '../../store/cartStore';
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';

interface BeverageItem {
  id: number;
  name: string;
  cafe: string;
  category: string;
  price: number;
  rating: number;
  prepTime: string;
  imageUrl: string;
  badge?: string;
  isIced?: boolean;
}

const BEVERAGE_COLLECTIONS = [
  { id: 'all', title: 'All Drinks', icon: 'sparkles' },
  { id: 'coffee', title: 'Artisan Coffee', icon: 'cafe' },
  { id: 'boba', title: 'Boba & Bubble Tea', icon: 'water' },
  { id: 'juices', title: 'Cold-Pressed Juices', icon: 'nutrition' },
  { id: 'tea', title: 'Matcha & Herbal Teas', icon: 'leaf' },
];

const FEATURED_BEVERAGES: BeverageItem[] = [
  {
    id: 101,
    name: 'Spanish Iced Latte with Condensed Milk',
    cafe: 'Blue Tokai Roastery',
    category: 'coffee',
    price: 240,
    rating: 4.8,
    prepTime: '15 mins',
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600',
    badge: 'BESTSELLER',
    isIced: true,
  },
  {
    id: 102,
    name: 'Brown Sugar Tiger Milk Boba',
    cafe: 'The Bubble Tea Bar',
    category: 'boba',
    price: 260,
    rating: 4.9,
    prepTime: '20 mins',
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b37cb337e7df?w=600',
    badge: 'POPULAR',
    isIced: true,
  },
  {
    id: 103,
    name: 'Cold-Pressed Valencia Orange & Carrot',
    cafe: 'Green Bliss Botanicals',
    category: 'juices',
    price: 180,
    rating: 4.7,
    prepTime: '12 mins',
    imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600',
    isIced: true,
  },
  {
    id: 104,
    name: 'Kyoto Ceremonial Uji Matcha Latte',
    cafe: 'Artisanal Tea Atelier',
    category: 'tea',
    price: 280,
    rating: 4.9,
    prepTime: '15 mins',
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600',
    badge: 'SIGNATURE',
    isIced: false,
  },
];

export const BeverageHubScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();
  const addItemToCart = useCartStore((state) => state.addItem);

  const [selectedCat, setSelectedCat] = useState('all');
  const [fulfillmentMode, setFulfillmentMode] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');

  const filteredItems = FEATURED_BEVERAGES.filter(
    (item) => selectedCat === 'all' || item.category === selectedCat
  );

  const handleAddToCart = (bev: BeverageItem) => {
    addItemToCart(999, bev.cafe, {
      id: Date.now(),
      foodItemId: bev.id,
      name: bev.name,
      basePrice: bev.price,
      quantity: 1,
      addons: [],
      totalPrice: bev.price,
    });
    Alert.alert(
      language === 'hi' ? 'कार्ट में जोड़ा गया' : 'Added to Cart',
      `${bev.name} from ${bev.cafe} added to your cart.`
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
            {language === 'hi' ? 'कैफे और पेय' : 'Beverages & Artisan Cafes'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {language === 'hi'
              ? 'स्पेशलिटी कॉफी, शेक्स, बोबा एवं ताज़ा जूस'
              : 'Specialty coffee roasters, cold brews & bubble tea'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery / Counter Pickup Segment Switch */}
        <View
          style={[
            styles.segmentContainer,
            { backgroundColor: theme.chipBg, borderColor: theme.cardBorder },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              fulfillmentMode === 'DELIVERY' && { backgroundColor: theme.card },
              fulfillmentMode === 'DELIVERY' && AppShadows.subtle,
            ]}
            onPress={() => setFulfillmentMode('DELIVERY')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="bicycle-outline"
              size={15}
              color={fulfillmentMode === 'DELIVERY' ? '#0891B2' : theme.textTertiary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: fulfillmentMode === 'DELIVERY' ? '#0891B2' : theme.textSecondary },
              ]}
            >
              Chilled Delivery (~20m)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              fulfillmentMode === 'PICKUP' && { backgroundColor: theme.card },
              fulfillmentMode === 'PICKUP' && AppShadows.subtle,
            ]}
            onPress={() => setFulfillmentMode('PICKUP')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="walk-outline"
              size={15}
              color={fulfillmentMode === 'PICKUP' ? '#0891B2' : theme.textTertiary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: fulfillmentMode === 'PICKUP' ? '#0891B2' : theme.textSecondary },
              ]}
            >
              Express Barista Pickup
            </Text>
          </TouchableOpacity>
        </View>

        {/* Collection Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.collectionsScroll}
        >
          {BEVERAGE_COLLECTIONS.map((c) => {
            const active = selectedCat === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.collectionPill,
                  {
                    backgroundColor: active ? '#0891B2' : theme.card,
                    borderColor: active ? '#0891B2' : theme.cardBorder,
                  },
                  AppShadows.subtle,
                ]}
                onPress={() => setSelectedCat(c.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={c.icon as any}
                  size={14}
                  color={active ? '#FFFFFF' : '#0891B2'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.collectionPillText,
                    { color: active ? '#FFFFFF' : theme.textPrimary, fontWeight: active ? '700' : '500' },
                  ]}
                >
                  {c.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Menu Items List */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          {language === 'hi' ? 'विशेष पेय' : 'Signature Handcrafted Drinks'}
        </Text>

        <View style={styles.drinksGrid}>
          {filteredItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.drinkCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                AppShadows.subtle,
              ]}
            >
              <View style={styles.drinkImageWrap}>
                <Image source={{ uri: item.imageUrl }} style={styles.drinkImage} resizeMode="cover" />
                {item.badge && (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>{item.badge}</Text>
                  </View>
                )}
                <View style={styles.prepTimePill}>
                  <Ionicons name="time" size={10} color="#FFFFFF" />
                  <Text style={styles.prepTimeText}>{item.prepTime}</Text>
                </View>
              </View>

              <View style={styles.drinkContent}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={[styles.ratingNumber, { color: theme.textSecondary }]}>
                    {item.rating.toFixed(1)}
                  </Text>
                  <Text style={[styles.cafeName, { color: theme.textTertiary }]} numberOfLines={1}>
                    • {item.cafe}
                  </Text>
                </View>

                <Text style={[styles.drinkName, { color: theme.textPrimary }]} numberOfLines={2}>
                  {item.name}
                </Text>

                <View style={styles.drinkPriceRow}>
                  <Text style={[styles.drinkPrice, { color: '#0891B2' }]}>₹{item.price}</Text>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAddToCart(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                    <Text style={styles.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
  segmentContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
    marginBottom: AppSpacing.md,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: AppRadius.pill,
    gap: 6,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  collectionsScroll: {
    gap: AppSpacing.sm,
    marginBottom: AppSpacing.lg,
  },
  collectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
  },
  collectionPillText: { fontSize: 12 },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: AppSpacing.md,
  },
  drinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: AppSpacing.md,
  },
  drinkCard: {
    width: '48.5%',
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  drinkImageWrap: {
    width: '100%',
    height: 125,
    position: 'relative',
  },
  drinkImage: {
    width: '100%',
    height: '100%',
  },
  badgePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#0891B2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: AppRadius.xs,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  prepTimePill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: AppRadius.xs,
    gap: 3,
  },
  prepTimeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  drinkContent: {
    padding: AppSpacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 3,
  },
  ratingNumber: {
    fontSize: 11,
    fontWeight: '700',
  },
  cafeName: {
    fontSize: 10,
    flex: 1,
  },
  drinkName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    minHeight: 32,
    lineHeight: 16,
  },
  drinkPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drinkPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0891B2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AppRadius.xs,
    gap: 2,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
