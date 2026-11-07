import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, ThemePalette } from '../../theme/themeStore';
import { AppRadius } from '../../theme/spacing';
import { AppConstants } from '../../constants/app';
import { CartItem } from '../../models/food';
import { useCartStore } from '../../store/cartStore';
import { apiClient } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { FormKeyboardAvoid } from '../../components/common/FormKeyboardAvoid';

interface CartSummarySheetProps {
  visible: boolean;
  onClose: () => void;
  restaurantName: string;
  restaurantId?: number;
  cartItems: CartItem[];
  deliveryFee?: number;
  onClear: () => void;
  onOrderPlaced: (couponCode?: string, paymentMethod?: 'COD' | 'ONLINE') => void;
  isSubmitting?: boolean;
}

export const CartSummarySheet: React.FC<CartSummarySheetProps> = ({
  visible,
  onClose,
  restaurantName,
  restaurantId,
  cartItems,
  deliveryFee = 0,
  onClear,
  onOrderPlaced,
  isSubmitting = false,
}) => {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');

  const itemTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountedSubtotal = Math.max(0, itemTotal - discountAmount);
  const taxesAndPackaging = Math.round(discountedSubtotal * 0.05 * 100) / 100; // 5% GST
  const grandTotal = discountedSubtotal + deliveryFee + taxesAndPackaging;
  const hotelCount = Array.from(
    new Set(cartItems.map((c) => c.restaurantId).filter((id): id is number => typeof id === 'number' && id > 0))
  ).length;
  const cartSubtitle =
    hotelCount > 1
      ? `Ordering from ${hotelCount} hotels (split into separate kitchen orders)`
      : `Ordering from ${restaurantName}`;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await apiClient.post<any>(ApiEndpoints.food.validateCoupon, {
        code: couponCode.trim().toUpperCase(),
        orderAmount: itemTotal,
        module: 'FOOD',
        restaurantId: hotelCount === 1 ? (restaurantId || cartItems[0]?.restaurantId) : undefined,
      });
      const data = res.data?.data || res.data;
      if (data?.isValid) {
        setAppliedCoupon(data.code || couponCode.trim().toUpperCase());
        setDiscountAmount(Number(data.discountAmount) || 0);
        setCouponMessage(data.message || `Coupon applied! You saved ₹${data.discountAmount}`);
      } else {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponMessage(data?.message || 'Invalid coupon code');
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponMessage(err?.message || 'Could not validate coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponMessage(null);
    setCouponCode('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <FormKeyboardAvoid>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitles}>
              <Text style={styles.title}>Your Cart Summary</Text>
              <Text style={styles.subtitle}>{cartSubtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Items List */}
            <View style={styles.itemsList}>
              {cartItems.map((item, idx) => (
                <View key={idx} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    {Boolean(item.portionName && item.portionName.length > 0) && (
                      <Text style={styles.itemPortion}>{item.portionName}</Text>
                    )}
                    {Boolean(item.addons && item.addons.length > 0) && (
                      <Text style={styles.itemAddons}>{item.addons.join(', ')}</Text>
                    )}
                  </View>
                  <View style={styles.itemRightRow}>
                    <View style={styles.cartStepperBox}>
                      <TouchableOpacity
                        style={styles.cartStepperBtn}
                        onPress={() => updateQuantity(item.cartLineKey || item.foodItemId, -1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="remove" size={14} color={theme.primary} />
                      </TouchableOpacity>
                      <Text style={styles.cartStepperQty}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.cartStepperBtn}
                        onPress={() => updateQuantity(item.cartLineKey || item.foodItemId, 1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={14} color={theme.primary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.itemPrice}>
                      {AppConstants.currency}
                      {item.totalPrice.toFixed(0)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Coupon Code Section */}
            <View style={styles.couponSection}>
              <View style={styles.couponInputRow}>
                <View style={styles.couponInputBox}>
                  <Ionicons name="pricetag-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Enter Coupon (e.g. WELCOME50)"
                    placeholderTextColor={theme.textTertiary}
                    value={couponCode}
                    onChangeText={setCouponCode}
                    autoCapitalize="characters"
                    editable={!appliedCoupon && !isValidatingCoupon}
                  />
                </View>
                {appliedCoupon ? (
                  <TouchableOpacity style={styles.removeCouponBtn} onPress={handleRemoveCoupon}>
                    <Text style={styles.removeCouponText}>Remove</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.applyCouponBtn, (!couponCode.trim() || isValidatingCoupon) && { opacity: 0.6 }]}
                    onPress={handleApplyCoupon}
                    disabled={!couponCode.trim() || isValidatingCoupon}
                  >
                    {isValidatingCoupon ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.applyCouponText}>Apply</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {couponMessage ? (
                <Text style={[styles.couponMessageText, appliedCoupon ? styles.couponSuccess : styles.couponError]}>
                  {couponMessage}
                </Text>
              ) : null}
            </View>

            {/* Bill Breakdown */}
            <View style={styles.billBox}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billValue}>
                  {AppConstants.currency}
                  {itemTotal.toFixed(0)}
                </Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: theme.secondary }]}>Coupon Discount ({appliedCoupon})</Text>
                  <Text style={[styles.billValue, { color: theme.secondary }]}>
                    -{AppConstants.currency}{discountAmount.toFixed(0)}
                  </Text>
                </View>
              )}

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Partner Fee</Text>
                {deliveryFee === 0 ? (
                  <Text style={[styles.billValue, styles.freeDeliveryText]}>FREE</Text>
                ) : (
                  <Text style={styles.billValue}>
                    {AppConstants.currency}{deliveryFee.toFixed(0)}
                  </Text>
                )}
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Govt. Taxes & Restaurant Packaging</Text>
                <Text style={styles.billValue}>
                  {AppConstants.currency}
                  {taxesAndPackaging.toFixed(0)}
                </Text>
              </View>

              <Text style={[styles.billLabel, { marginBottom: 8 }]}>Payment</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {(['COD', 'ONLINE'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: paymentMethod === method ? theme.primary : theme.cardBorder,
                      backgroundColor: paymentMethod === method ? (isDark ? 'rgba(255, 90, 31, 0.2)' : '#FFF3EE') : 'transparent',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>
                      {method === 'COD' ? 'Cash on delivery' : 'Pay online'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.billDivider} />

              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>
                  {AppConstants.currency}
                  {grandTotal.toFixed(0)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Bar */}
          <View style={styles.actionsBar}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                onClear();
                handleRemoveCoupon();
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.placeOrderButton, isSubmitting && { opacity: 0.7 }]}
              onPress={() => onOrderPlaced(appliedCoupon || undefined, paymentMethod)}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.placeOrderText}>
                {isSubmitting
                  ? 'Placing Order...'
                  : `Place Food Order    ${AppConstants.currency}${grandTotal.toFixed(0)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </FormKeyboardAvoid>
    </Modal>
  );
};

const createStyles = (theme: ThemePalette, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 14,
    },
    headerTitles: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      padding: 4,
    },
    divider: {
      height: 1,
      backgroundColor: theme.cardBorder,
    },
    scrollArea: {
      paddingHorizontal: 20,
    },
    itemsList: {
      paddingTop: 16,
      paddingBottom: 8,
    },
    itemCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    itemInfo: {
      flex: 1,
      paddingRight: 16,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    itemPortion: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    itemAddons: {
      fontSize: 11,
      color: theme.textTertiary,
      marginTop: 2,
    },
    itemRightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cartStepperBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    cartStepperBtn: {
      padding: 3,
    },
    cartStepperQty: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: '800',
      paddingHorizontal: 8,
    },
    itemPrice: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    couponSection: {
      marginVertical: 12,
      backgroundColor: theme.inputBg,
      padding: 12,
      borderRadius: AppRadius.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    couponInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    couponInputBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: AppRadius.sm,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginRight: 10,
    },
    couponInput: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '600',
      padding: 0,
    },
    applyCouponBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: AppRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    applyCouponText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    removeCouponBtn: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: AppRadius.sm,
      borderWidth: 1,
      borderColor: theme.error,
    },
    removeCouponText: {
      color: theme.error,
      fontWeight: '700',
      fontSize: 13,
    },
    couponMessageText: {
      fontSize: 12,
      marginTop: 8,
      fontWeight: '600',
    },
    couponSuccess: {
      color: theme.secondary,
    },
    couponError: {
      color: theme.error,
    },
    billBox: {
      backgroundColor: theme.inputBg,
      borderRadius: AppRadius.md,
      padding: 16,
      marginVertical: 12,
    },
    billRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    billLabel: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    billValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    freeDeliveryText: {
      color: theme.secondary,
      fontWeight: '700',
    },
    billDivider: {
      height: 1,
      backgroundColor: theme.cardBorder,
      marginVertical: 10,
    },
    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
    },
    grandTotalLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    grandTotalValue: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.primary,
    },
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      backgroundColor: theme.surface,
    },
    clearButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginRight: 10,
      borderRadius: AppRadius.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    placeOrderButton: {
      flex: 1,
      backgroundColor: theme.primary,
      paddingVertical: 14,
      borderRadius: AppRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeOrderText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
