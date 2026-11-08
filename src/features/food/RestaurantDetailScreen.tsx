import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme, ThemePalette } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { AppRadius } from '../../theme/spacing';
import { AppConstants } from '../../constants/app';
import { RatingBadge } from '../../components/common/RatingBadge';
import { ScreenBackButton } from '../../components/common/ScreenBackButton';
import { VegBadge } from '../../components/common/VegBadge';
import { ItemCustomizationSheet } from './ItemCustomizationSheet';
import { CartSummarySheet } from './CartSummarySheet';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { CartItem, FoodItemVariant, FoodItemAddon } from '../../models/food';
import { apiClient, createIdempotencyKey } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { absoluteImageUrl } from '../../services/documentService';
import { shadowStyle } from '../../utils/platformStyles';
import { isAuthenticationError } from '../../utils/authErrors';

const DEFAULT_DISH_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';

function resolveDishImage(url?: string): string {
  if (!url || !url.trim()) return DEFAULT_DISH_IMAGE;
  return absoluteImageUrl(url);
}

interface RestaurantDetailScreenProps {
  route: {
    params: {
      restaurantId: string;
    };
  };
  navigation: any;
}

interface FoodItemRow {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  isVeg: boolean;
  isAvailable?: boolean;
  isBestseller: boolean;
  isCustomizable: boolean;
  image: string;
  variants?: FoodItemVariant[];
  addons?: FoodItemAddon[];
}

