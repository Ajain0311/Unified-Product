import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppSearchBar } from '../../components/common/AppSearchBar';
import { useMarketplaceStore } from '../../store/marketplaceStore';
import { ListingSummary, MarketplaceCategory } from '../../models/marketplace';
import { apiClient } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { absoluteImageUrl } from '../../services/documentService';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';

const QUICK_FILTERS = ['All', 'Featured', 'Under ₹10k', 'Like New'];

export const MarketplaceHomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [categories, setCategories] = useState<MarketplaceCategory[]>([{ id: 0, name: 'All' }]);
  const [serverListings, setServerListings] = useState<ListingSummary[]>([]);

  const { customListings, favorites, toggleFavorite } = useMarketplaceStore();

  const loadListings = useCallback(() => {
    apiClient
      .get<any>(ApiEndpoints.marketplace.categories)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data) && data.length > 0) {
          setCategories([{ id: 0, name: 'All' }, ...data]);
        }
      })
      .catch(() => {});

    apiClient
      .get<any>(ApiEndpoints.marketplace.listings)
      .then((res) => {
        const data = res.data?.data || res.data;
        const items = data?.items || data;
        if (Array.isArray(items)) {
          setServerListings(items);
        }
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [loadListings])
  );

  const allListings = useMemo(() => {
    const serverIds = new Set(serverListings.map((s) => s.id));
    const uniqueCustom = customListings.filter((c) => !serverIds.has(c.id));
    return [...uniqueCustom, ...serverListings];
  }, [customListings, serverListings]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allListings.filter((item) => {
      const matchesCategory = selectedCategoryId === 0 || item.categoryId === selectedCategoryId;
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q));

      let matchesFilter = true;
      if (selectedFilter === 'Featured') {
        matchesFilter = item.isFeatured;
      } else if (selectedFilter === 'Under ₹10k') {
        matchesFilter = item.price <= 10000;
      } else if (selectedFilter === 'Like New') {
        matchesFilter = item.condition === 'LIKE_NEW' || item.condition === 'NEW';
      }

      return matchesCategory && matchesQuery && matchesFilter;
    });
  }, [allListings, searchQuery, selectedCategoryId, selectedFilter]);

  const handleToggleFavorite = (id: number) => {
    toggleFavorite(id);
    apiClient.post(ApiEndpoints.marketplace.toggleFavorite(id)).catch(() => {});
  };

  const getCategoryIcon = (name: string): keyof typeof MaterialIcons.glyphMap => {
    switch (name) {
      case 'Mobiles': return 'phone-iphone';
      case 'Vehicles': return 'two-wheeler';
      case 'Electronics': return 'laptop-mac';
      case 'Furniture': return 'chair';
      case 'Fashion': return 'checkroom';
      case 'Books': return 'menu-book';
      case 'Sports': return 'fitness-center';
      case 'Others': return 'category';
      default: return 'grid-view';
    }
  };

  const getConditionColor = (cond: string) => {
    switch (cond?.toUpperCase()) {
      case 'NEW': return '#2563EB';
      case 'LIKE_NEW': return '#10B981';
      case 'USED': return '#D97706';
      default: return theme.textSecondary;
    }
  };

  const formatConditionText = (cond: string) => {
    switch (cond?.toUpperCase()) {
      case 'LIKE_NEW': return 'LIKE NEW';
      case 'NEW': return 'BRAND NEW';
      case 'USED': return 'GENTLY USED';
      default: return cond;
    }
  };

  const renderProductCard = ({ item }: { item: ListingSummary }) => {
    const isFav = favorites.includes(item.id) || item.isFavorite;
    const condColor = getConditionColor(item.condition);

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={[
          styles.productCard,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
          item.isFeatured && { borderColor: '#D97706' },
          AppShadows.subtle,
        ]}
        onPress={() => navigation.navigate('ListingDetail', { listingId: String(item.id) })}
      >
        <View style={styles.imageWrapper}>
          {absoluteImageUrl(item.primaryImageUrl || '') ? (
            <Image
              source={{ uri: absoluteImageUrl(item.primaryImageUrl || '')! }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, { backgroundColor: theme.chipBg }]}>
              <MaterialIcons name="image-not-supported" size={28} color={theme.textTertiary} />
            </View>
          )}

          {item.isFeatured && (
            <View style={styles.featuredRibbon}>
              <Text style={styles.featuredRibbonText}>FEATURED</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.heartButton}
            onPress={() => handleToggleFavorite(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name={isFav ? 'favorite' : 'favorite-border'}
              size={17}
              color={isFav ? '#EF4444' : '#FFFFFF'}
            />
          </TouchableOpacity>

          <View style={[styles.conditionBadge, { backgroundColor: `${condColor}20` }]}>
            <Text style={[styles.conditionBadgeText, { color: condColor }]}>
              {formatConditionText(item.condition)}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.productPrice, { color: theme.primary }]}>
            ₹{item.price.toFixed(0)}
          </Text>
          <Text numberOfLines={2} style={[styles.productTitle, { color: theme.textPrimary }]}>
            {item.title}
          </Text>

          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={12} color={theme.textTertiary} />
            <Text numberOfLines={1} style={[styles.locationText, { color: theme.textTertiary }]}>
              {item.location || 'Local Area'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        <View>
          <View style={styles.tagRow}>
            <View style={[styles.bazaarBadge, { backgroundColor: '#D9770620' }]}>
              <Text style={[styles.bazaarBadgeText, { color: '#D97706' }]}>CITY BAZAAR</Text>
            </View>
            <MaterialIcons name="verified-user" size={13} color="#10B981" />
            <Text style={[styles.verifiedText, { color: '#10B981' }]}>Verified Local Sellers</Text>
          </View>
          <Text style={[styles.titleText, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'कम्युनिटी मार्केटप्लेस' : 'Community Marketplace'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.shieldButton, { backgroundColor: theme.chipBg, borderColor: theme.cardBorder }]}
          onPress={() => Alert.alert('Safety & Trust', 'Safety tip: Always meet sellers in well-lit public spots!')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="security" size={19} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <AppSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search pre-loved electronics, bikes, furniture..."
          onClear={() => setSearchQuery('')}
        />
      </View>

      {/* Category Horizontal Carousel */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          data={categories}
          keyExtractor={(c) => String(c.id)}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedCategoryId;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                  },
                  AppShadows.subtle,
                ]}
                onPress={() => setSelectedCategoryId(item.id)}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={getCategoryIcon(item.name)}
                  size={15}
                  color={isSelected ? '#FFFFFF' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryText,
                    { color: isSelected ? '#FFFFFF' : theme.textPrimary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Quick Filter Chips */}
      <View style={styles.filtersSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          data={QUICK_FILTERS}
          keyExtractor={(f) => f}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                  },
                  AppShadows.subtle,
                ]}
                onPress={() => setSelectedFilter(item)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        renderItem={renderProductCard}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.chipBg }]}>
              <MaterialIcons name="search-off" size={44} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No items found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Try changing keywords or clearing the category filter.
            </Text>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategoryId(0);
                setSelectedFilter('All');
              }}
            >
              <Text style={styles.resetButtonText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Sell Item FAB */}
      <TouchableOpacity
        activeOpacity={0.88}
        style={[styles.fab, { backgroundColor: theme.primary }, AppShadows.float]}
        onPress={() => navigation.navigate('AddListing')}
      >
        <MaterialIcons name="camera-alt" size={19} color="#FFFFFF" />
        <Text style={styles.fabText}>Post Ad</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.md,
    borderBottomWidth: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  bazaarBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: AppRadius.xs,
  },
  bazaarBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  shieldButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    paddingBottom: AppSpacing.xs,
  },
  categoriesSection: {
    marginBottom: AppSpacing.sm,
  },
  categoriesList: {
    paddingHorizontal: AppSpacing.lg,
    gap: AppSpacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
    gap: 5,
  },
  categoryText: {
    fontSize: 12,
  },
  filtersSection: {
    marginBottom: AppSpacing.sm,
  },
  filtersList: {
    paddingHorizontal: AppSpacing.lg,
    gap: AppSpacing.xs,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.lg,
  },
  gridContent: {
    paddingBottom: 90,
    paddingTop: AppSpacing.xs,
  },
  productCard: {
    width: '48.5%',
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    marginBottom: AppSpacing.md,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredRibbon: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: AppRadius.xs,
  },
  featuredRibbonText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: AppRadius.xs,
  },
  conditionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardContent: {
    padding: AppSpacing.sm,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: AppRadius.pill,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: AppRadius.pill,
    gap: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
