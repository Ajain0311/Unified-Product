import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/themeStore';

export const GrowWithSuperAppScreen: React.FC = () => {
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const partnerJourneys = [
    {
      id: 'restaurant',
      title: 'Restaurant Partner',
      subtitle: 'Cloud kitchens, fine dining, quick bites & cafes',
      icon: 'restaurant-outline',
      badge: 'Food Ecosystem',
      action: () => navigation.navigate('RoleApplication', { role: 'RESTAURANT_OWNER' }),
    },
    {
      id: 'driver',
      title: 'Delivery & Ride Partner',
      subtitle: 'City cabs, bike taxis, auto & parcel logistics',
      icon: 'car-outline',
      badge: 'Mobility',
      action: () => navigation.navigate('RoleApplication', { role: 'DRIVER' }),
    },
    {
      id: 'seller',
      title: 'Marketplace Seller',
      subtitle: 'Mobiles, electronics, vehicles & local retail',
      icon: 'storefront-outline',
      badge: 'City Bazaar',
      action: () => navigation.navigate('AddListing'),
    },
    {
      id: 'hotel',
      title: 'Hotel & Stays Host',
      subtitle: 'Heritage palaces, luxury resorts & budget stays',
      icon: 'business-outline',
      badge: 'Hospitality',
      action: () => navigation.navigate('HotelOwnerDashboard'),
    },
    {
      id: 'bar',
      title: 'Bar & Lounge Partner',
      subtitle: 'Rooftops, craft breweries & curated nightlife',
      icon: 'wine-outline',
      badge: 'Nightlife',
      action: () => navigation.navigate('BarHub'),
    },
    {
      id: 'beverage',
      title: 'Cafe & Beverage Specialist',
      subtitle: 'Artisan roasters, juice bars & cold brews',
      icon: 'cafe-outline',
      badge: 'Beverages',
      action: () => navigation.navigate('BeverageHub'),
    },
    {
      id: 'supplies',
      title: 'B2B Water & Bulk Goods Supplier',
      subtitle: '20L water cans, corporate orders & bulk delivery',
      icon: 'water-outline',
      badge: 'Commercial',
      action: () => navigation.navigate('B2BWaterSupplies'),
    },
  ];

  const requestOptions = [
    {
      type: 'NEW_PRODUCT',
      title: 'Request a New Product / Item',
      description: 'Want to sell water bottles, beverages, packaged food, or items not yet in catalogue?',
      icon: 'cube-outline',
      color: '#3B82F6',
    },
    {
      type: 'NEW_CATEGORY',
      title: 'Propose a New Category',
      description: 'Propose brand new sub-categories (e.g. Organic Farm Dairy, Event Photography).',
      icon: 'grid-outline',
      color: '#10B981',
    },
    {
      type: 'NEW_MODULE',
      title: 'Propose a Business Module',
      description: 'Request new verticals (Pharmacy, Grocery, Laundry, Home Services).',
      icon: 'layers-outline',
      color: '#8B5CF6',
    },
    {
      type: 'PARTNERSHIP',
      title: 'Custom Partnership / Corporate',
      description: 'Enterprise fleet supply, institutional catering, or exclusive regional franchise.',
      icon: 'briefcase-outline',
      color: '#F59E0B',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Grow with SuperApp</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textTertiary }]}>
            Business Onboarding & Ecosystem Center
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('MyBusinessRequests')}
          style={[styles.trackButton, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
          activeOpacity={0.8}
        >
          <Ionicons name="receipt-outline" size={14} color={theme.accent} />
          <Text style={[styles.trackButtonText, { color: theme.accent }]}>My Requests</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[styles.heroIconBadge, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="trending-up" size={24} color={theme.accent} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
            Expand Your Business Across Chittorgarh & Rajasthan
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Join the fastest-growing consumer super app. Get direct access to thousands of daily active
            customers, real-time logistics, instant digital settlements, and full operational transparency.
          </Text>

          <View style={[styles.heroStatsRow, { borderTopColor: theme.cardBorder }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.accent }]}>0%</Text>
              <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Listing Fee</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.accent }]}>Instant</Text>
              <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Bank Payouts</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.accent }]}>24/7</Text>
              <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Dedicated Desk</Text>
            </View>
          </View>
        </View>

        {/* Section: Request Center */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>New Product & Service Center</Text>
        <Text style={[styles.sectionSub, { color: theme.textTertiary }]}>
          Submit requests to list new products, propose new categories, or launch new modules.
        </Text>

        <View style={styles.requestGrid}>
          {requestOptions.map((opt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() =>
                navigation.navigate('SubmitBusinessRequest', {
                  defaultType: opt.type,
                })
              }
              style={[
                styles.requestCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
              activeOpacity={0.75}
            >
              <View style={[styles.requestIconWrap, { backgroundColor: opt.color + '15' }]}>
                <Ionicons name={opt.icon as any} size={22} color={opt.color} />
              </View>
              <Text style={[styles.requestTitle, { color: theme.textPrimary }]}>{opt.title}</Text>
              <Text style={[styles.requestDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                {opt.description}
              </Text>
              <View style={styles.requestFooter}>
                <Text style={[styles.submitLink, { color: theme.accent }]}>Submit Request</Text>
                <Ionicons name="arrow-forward" size={12} color={theme.accent} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section: Partner Onboarding Journeys */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary, marginTop: 24 }]}>
          Partner Onboarding Journeys
        </Text>
        <Text style={[styles.sectionSub, { color: theme.textTertiary }]}>
          Select your business vertical to start onboarding.
        </Text>

        {partnerJourneys.map(p => (
          <TouchableOpacity
            key={p.id}
            onPress={p.action}
            style={[styles.partnerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            activeOpacity={0.75}
          >
            <View style={[styles.partnerIconWrap, { backgroundColor: theme.surface }]}>
              <Ionicons name={p.icon as any} size={24} color={theme.accent} />
            </View>
            <View style={styles.partnerInfo}>
              <View style={styles.partnerTitleRow}>
                <Text style={[styles.partnerTitle, { color: theme.textPrimary }]}>{p.title}</Text>
                <View style={[styles.partnerBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.partnerBadgeText, { color: theme.accent }]}>{p.badge}</Text>
                </View>
              </View>
              <Text style={[styles.partnerSubtitle, { color: theme.textSecondary }]}>{p.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  trackButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    marginBottom: 14,
  },
  requestGrid: {
    gap: 10,
    marginBottom: 8,
  },
  requestCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  requestIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  requestDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  submitLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  partnerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  partnerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  partnerBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  partnerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  partnerSubtitle: {
    fontSize: 11,
  },
});
