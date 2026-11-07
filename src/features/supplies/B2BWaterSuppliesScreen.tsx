import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { apiClient, createIdempotencyKey } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { useAppTheme } from '../../theme/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { isAuthenticationError } from '../../utils/authErrors';
import { AppRadius, AppSpacing } from '../../theme/spacing';

type Product = { id: number; supplierId: number; supplierName: string; city: string; brand: string; name: string; bottleSize: string; bottlesPerCase: number; casePrice: number; minimumCases: number; availableCases: number };
type Order = { id: number; orderNumber: string; supplierName: string; deliveryAddress: string; status: string; paymentStatus: string; totalAmount: number; invoiceNumber?: string; createdAt: string };
type Quote = { id: number; supplierName: string; deliveryAddress: string; deliveryCity: string; status: string; supplierNotes?: string; lines: { productId: number; productName: string; cases: number; offeredCasePrice?: number }[] };

export const B2BWaterSuppliesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useAppTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [productsResponse, ordersResponse, quotesResponse] = await Promise.all([
        apiClient.get<any>(ApiEndpoints.water.products, { params: { page: 1, pageSize: 50 } }),
        useAuthStore.getState().isAuthenticated
          ? apiClient.get<any>(ApiEndpoints.water.myOrders, { suppressAuthPrompt: true })
          : Promise.resolve(null),
        useAuthStore.getState().isAuthenticated
          ? apiClient.get<any>(ApiEndpoints.water.myQuotes, { suppressAuthPrompt: true })
          : Promise.resolve(null),
      ]);
      const p = productsResponse?.data ?? productsResponse;
      const items = p?.items ?? p?.data?.items ?? [];
      if (!Array.isArray(items)) throw new Error('Supplier catalogue response was invalid');
      setProducts(items);
      const o = ordersResponse?.data?.data ?? ordersResponse?.data ?? [];
      setOrders(Array.isArray(o) ? o : []);
      const q = quotesResponse?.data?.data ?? quotesResponse?.data ?? [];
      setQuotes(Array.isArray(q) ? q : []);
    } catch (e: any) { setError(e?.message || 'Could not load verified supplier catalogue.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const selectedProducts = products.filter(p => (quantities[p.id] || 0) > 0);
  const selectedSupplierId = selectedProducts[0]?.supplierId;
  const selectedSupplierName = selectedProducts[0]?.supplierName;
  const total = selectedProducts.reduce((sum, product) => sum + product.casePrice * quantities[product.id], 0);

  const adjust = (product: Product, delta: number) => {
    setQuantities(current => {
      const currentQuantity = current[product.id] || 0;
      const next = Math.max(0, currentQuantity + delta);
      if (next > 0 && next < product.minimumCases) return { ...current, [product.id]: product.minimumCases };
      const otherSupplierSelected = Object.entries(current).some(([id, qty]) => qty > 0 && products.find(p => p.id === Number(id))?.supplierId !== product.supplierId);
      if (next > 0 && otherSupplierSelected) {
        Alert.alert('One supplier per order', 'Submit one order per supplier so each business can fulfill and invoice it independently.');
        return current;
      }
      return { ...current, [product.id]: next };
    });
  };

  const submitProcurement = async (mode: 'ORDER' | 'QUOTE') => {
    if (!selectedSupplierId || selectedProducts.length === 0) return;
    if (!useAuthStore.getState().isAuthenticated) {
      useAuthModalStore.getState().openAuthModal({ title: mode === 'QUOTE' ? 'Sign in to request a quote' : 'Sign in to order supplies', subtitle: 'Verify your phone number to continue.', onSuccess: () => { void submitProcurement(mode); } });
      return;
    }
    if (!deliveryAddress.trim() || !deliveryCity.trim()) { Alert.alert('Delivery details required', 'Enter the business delivery address and city.'); return; }
    setSubmitting(true);
    try {
      await apiClient.post(mode === 'ORDER' ? ApiEndpoints.water.orders : ApiEndpoints.water.quotes, {
        supplierId: selectedSupplierId,
        deliveryAddress: deliveryAddress.trim(),
        deliveryCity: deliveryCity.trim(),
        notes: mode === 'QUOTE' ? 'Please provide a wholesale quotation for these cases.' : undefined,
        lines: selectedProducts.map(product => ({ productId: product.id, cases: quantities[product.id] })),
      }, { headers: { 'Idempotency-Key': createIdempotencyKey() } });
      setCheckoutOpen(false); setQuantities({}); setDeliveryAddress('');
      Alert.alert(mode === 'ORDER' ? 'Order submitted' : 'Quote requested', mode === 'ORDER' ? 'The verified supplier must accept the order before it is fulfilled. Invoice status will be shown in order history.' : 'The supplier will return a line-item wholesale offer in your quote history.');
      await load(true);
    } catch (e: any) {
      if (isAuthenticationError(e)) {
        useAuthModalStore.getState().openAuthModal({
          title: 'Session expired',
          subtitle: 'Verify your phone number to continue this order.',
          onSuccess: () => { void submitProcurement(mode); },
        });
        return;
      }
      Alert.alert('Order not placed', e?.message || 'Please refresh and try again.');
    }
    finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={20} color={theme.textPrimary} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={[styles.title, { color: theme.textPrimary }]}>B2B Water Supply</Text><Text style={[styles.subtitle, { color: theme.textSecondary }]}>Wholesale cases from verified suppliers</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
        <View style={[styles.intro, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}><Ionicons name="business-outline" size={20} color={theme.primary} /><Text style={[styles.introText, { color: theme.textSecondary }]}>Case prices and available stock come from supplier-managed inventory. Orders are invoiced only after supplier acceptance.</Text></View>
        <TouchableOpacity onPress={() => navigation.navigate('WaterSupplierDashboard')} style={[styles.supplierLink, { borderColor: theme.cardBorder }]}><Ionicons name="storefront-outline" size={16} color={theme.primary} /><Text style={[styles.supplierLinkText, { color: theme.primary }]}>Supplier workspace</Text></TouchableOpacity>
        {loading ? <ActivityIndicator style={styles.state} color={theme.primary} /> : null}
        {!loading && error ? <View style={styles.state}><Text style={[styles.message, { color: theme.textSecondary }]}>{error}</Text><TouchableOpacity onPress={() => load()}><Text style={{ color: theme.primary, fontWeight: '700' }}>Try again</Text></TouchableOpacity></View> : null}
        {!loading && !error && products.length === 0 ? <View style={styles.state}><Ionicons name="water-outline" size={34} color={theme.textTertiary} /><Text style={[styles.message, { color: theme.textSecondary }]}>No verified suppliers have published available products yet.</Text></View> : null}
        {products.map(product => {
          const qty = quantities[product.id] || 0;
          return <View key={product.id} style={[styles.product, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.productIcon}><Ionicons name="water" size={20} color={theme.primary} /></View>
            <View style={{ flex: 1 }}><Text style={[styles.brand, { color: theme.primary }]}>{product.brand} · {product.supplierName}</Text><Text style={[styles.name, { color: theme.textPrimary }]}>{product.name}</Text><Text style={[styles.detail, { color: theme.textSecondary }]}>{product.bottleSize} · {product.bottlesPerCase} bottles/case · {product.city}</Text><Text style={[styles.price, { color: theme.textPrimary }]}>₹{product.casePrice.toFixed(2)} / case <Text style={[styles.detail, { color: theme.textTertiary }]}>· min {product.minimumCases} cases · stock {product.availableCases}</Text></Text></View>
            <View style={styles.qty}><TouchableOpacity disabled={qty === 0} onPress={() => adjust(product, -1)} style={[styles.qtyButton, { backgroundColor: theme.chipBg }]}><Ionicons name="remove" size={17} color={theme.textPrimary} /></TouchableOpacity><Text style={[styles.qtyText, { color: theme.textPrimary }]}>{qty}</Text><TouchableOpacity disabled={qty >= product.availableCases} onPress={() => adjust(product, 1)} style={[styles.qtyButton, { backgroundColor: theme.chipBg }]}><Ionicons name="add" size={17} color={theme.textPrimary} /></TouchableOpacity></View>
          </View>;
        })}
        {quotes.length > 0 ? <><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Wholesale quotations</Text>{quotes.map(quote => <View key={quote.id} style={[styles.order, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}><Text style={[styles.name, { color: theme.textPrimary }]}>{quote.supplierName} · {quote.status}</Text>{quote.lines.map(line => <Text key={line.productId} style={[styles.detail, { color: theme.textSecondary }]}>{line.productName} × {line.cases}{line.offeredCasePrice != null ? ` cases · ₹${line.offeredCasePrice.toFixed(2)}/case` : ' cases · awaiting offer'}</Text>)}{quote.supplierNotes ? <Text style={[styles.detail, { color: theme.textSecondary }]}>{quote.supplierNotes}</Text> : null}{quote.status === 'QUOTED' ? <TouchableOpacity onPress={async () => { try { await apiClient.post(ApiEndpoints.water.acceptQuote(quote.id), {}, { headers: { 'Idempotency-Key': createIdempotencyKey() } }); await load(true); Alert.alert('Quote accepted', 'A bulk order has been created at the quoted rates.'); } catch (e: any) { Alert.alert('Could not accept quote', e?.message || 'Refresh and retry.'); } }} style={[styles.orderButton, { backgroundColor: theme.primary, alignSelf: 'flex-end', marginTop: 8 }]}><Text style={styles.orderButtonText}>Accept quote</Text></TouchableOpacity> : null}</View>)}</> : null}
        {orders.length > 0 ? <><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent orders & invoices</Text>{orders.map(order => <View key={order.id} style={[styles.order, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}><Text style={[styles.name, { color: theme.textPrimary }]}>{order.supplierName}</Text><Text style={[styles.detail, { color: theme.textSecondary }]}>{order.orderNumber} · {order.status} · {order.paymentStatus}</Text><Text style={[styles.detail, { color: theme.textSecondary }]}>{order.invoiceNumber ? `Invoice ${order.invoiceNumber}` : 'Invoice pending supplier acceptance'} · ₹{order.totalAmount.toFixed(2)}</Text></View>)}</> : null}
      </ScrollView>
      {selectedProducts.length > 0 ? <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.cardBorder }]}><View style={{ flex: 1 }}><Text style={[styles.detail, { color: theme.textSecondary }]}>{selectedSupplierName} · {selectedProducts.reduce((n, p) => n + quantities[p.id], 0)} cases</Text><Text style={[styles.total, { color: theme.textPrimary }]}>₹{total.toFixed(2)}</Text></View><TouchableOpacity onPress={() => setCheckoutOpen(true)} style={[styles.orderButton, { backgroundColor: theme.primary }]}><Text style={styles.orderButtonText}>Review order</Text></TouchableOpacity></View> : null}
      <Modal visible={checkoutOpen} transparent animationType="fade" onRequestClose={() => setCheckoutOpen(false)}><View style={styles.modalBackdrop}><View style={[styles.modal, { backgroundColor: theme.surface }]}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Delivery for {selectedSupplierName}</Text><Text style={[styles.label, { color: theme.textSecondary }]}>Business delivery address</Text><TextInput value={deliveryAddress} onChangeText={setDeliveryAddress} style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder }]} placeholder="Street, building, area" placeholderTextColor={theme.textTertiary} /><Text style={[styles.label, { color: theme.textSecondary }]}>Delivery city</Text><TextInput value={deliveryCity} onChangeText={setDeliveryCity} style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder }]} placeholder="City served by supplier" placeholderTextColor={theme.textTertiary} /><Text style={[styles.note, { color: theme.textSecondary }]}>The server rechecks supplier coverage, minimum quantities, current stock and live case prices when placing an order. Quotations do not reserve inventory.</Text><View style={styles.actions}><TouchableOpacity onPress={() => setCheckoutOpen(false)} style={[styles.cancelButton, { borderColor: theme.cardBorder }]}><Text style={[styles.actionText, { color: theme.textPrimary }]}>Back</Text></TouchableOpacity><TouchableOpacity disabled={submitting} onPress={() => submitProcurement('QUOTE')} style={[styles.cancelButton, { borderColor: theme.cardBorder }]}>{submitting ? <ActivityIndicator color={theme.primary} /> : <Text style={[styles.actionText, { color: theme.primary }]}>Request quote</Text>}</TouchableOpacity><TouchableOpacity disabled={submitting} onPress={() => submitProcurement('ORDER')} style={[styles.orderButton, { backgroundColor: theme.primary }]}>{submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.orderButtonText}>Place order</Text>}</TouchableOpacity></View></View></View></Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: AppSpacing.lg, paddingVertical: AppSpacing.md, borderBottomWidth: 1 }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: AppSpacing.md }, title: { fontSize: 18, fontWeight: '700' }, subtitle: { fontSize: 12, marginTop: 3 }, content: { padding: AppSpacing.lg, paddingBottom: 120 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: AppRadius.md, padding: AppSpacing.md, marginBottom: AppSpacing.md }, introText: { flex: 1, fontSize: 12, lineHeight: 17 }, state: { minHeight: 170, alignItems: 'center', justifyContent: 'center', gap: 12 }, message: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  supplierLink: { flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, borderRadius: AppRadius.md, marginBottom: AppSpacing.md }, supplierLinkText: { fontWeight: '700', fontSize: 12 },
  product: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: AppRadius.md, padding: AppSpacing.md, marginBottom: AppSpacing.sm, gap: 10 }, productIcon: { width: 36, height: 36, borderRadius: AppRadius.md, backgroundColor: '#168BB21A', alignItems: 'center', justifyContent: 'center' }, brand: { fontSize: 11, fontWeight: '700' }, name: { fontSize: 14, fontWeight: '700', marginTop: 3 }, detail: { fontSize: 11, marginTop: 3, lineHeight: 15 }, price: { fontSize: 13, fontWeight: '700', marginTop: 5 }, qty: { alignItems: 'center', gap: 7 }, qtyButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: AppRadius.sm }, qtyText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: AppSpacing.lg, marginBottom: AppSpacing.sm }, order: { borderWidth: 1, borderRadius: AppRadius.md, padding: AppSpacing.md, marginBottom: AppSpacing.sm }, bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: AppSpacing.lg, paddingVertical: AppSpacing.md, borderTopWidth: 1, gap: 10 }, total: { fontSize: 17, fontWeight: '800', marginTop: 2 }, orderButton: { minWidth: 125, minHeight: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: AppRadius.md }, orderButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: '#0009', justifyContent: 'center', padding: AppSpacing.lg }, modal: { borderRadius: AppRadius.lg, padding: AppSpacing.lg }, label: { marginTop: 12, marginBottom: 5, fontSize: 12 }, input: { borderWidth: 1, borderRadius: AppRadius.md, paddingHorizontal: 12, paddingVertical: 10 }, note: { marginTop: 12, fontSize: 12, lineHeight: 17 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 }, cancelButton: { borderWidth: 1, borderRadius: AppRadius.md, minWidth: 80, minHeight: 40, alignItems: 'center', justifyContent: 'center' }, actionText: { fontWeight: '700' },
});
