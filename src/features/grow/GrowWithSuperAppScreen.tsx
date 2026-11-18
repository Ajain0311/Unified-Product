import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/themeStore';

type ActiveTab = 'grow' | 'propose';

export const GrowWithSuperAppScreen: React.FC = () => {
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<ActiveTab>('grow');

  // Tab 1: Grow with SuperApp (Partner & Business Onboarding)
  const partnerJourneys = [
    {
      id: 'driver',
      title: 'Become a Rider / Driver',
      subtitle: 'City cabs, bike taxis, auto & parcel logistics',
      icon: 'car-outline',
      badge: 'Mobility',
      action: () => navigation.navigate('RoleApplication', { role: 'DRIVER' }),
    },
    {
      id: 'restaurant',
      title: 'Open / Partner a Restaurant',
      subtitle: 'Cloud kitchens, fine dining, quick bites & cafes',
      icon: 'restaurant-outline',
      badge: 'Food & Dining',
      action: () => navigation.navigate('RoleApplication', { role: 'RESTAURANT_OWNER' }),
    },
    {
      id: 'hotel',
      title: 'Open / Host a Hotel & Stays',
      subtitle: 'Heritage palaces, luxury resorts & budget stays',
      icon: 'business-outline',
      badge: 'Hospitality',
      action: () => navigation.navigate('HotelOwnerDashboard'),
    },
    {
      id: 'seller',
      title: 'Marketplace Seller / Store',
      subtitle: 'Mobiles, electronics, vehicles & local retail',
      icon: 'storefront-outline',
      badge: 'City Bazaar',
      action: () => navigation.navigate('AddListing'),
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

  // Tab 2: Propose a Solution (Request a new product, category, or service)
  const solutionProposals = [
    {
      type: 'NEW_PRODUCT',
      title: 'Request a New Product / Item',
      description: 'Want to sell or buy water bottles, beverages, packaged snacks, or items not yet listed?',
      icon: 'cube-outline',
      color: '#3B82F6',
      badge: 'Product Request',
    },
    {
      type: 'NEW_CATEGORY',
      title: 'Propose a New Category',
      description: 'Propose brand new sub-categories (e.g. Organic Farm Dairy, Event Photography, Bakeries).',
      icon: 'grid-outline',
      color: '#10B981',
      badge: 'Category Expansion',
    },
    {
      type: 'NEW_MODULE',
      title: 'Propose a Business Module',
      description: 'Propose new verticals for Chittorgarh (Pharmacy, Grocery, Laundry, Home Services, Rentals).',
      icon: 'layers-outline',
      color: '#8B5CF6',
      badge: 'Module Proposal',
    },
    {
      type: 'PARTNERSHIP',
      title: 'Custom Partnership / Corporate Solution',
      description: 'Enterprise fleet supply, institutional catering, event bulk orders, or franchise partnership.',
      icon: 'briefcase-outline',
      color: '#F59E0B',
      badge: 'Enterprise',
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
            Partner Onboarding & Solution Proposals
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

      {/* Modern 2-Tab Segment Switcher */}
      <View style={[styles.tabBarContainer, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'grow' && [styles.activeTabButton, { backgroundColor: theme.accent }],
          ]}
          onPress={() => setActiveTab('grow')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="trending-up"
            size={16}
            color={activeTab === 'grow' ? '#FFFFFF' : theme.textSecondary}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'grow' ? '#FFFFFF' : theme.textSecondary },
              activeTab === 'grow' && styles.activeTabText,
            ]}
          >
            Grow with SuperApp
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'propose' && [styles.activeTabButton, { backgroundColor: theme.accent }],
          ]}
          onPress={() => setActiveTab('propose')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="bulb-outline"
            size={16}
            color={activeTab === 'propose' ? '#FFFFFF' : theme.textSecondary}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'propose' ? '#FFFFFF' : theme.textSecondary },
              activeTab === 'propose' && styles.activeTabText,
            ]}
          >
            Propose a Solution
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TAB 1: Grow with SuperApp */}
        {activeTab === 'grow' && (
          <View>
            {/* Hero Card */}
            <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.heroIconBadge, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="trending-up" size={24} color={theme.accent} />
              </View>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                Expand Your Business with Zupify
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Join Chittorgarh's premier ecosystem. Choose your journey below to onboard as a rider, open a hotel/restaurant, or start your store.
              </Text>

              <View style={[styles.heroStatsRow, { borderTopColor: theme.cardBorder }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.accent }]}>0%</Text>
                  <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Setup Fee</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.accent }]}>Instant</Text>
                  <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Direct Payouts</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.accent }]}>24/7</Text>
                  <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Support Desk</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              Select Your Business Onboarding
            </Text>
            <Text style={[styles.sectionSub, { color: theme.textTertiary }]}>
              Tap any category below to register and start earning immediately.
            </Text>

            {partnerJourneys.map((p) => (
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
          </View>
        )}

        {/* TAB 2: Propose a Solution (Request a new product / feature) */}
        {activeTab === 'propose' && (
          <View>
            {/* Solution Hero Card */}
            <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.heroIconBadge, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="bulb" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                Propose a Solution or New Product
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Have a product, fresh category idea, or new service you want on SuperApp? Propose your solution directly to our business team.
              </Text>

              <TouchableOpacity
                style={[styles.quickSubmitButton, { backgroundColor: theme.accent }]}
                onPress={() =>
                  navigation.navigate('SubmitBusinessRequest', {
                    defaultType: 'NEW_PRODUCT',
                  })
                }
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.quickSubmitText}>Submit Custom Proposal</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              What Would You Like to Propose?
            </Text>
            <Text style={[styles.sectionSub, { color: theme.textTertiary }]}>
              Choose a proposal track below to request products or features.
            </Text>

            <View style={styles.solutionList}>
              {solutionProposals.map((sol, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() =>
                    navigation.navigate('SubmitBusinessRequest', {
                      defaultType: sol.type,
                    })
                  }
                  style={[
                    styles.solutionCard,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}
                  activeOpacity={0.75}
                >
                  <View style={styles.solutionHeader}>
                    <View style={[styles.solutionIconWrap, { backgroundColor: sol.color + '15' }]}>
                      <Ionicons name={sol.icon as any} size={22} color={sol.color} />
                    </View>
                    <View style={[styles.solutionBadge, { backgroundColor: sol.color + '15' }]}>
                      <Text style={[styles.solutionBadgeText, { color: sol.color }]}>{sol.badge}</Text>
                    </View>
                  </View>

                  <Text style={[styles.solutionTitle, { color: theme.textPrimary }]}>{sol.title}</Text>
                  <Text style={[styles.solutionDesc, { color: theme.textSecondary }]}>
                    {sol.description}
                  </Text>

                  <View style={styles.solutionFooter}>
                    <Text style={[styles.solutionLinkText, { color: sol.color }]}>Submit Proposal</Text>
                    <Ionicons name="arrow-forward" size={14} color={sol.color} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
  tabBarContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeTabButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  tabIcon: {
    marginRight: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
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
  quickSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  quickSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
  solutionList: {
    gap: 12,
  },
  solutionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  solutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  solutionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solutionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  solutionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  solutionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  solutionDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  solutionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  solutionLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
