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

interface WaterBottleSupply {
  id: string;
  brand: string;
  name: string;
  volume: string;
  crateSize: number; // e.g. 24 bottles per case
  casePrice: number; // in INR
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
    name: 'Spring Water from Uttarakhand',
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
      language === 'hi' ? 'थोक ऑर्डर बुक हुआ' : 'Bulk Supply Order Confirmed',
      language === 'hi'
        ? `₹${totalAmount} का मिनरल वाटर ऑर्डर दर्ज हो गया है। डिलीवरी 24 घंटे में आपके होटल/रेस्तरां पर होगी।`
        : `Your wholesale B2B water order of ₹${totalAmount} (${totalCases} crates) has been dispatched for hotel/restaurant delivery within 24 hours.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

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
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'थोक पानी की बोतलें (होटल और बार)' : 'B2B Water Supplies for Hotels & Bars'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Wholesale crates, glass bottles & sparkling water for hotels, bars & restaurants
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={[styles.bannerCard, { backgroundColor: '#0284C718', borderColor: '#0284C740' }]}>
          <Ionicons name="water" size={26} color="#0284C7" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: '#0284C7' }]}>
              {language === 'hi' ? 'होटल और रेस्तरां के लिए सीधी B2B आपूर्ति' : 'Direct Wholesale Rates for Hospitality'}
            </Text>
            <Text style={[styles.bannerDesc, { color: theme.textSecondary }]}>
              {language === 'hi'
                ? 'कांच की बोतलें, प्रीमियम मिनरल वाटर और बार स्पार्कलिंग वाटर। जीएसटी चालान शामिल।'
                : 'Direct manufacturer wholesale pricing, recurring delivery, GST invoices & bulk payment settlement.'}
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
              style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
              {item.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Best Seller</Text>
                </View>
              )}

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
                      <Text style={[styles.perCaseText, { color: theme.textSecondary }]}> / crate</Text>
                    </Text>
                    <Text style={[styles.bottlePrice, { color: theme.textTertiary }]}>
                      (₹{item.perBottlePrice} / bottle • Min {item.minOrderCases} crates)
                    </Text>
                  </View>

                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, -1, item.minOrderCases)}
                      style={[styles.qtyBtn, { backgroundColor: theme.surfaceHover }]}
                    >
                      <Ionicons name="remove" size={16} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyValue, { color: theme.textPrimary }]}>{qty}</Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, 1, item.minOrderCases)}
                      style={[styles.qtyBtn, { backgroundColor: theme.surfaceHover }]}
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
        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <View>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
              {totalCases} Crates Selected
            </Text>
            <Text style={[styles.totalAmount, { color: theme.primary }]}>₹{totalAmount}</Text>
          </View>
          <TouchableOpacity
            onPress={handleOrderSupplies}
            style={[styles.orderBtn, { backgroundColor: '#0284C7' }]}
          >
            <Ionicons name="cart" size={18} color="#FFF" style={{ marginRight: 6 }} />
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
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  bannerDesc: { fontSize: 11, lineHeight: 15 },
  sectionHeading: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  itemCard: { borderRadius: 14, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  itemImage: { width: '100%', height: 140 },
  popularBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popularBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  itemBody: { padding: 14 },
  brandText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  itemName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  specText: { fontSize: 12, marginBottom: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  casePrice: { fontSize: 17, fontWeight: '800' },
  perCaseText: { fontSize: 11, fontWeight: '400' },
  bottlePrice: { fontSize: 10, marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 11 },
  totalAmount: { fontSize: 18, fontWeight: '800' },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  orderBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