export const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const parsedParamId = Number(route.params?.restaurantId);
  const restaurantNumericId = Number.isInteger(parsedParamId) && parsedParamId > 0 ? parsedParamId : null;
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItemForCustomization, setActiveItemForCustomization] = useState<FoodItemRow | null>(null);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [restaurantBusinessType, setRestaurantBusinessType] = useState('RESTAURANT');
  const [restaurantRating, setRestaurantRating] = useState<number>(4.5);
  const [restaurantDeliveryFee, setRestaurantDeliveryFee] = useState<number>(0);
  const [restaurantCuisines, setRestaurantCuisines] = useState<string>('Dishes & Delights');
  const [foodItems, setFoodItems] = useState<FoodItemRow[]>([]);
  const [menuCategories, setMenuCategories] = useState<string[]>(['All']);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const checkoutIdempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const paymentIdempotencyKeysRef = useRef(new Map<string, string>());

  const cartItems = useCartStore((state) => state.items);
  const addItemToCart = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getItemTotal = useCartStore((state) => state.getItemTotal);


  const loadRestaurantData = () => {
    if (!restaurantNumericId) {
      setIsLoadingMenu(false);
      setLoadError('Invalid restaurant specified.');
      return;
    }
    setIsLoadingMenu(true);
    setLoadError(null);
    apiClient
      .get<any>(ApiEndpoints.food.restaurantDetail(restaurantNumericId))
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data) {
          if (data.name) setRestaurantName(data.name);
          if (data.businessType) setRestaurantBusinessType(String(data.businessType).toUpperCase());
          if (data.rating) setRestaurantRating(Number(data.rating));
          if (data.deliveryFee !== undefined) setRestaurantDeliveryFee(Number(data.deliveryFee));
          // Subtitle should stay short — full description can blow up the app bar
          const cuisineText = (data.cuisines || data.city || data.description || '').toString().trim();
          if (cuisineText) {
            setRestaurantCuisines(
              cuisineText.length > 60 ? `${cuisineText.slice(0, 57)}…` : cuisineText
            );
          }

          const categoryList: any[] = Array.isArray(data.categories) ? data.categories : [];
          const fromCategories: FoodItemRow[] = categoryList.flatMap((cat: any) =>
            (cat.items || []).map((it: any) => ({
              id: it.id,
              name: it.name,
              category: cat.name || it.category || 'Specials',
              price: it.discountedPrice || it.basePrice || it.price,
              description: it.description || '',
              isVeg: Boolean(it.isVeg),
              isAvailable: it.isAvailable !== undefined ? Boolean(it.isAvailable) : true,
              isBestseller: Boolean(it.isBestseller),
              isCustomizable: Boolean(it.variants?.length || it.addons?.length),
              image: it.imageUrl || '',
              variants: it.variants || [],
              addons: it.addons || [],
            }))
          );
          const fromItems: FoodItemRow[] = Array.isArray(data.items)
            ? data.items.map((it: any) => ({
                id: it.id,
                name: it.name,
                category: it.category || 'Specials',
                price: it.discountedPrice || it.basePrice || it.price,
                description: it.description || '',
                isVeg: Boolean(it.isVeg),
                isAvailable: it.isAvailable !== undefined ? Boolean(it.isAvailable) : true,
                isBestseller: Boolean(it.isBestseller),
                isCustomizable: Boolean(it.variants?.length || it.addons?.length),
                image: it.imageUrl || '',
                variants: it.variants || [],
                addons: it.addons || [],
              }))
            : [];
          const mapped = fromCategories.length > 0 ? fromCategories : fromItems;
          setFoodItems(mapped);
          const cats = ['All', ...Array.from(new Set(mapped.map((m: FoodItemRow) => m.category)))];
          setMenuCategories(cats as string[]);
        }
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.message || 'Unable to load menu. Please check your network connection.';
        setLoadError(msg);
      })
      .finally(() => {
        setIsLoadingMenu(false);
      });
  };

  useEffect(() => {
    loadRestaurantData();
  }, [restaurantNumericId]);

  const filteredItems = foodItems.filter((f) => {
    // Category filter
    if (selectedCategoryIndex > 0) {
      if (f.category !== menuCategories[selectedCategoryIndex]) return false;
    }
    // Search query filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = f.name.toLowerCase().includes(q);
      const matchDesc = (f.description || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const handlePlaceOrder = async (couponCode?: string, paymentMethod: 'COD' | 'ONLINE' = 'COD') => {
    if (isPlacingOrder) return;
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before proceeding to checkout.');
      return;
    }

    // Check authentication: if guest or token expired, trigger seamless in-place OTP verification modal
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      useAuthModalStore.getState().openAuthModal({
        title: 'Sign In to Place Order',
        subtitle: 'Enter your phone number & verify OTP right here to complete your order.',
        onSuccess: () => {
          // Re-trigger order placement automatically after verifying OTP
          handlePlaceOrder(couponCode, paymentMethod);
        },
      });
      return;
    }
    const restaurantIds = Array.from(
      new Set(
        cartItems
          .map((c) => c.restaurantId)
          .filter((id): id is number => typeof id === 'number' && id > 0)
          .concat(restaurantNumericId ? [restaurantNumericId] : [])
      )
    );
    if (paymentMethod === 'ONLINE' && restaurantIds.length > 1) {
      Alert.alert(
        'Online payment',
        'Online payment works for one hotel at a time. Use COD for multi-hotel carts, or remove other hotels from the cart.'
      );
      return;
    }
    if (couponCode && restaurantIds.length > 1) {
      Alert.alert('Coupon', 'Coupons apply to single-hotel checkouts only. Remove the coupon or keep one hotel in the cart.');
      return;
    }
    setIsPlacingOrder(true);
    try {
      let addressId: number | null = null;
      try {
        const addrRes = await apiClient.get<any>(ApiEndpoints.common.addresses);
        const raw = addrRes.data?.data || addrRes.data;
        const items = Array.isArray(raw) ? raw : [];
        const def = items.find((a: any) => a.isDefault) || items[0];
        if (def?.id) addressId = def.id;
      } catch {
        addressId = null;
      }

      const payload = {
        items: cartItems.map((c) => ({
          foodItemId: c.foodItemId,
          quantity: c.quantity,
          variantId: c.variantId ?? null,
          selectedAddonIds: c.selectedAddonIds || [],
        })),
        addressId,
        couponCode: couponCode || null,
        paymentMethod,
        notes: 'Leave at front door',
      };
      const checkoutFingerprint = JSON.stringify({ restaurantId: restaurantNumericId, payload });
      if (checkoutIdempotencyRef.current?.fingerprint !== checkoutFingerprint) {
        checkoutIdempotencyRef.current = { fingerprint: checkoutFingerprint, key: createIdempotencyKey() };
      }
      const res = await apiClient.post<any>(ApiEndpoints.food.checkout, payload, {
        headers: { 'Idempotency-Key': checkoutIdempotencyRef.current.key },
      });
      const data = res.data?.data || res.data;
      const orders = Array.isArray(data?.orders) ? data.orders : data?.id ? [data] : [];
      if (!orders.length || !orders[0]?.id) {
        throw new Error(data?.message || 'Order could not be confirmed by the server.');
      }
      const primary = orders[0];
      const orderId = primary.orderNumber || `FO-${primary.id}`;
      const orderNumericId = primary.id;
      if (paymentMethod === 'ONLINE') {
        const paymentKey = (operation: string) => {
          const mapKey = `${operation}:${orderNumericId}`;
          if (!paymentIdempotencyKeysRef.current.has(mapKey))
            paymentIdempotencyKeysRef.current.set(mapKey, createIdempotencyKey());
          return paymentIdempotencyKeysRef.current.get(mapKey)!;
        };
        let pay: any = null;
        try {
          const payRes = await apiClient.post<any>(ApiEndpoints.food.payOrder(orderNumericId), {}, {
            headers: { 'Idempotency-Key': paymentKey('food-payment') },
          });
          pay = payRes.data?.data || payRes.data;
        } catch (payErr: any) {
          const status = payErr?.response?.status;
          if (status === 404 || status === 501) {
            const created = await apiClient.post<any>(ApiEndpoints.common.paymentsCreate, {
              amount: Number(primary.grandTotal) || 1,
              currency: 'INR',
              receiptId: String(orderNumericId),
              module: 'FOOD',
            }, { headers: { 'Idempotency-Key': paymentKey('payment-intent') } });
            pay = created.data?.data || created.data;
          } else {
            throw payErr;
          }
        }
        if (!pay?.accessKey || !pay?.keyId) {
          throw new Error(pay?.errorMessage || pay?.message || 'Online payment could not be started. Check Razorpay keys on the server.');
        }
        const { openRazorpayCheckout } = await import('../../services/razorpayCheckout');
        const checkout = await openRazorpayCheckout(pay);
        const verified = await apiClient.post<any>(ApiEndpoints.common.paymentsVerify, {
          transactionId: checkout.razorpay_payment_id,
          orderId: checkout.razorpay_order_id || pay.orderId,
          paymentSignature: checkout.razorpay_signature || '',
        });
        const verifiedBody = verified.data?.data || verified.data;
        if (!verifiedBody?.isVerified) {
          throw new Error(verifiedBody?.message || 'Razorpay did not confirm this payment. The order stays unpaid.');
        }
      }
      clearCart();
      checkoutIdempotencyRef.current = null;
      setIsCartVisible(false);
      const checkoutGroupId = data?.checkoutGroupId;
      try {
        const { playOrderPlacedChime } = await import('../../services/feedbackSound');
        playOrderPlacedChime();
      } catch {
        /* sound is optional UX */
      }
      if (orders.length > 1) {
        Alert.alert(
          'Orders Placed!',
          `${orders.length} kitchen orders created (one per hotel) under one coordinated delivery!`
        );
      }
      navigation.navigate('FoodOrderTracking', {
        orderId,
        orderNumericId,
        checkoutGroupId,
      });
    } catch (err: any) {
      console.error('[PlaceOrder Error]', err);
      // If 401 unauthorized or authentication expired, open in-place modal and retry
      if (isAuthenticationError(err)) {
        useAuthModalStore.getState().openAuthModal({
          title: 'Sign In to Complete Order',
          subtitle: 'Please verify your phone number right here to complete your order.',
          onSuccess: () => {
            handlePlaceOrder(couponCode, paymentMethod);
          },
        });
        return;
      }
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to place order. Please try again.';
      Alert.alert('Order Placement Failed', errMsg);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const confirmAndAddItem = (cartItem: CartItem) => {
    if (!restaurantNumericId) {
      Alert.alert('Invalid Restaurant', 'Cannot add items from an invalid restaurant.');
      return;
    }
    addItemToCart(restaurantNumericId, restaurantName, cartItem);
  };

  const handleAddItem = (item: FoodItemRow) => {
    if (restaurantBusinessType === 'BAR') {
      Alert.alert('Menu browsing only', 'Bar and lounge orders are not enabled. Please contact the venue directly.');
      return;
    }
    if (item.isAvailable === false) {
      Alert.alert('Item Sold Out', `${item.name} is currently out of stock.`);
      return;
    }
    if (item.isCustomizable) {
      setActiveItemForCustomization(item);
    } else {
      const cartItem: CartItem = {
        id: Date.now(),
        foodItemId: item.id,
        name: item.name,
        basePrice: item.price,
        quantity: 1,
        variantId: null,
        selectedAddonIds: [],
        addons: [],
        totalPrice: item.price,
      };
      confirmAndAddItem(cartItem);
    }
  };

  const handleCustomizationComplete = (
    quantity: number,
    portionName: string,
    portionPrice: number,
    addons: string[],
    grandTotal: number,
    variantId?: number | null,
    selectedAddonIds?: number[]
  ) => {
    if (!activeItemForCustomization) return;
    const cartItem: CartItem = {
      id: Date.now(),
      foodItemId: activeItemForCustomization.id,
      name: activeItemForCustomization.name,
      basePrice: activeItemForCustomization.price,
      quantity,
      portionName,
      portionPrice,
      addons,
      variantId: variantId ?? null,
      selectedAddonIds: selectedAddonIds || [],
      totalPrice: grandTotal,
    };
    confirmAndAddItem(cartItem);
    setActiveItemForCustomization(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.appBar}>
        <ScreenBackButton
          fallback={() => navigation.navigate('MainTabs', { screen: 'Food' })}
          accessibilityLabel="Back to Food"
          testID="restaurant-back-btn"
        />

        <View style={styles.titleCol}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {restaurantName}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {restaurantCuisines || 'Fresh & Delicious'}
          </Text>
        </View>

        <RatingBadge rating={restaurantRating || 4.5} />
      </View>

      <View style={styles.contentContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Real Search Dishes Input */}
          <View style={styles.searchBarBox}>
            <Ionicons name="search-outline" size={18} color={theme.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dishes or categories..."
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Loading / Error States */}
          {isLoadingMenu && (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={{ ...styles.dishDesc, marginTop: 8, color: theme.textSecondary }}>
                Loading fresh menu...
              </Text>
            </View>
          )}

          {loadError && !isLoadingMenu && (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 20 }}>
              <Ionicons name="alert-circle-outline" size={40} color={theme.error} />
              <Text style={{ ...styles.dishName, color: theme.error, marginTop: 8, textAlign: 'center' }}>
                {loadError}
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { marginTop: 14, width: 120 }]}
                onPress={loadRestaurantData}
              >
                <Text style={styles.addButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Category Pills - Connected to backend menuCategories */}
          {!isLoadingMenu && !loadError && menuCategories.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {menuCategories.map((cat, idx) => {
                const isSelected = idx === selectedCategoryIndex;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.categoryPill, isSelected ? styles.categoryPillActive : null]}
                    onPress={() => setSelectedCategoryIndex(idx)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.categoryText, isSelected ? styles.categoryTextActive : null]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Dishes List */}
          {!isLoadingMenu && !loadError && filteredItems.map((item) => (
            <View key={item.id} style={styles.dishCard}>
              {/* Left Details */}
              <View style={styles.dishDetails}>
                <View style={styles.badgesRow}>
                  <VegBadge isVeg={item.isVeg} size={15} />
                  {item.isBestseller && (
                    <View style={styles.bestsellerTag}>
                      <Text style={styles.bestsellerText}>BESTSELLER</Text>
                    </View>
                  )}
                  {item.isAvailable === false && (
                    <View style={[styles.bestsellerTag, { backgroundColor: theme.surfaceLight, borderWidth: 1, borderColor: theme.error }]}>
                      <Text style={[styles.bestsellerText, { color: theme.error }]}>SOLD OUT</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.dishName}>{item.name}</Text>
                <Text style={styles.dishPrice}>
                  {AppConstants.currency}
                  {item.price.toFixed(0)}
                </Text>
                <Text style={styles.dishDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              {/* Right Image + Add Button */}
              <View style={styles.dishActionCol}>
                <Image source={{ uri: resolveDishImage(item.image) }} style={styles.dishImage} />
                {(() => {
                  if (restaurantBusinessType === 'BAR') {
                    return <Text style={[styles.customizableLabel, { color: theme.textTertiary, textAlign: 'center' }]}>VIEW MENU</Text>;
                  }
                  if (item.isAvailable === false) {
                    return (
                      <View style={[styles.addButton, { backgroundColor: theme.surfaceLight, borderColor: theme.cardBorder }]}>
                        <Text style={[styles.addButtonText, { color: theme.textTertiary }]}>OUT</Text>
                      </View>
                    );
                  }
                  const qty = getItemQuantity(item.id);
                  if (qty > 0) {
                    return (
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item.id, -1)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="remove" size={16} color={theme.primary} />
                        </TouchableOpacity>
                        <Text style={styles.stepperQtyText}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => {
                            if (item.isCustomizable) {
                              setActiveItemForCustomization(item);
                            } else {
                              if (qty >= 30) {
                                Alert.alert('Limit Reached', 'Maximum quantity of 30 items reached for this dish.');
                                return;
                              }
                              updateQuantity(item.id, 1);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={16} color={theme.primary} />
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  return (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleAddItem(item)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name}`}
                      testID={`add-dish-btn-${item.id}`}
                    >
                      <Text style={styles.addButtonText}>
                        {language === 'hi' ? 'जोड़ें +' : 'ADD +'}
                      </Text>
                    </TouchableOpacity>
                  );
                })()}
                {item.isCustomizable && item.isAvailable !== false && (
                  <Text style={styles.customizableLabel}>
                    {language === 'hi' ? 'कस्टमाइज़ेबल' : 'CUSTOMISABLE'}
                  </Text>
                )}
              </View>
            </View>
          ))}
          {!isLoadingMenu && !loadError && filteredItems.length === 0 && (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
              <Ionicons name="fast-food-outline" size={48} color={theme.textTertiary} />
              <Text style={{ ...styles.dishName, marginTop: 12, color: theme.textSecondary, textAlign: 'center' }}>
                No dishes found
              </Text>
              <Text style={{ fontSize: 13, color: theme.textTertiary, marginTop: 4, textAlign: 'center' }}>
                {searchQuery ? `No results matching "${searchQuery}"` : 'Please select another category or check back later.'}
              </Text>
            </View>
          )}

          {/* Bottom spacing for floating cart */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Cart Bar */}
        {cartItems.length > 0 && (
          <View style={styles.floatingCartContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setIsCartVisible(true)}
              style={styles.floatingCartTouch}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.floatingCartGradient}
              >
                <View>
                  <Text style={styles.cartItemsCount}>
                    {cartItems.length} ITEM{cartItems.length > 1 ? 'S' : ''}
                  </Text>
                  <Text style={styles.cartTotalAmount}>
                    {AppConstants.currency}
                    {getItemTotal().toFixed(0)} plus taxes
                  </Text>
                </View>

                <View style={styles.viewCartRight}>
                  <Text style={styles.viewCartText}>
                    {language === 'hi' ? 'कार्ट देखें' : 'View Cart'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Item Customization Modal */}
      {activeItemForCustomization && (
        <ItemCustomizationSheet
          visible={Boolean(activeItemForCustomization)}
          itemName={activeItemForCustomization.name}
          basePrice={activeItemForCustomization.price}
          variants={activeItemForCustomization.variants}
          addons={activeItemForCustomization.addons}
          onClose={() => setActiveItemForCustomization(null)}
          onAddToCart={handleCustomizationComplete}
        />
      )}

      {/* Cart Summary Modal */}
      <CartSummarySheet
        visible={isCartVisible}
        onClose={() => setIsCartVisible(false)}
        restaurantName={restaurantName}
        restaurantId={restaurantNumericId ?? undefined}
        cartItems={cartItems}
        deliveryFee={restaurantDeliveryFee}
        onClear={clearCart}
        isSubmitting={isPlacingOrder}
        onOrderPlaced={handlePlaceOrder}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: ThemePalette, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    appBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      backgroundColor: theme.surface,
      zIndex: 2,
    },
    titleCol: {
      flex: 1,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    headerSubtitle: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
    contentContainer: {
      flex: 1,
      position: 'relative',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    searchBarBox: {
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderRadius: AppRadius.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 14,
      marginBottom: 14,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: theme.textPrimary,
      fontSize: 14,
      paddingVertical: 0,
    },
    searchPlaceholder: {
      color: theme.textTertiary,
      fontSize: 13,
    },
    categoriesRow: {
      paddingRight: 16,
      marginBottom: 18,
    },
    categoryPill: {
      backgroundColor: theme.chipBg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
    },
    categoryPillActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    categoryText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },
    categoryTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    dishCard: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 16,
      marginBottom: 14,
    },
    dishDetails: {
      flex: 1,
      marginRight: 14,
    },
    badgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    bestsellerTag: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
    bestsellerText: {
      color: isDark ? '#FBBF24' : '#D97706',
      fontSize: 9,
      fontWeight: '800',
    },
    dishName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    dishPrice: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 6,
    },
    dishDesc: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 16,
    },
    dishActionCol: {
      alignItems: 'center',
    },
    dishImage: {
      width: 96,
      height: 84,
      borderRadius: 14,
      backgroundColor: theme.surfaceLight,
      marginBottom: 8,
    },
    addButton: {
      width: 96,
      height: 36,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.primary,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    stepperContainer: {
      width: 96,
      height: 36,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.primary,
      backgroundColor: theme.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },
    stepperBtn: {
      padding: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperQtyText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '900',
    },
    customizableLabel: {
      color: theme.textTertiary,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginTop: 3,
    },
    floatingCartContainer: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
    },
    floatingCartTouch: {
      borderRadius: 16,
      ...shadowStyle({
        color: theme.primary,
        offsetY: 6,
        opacity: 0.4,
        radius: 18,
        elevation: 8,
      }),
    },
    floatingCartGradient: {
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cartItemsCount: {
      color: 'rgba(255, 255, 255, 0.75)',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    cartTotalAmount: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
    },
    viewCartRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewCartText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      marginRight: 4,
    },
  });
