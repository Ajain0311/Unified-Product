import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';

interface WaterBottleSupply {
  id: string;
  brand: string;
  name: string;
  volume: string;
  crateSize: number;
  casePrice: number;
  perBottlePrice: number;
  minOrderCases: number;
  imageUrl: string;
  isPopular?: boolean;
}

const WATER_SUPPLIES: WaterBottleSupply[] = [
  {
    id: 'wb-001',
    brand: 'Himalayan Natural',
    name: 'Natural Mineral Water (Glass Bottles)',
    volume: '330 ml',
    crateSize: 24,
    casePrice: 1080,
    perBottlePrice: 45,
    minOrderCases: 2,
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop',
    isPopular: true,
  },
  {
    id: 'wb-002',
    brand: 'Kinley / Bisleri Premium',
    name: 'Packaged Drinking Water (Eco Pet)',
    volume: '500 ml',
    crateSize: 24,
    casePrice: 240,
    perBottlePrice: 10,
    minOrderCases: 5,
    imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=800&auto=format&fit=crop',
    isPopular: true,
  },
  {
    id: 'wb-003',
    brand: 'Vedica Spring',
    name: 'Spring Water from Uttarakhand Hills',
    volume: '1000 ml',
    crateSize: 12,
    casePrice: 720,
    perBottlePrice: 60,
    minOrderCases: 3,
    imageUrl: 'https://images.unsplash.com/photo-1559839914-ba2ae647c050?w=800&auto=format&fit=crop',
  },
  {
    id: 'wb-004',
    brand: 'San Pellegrino / Perrier',
    name: 'Sparkling Mineral Water for Bars & Lounges',
    volume: '750 ml',
    crateSize: 12,
    casePrice: 1980,
    perBottlePrice: 165,
    minOrderCases: 1,
    imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800&auto=format&fit=crop',
  },
];

export const B2BWaterSuppliesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();

  const [quantities, setQuantities] = useState<{ [id: string]: number }>({
    'wb-001': 2,
    'wb-002': 5,
  });

  const updateQuantity = (id: string, delta: number, min: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next > 0 && next < min) {
        return { ...prev, [id]: min };
      }
      return { ...prev, [id]: next };
    });
  };

  const totalCases = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalAmount = WATER_SUPPLIES.reduce((sum, item) => {
    const qty = quantities[item.id] || 0;
    return sum + qty * item.casePrice;
  }, 0);

  const handleOrderSupplies = () => {
    if (totalAmount === 0) {
      Alert.alert('No Items Selected', 'Please select at least one crate of water bottles to order.');
      return;
    }
    Alert.alert(
      language === 'hi' ? 'थोक ऑर्डर बुक हुआ' : 'B2B Wholesale Order Confirmed',
      language === 'hi'
        ? `₹${totalAmount} का मिनरल वाटर ऑर्डर दर्ज हो गया है। जीएसटी चालान सहित डिलीवरी 24 घंटे में आपके पते पर होगी।`
        : `Your commercial water procurement order of ₹${totalAmount} (${totalCases} crates) has been dispatched. GST e-invoice generated.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
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
            {language === 'hi' ? 'थोक पानी की बोतलें' : 'B2B Water Procurement'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Wholesale crates, glass bottles & bar soda for hotels & lounges
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View
          style={[
            styles.bannerCard,
            { backgroundColor: isDark ? '#082F4930' : '#F0F9FF', borderColor: '#0284C744' },
          ]}
        >
          <View style={styles.bannerIconWrap}>
            <Ionicons name="water" size={22} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: '#0284C7' }]}>
              {language === 'hi' ? 'होटल और रेस्तरां के लिए सीधी B2B आपूर्ति' : 'Direct Manufacturer Rates & GST Input'}
            </Text>
            <Text style={[styles.bannerDesc, { color: theme.textSecondary }]}>
              {language === 'hi'
                ? 'कांच की बोतलें, प्रीमियम मिनरल वाटर और बार स्पार्कलिंग वाटर। जीएसटी चालान शामिल।'
                : 'Bulk cases delivered directly with verified GST input invoices & next-day scheduled dispatch.'}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          {language === 'hi' ? 'उपलब्ध पानी की किस्में' : 'Wholesale Water Catalog'}
        </Text>

        {WATER_SUPPLIES.map((item) => {
          const qty = quantities[item.id] || 0;
          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                AppShadows.subtle,
              ]}
            >
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
                {item.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>TOP CHOICE</Text>
                  </View>
                )}
              </View>

              <View style={styles.itemBody}>
                <Text style={[styles.brandText, { color: '#0284C7' }]}>{item.brand}</Text>
                <Text style={[styles.itemName, { color: theme.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.specText, { color: theme.textSecondary }]}>
                  {item.volume} • Case of {item.crateSize} Bottles
                </Text>

                <View style={styles.priceRow}>
                  <View>
                    <Text style={[styles.casePrice, { color: theme.primary }]}>
                      ₹{item.casePrice}
                      <Text style={[styles.perCaseText, { color: theme.textTertiary }]}> / crate</Text>
                    </Text>
                    <Text style={[styles.bottlePrice, { color: theme.textTertiary }]}>
                      (₹{item.perBottlePrice}/btl • Min {item.minOrderCases} crates)
                    </Text>
                  </View>

                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, -1, item.minOrderCases)}
                      style={[styles.qtyBtn, { backgroundColor: theme.chipBg }]}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="remove" size={16} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyValue, { color: theme.textPrimary }]}>{qty}</Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, 1, item.minOrderCases)}
                      style={[styles.qtyBtn, { backgroundColor: theme.chipBg }]}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="add" size={16} color={theme.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Bottom Order Bar */}
      {totalCases > 0 && (
        <View
          style={[
            styles.bottomBar,
            { backgroundColor: theme.surface, borderTopColor: theme.cardBorder },
            AppShadows.float,
          ]}
        >
          <View>
            <Text style={[styles.totalLabel, { color: theme.textTertiary }]}>
              {totalCases} Crates Selected
            </Text>
            <Text style={[styles.totalAmount, { color: theme.textPrimary }]}>₹{totalAmount}</Text>
          </View>
          <TouchableOpacity
            onPress={handleOrderSupplies}
            style={[styles.orderBtn, { backgroundColor: '#0284C7' }]}
            activeOpacity={0.88}
          >
            <Ionicons name="cart" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.orderBtnText}>
              {language === 'hi' ? 'थोक ऑर्डर दें' : 'Order Wholesale'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  scrollContent: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.md,
    paddingBottom: 110,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AppSpacing.md,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    marginBottom: AppSpacing.md,
  },
  bannerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: AppRadius.md,
    backgroundColor: '#0284C720',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bannerTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  bannerDesc: { fontSize: 11, lineHeight: 15 },
  sectionHeading: { fontSize: 16, fontWeight: '700', marginBottom: AppSpacing.md },
  itemCard: {
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    marginBottom: AppSpacing.md,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  itemImage: { width: '100%', height: '100%' },
  popularBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AppRadius.xs,
  },
  popularBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  itemBody: { padding: AppSpacing.md },
  brandText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  itemName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  specText: { fontSize: 12, marginBottom: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  casePrice: { fontSize: 17, fontWeight: '800' },
  perCaseText: { fontSize: 11, fontWeight: '400' },
  bottlePrice: { fontSize: 11, marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: AppRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { marginHorizontal: 12, fontSize: 15, fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.md,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 11 },
  totalAmount: { fontSize: 18, fontWeight: '800' },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: AppRadius.lg,
  },
  orderBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
