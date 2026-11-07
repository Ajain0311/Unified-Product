import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { documentService } from '../../services/documentService';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { isAuthenticationError } from '../../utils/authErrors';
import { useAppTheme } from '../../theme/themeStore';
import { AppRadius, AppSpacing } from '../../theme/spacing';

type Supplier = { id: number; businessName: string; status: string; adminNotes?: string };
type Product = { id: number; brand: string; name: string; bottleSize: string; bottlesPerCase: number; casePrice: number; minimumCases: number; availableCases: number };
type Order = { id: number; orderNumber: string; status: string; totalAmount: number; invoiceNumber?: string; supplierName: string; lines: { productName: string; cases: number }[] };
type Quote = { id: number; supplierName: string; status: string; buyerNotes?: string; lines: { productId: number; productName: string; cases: number; offeredCasePrice?: number }[] };
const payload = (response: any) => response?.data?.data ?? response?.data;

export const WaterSupplierDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useAppTheme();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteRates, setQuoteRates] = useState<Record<number, Record<number, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docNo, setDocNo] = useState('');
  const [docName, setDocName] = useState('');
  const [form, setForm] = useState({ businessName: '', contactPhone: '', address: '', city: '', deliveryCities: '', minimumDeliveryValue: '' });
  const [product, setProduct] = useState({ brand: '', name: '', bottleSize: '', bottlesPerCase: '', casePrice: '', minimumCases: '', availableCases: '' });

  const withAuthRetry = (error: any, retry: () => void): boolean => {
    if (!isAuthenticationError(error)) return false;
    useAuthModalStore.getState().openAuthModal({
      title: 'Session expired',
      subtitle: 'Verify your phone number to continue.',
      onSuccess: retry,
    });
    return true;
  };

  const load = useCallback(async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      setLoading(false);
      useAuthModalStore.getState().openAuthModal({ title: 'Supplier sign in', subtitle: 'Sign in with OTP to manage supplier onboarding and orders.', onSuccess: () => { void load(); } });
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get<any>(ApiEndpoints.water.supplier, { suppressAuthPrompt: true });
      const current = payload(response);
      setSupplier(current);
      if (current?.status === 'APPROVED') {
        const [productResult, orderResult, quoteResult] = await Promise.all([
          apiClient.get<any>(ApiEndpoints.water.supplierProducts, { suppressAuthPrompt: true }),
          apiClient.get<any>(ApiEndpoints.water.supplierOrders, { suppressAuthPrompt: true }),
          apiClient.get<any>(ApiEndpoints.water.supplierQuotes, { suppressAuthPrompt: true }),
        ]);
        setProducts(payload(productResult) || []);
        setOrders(payload(orderResult) || []);
        setQuotes(payload(quoteResult) || []);
      }
    } catch (error: any) {
      if (withAuthRetry(error, () => { void load(); })) return;
      if (error?.statusCode !== 404) Alert.alert('Supplier portal unavailable', error?.message || 'Please retry.');
      setSupplier(null);
    } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const uploadDocument = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permission required', 'Allow photo access to upload your business verification document.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]?.uri) return;
    setSaving(true);
    try {
      const uploaded = await documentService.upload(result.assets[0].uri, 'water-supplier-business-document.jpg');
      setDocNo(uploaded.documentNo); setDocName(uploaded.documentName);
    } catch (error: any) { Alert.alert('Upload failed', error?.message || 'Please try again.'); }
    finally { setSaving(false); }
  };

  const submitApplication = async () => {
    if (!docNo) { Alert.alert('Verification document required', 'Upload your business registration document first.'); return; }
    setSaving(true);
    try {
      await apiClient.post(ApiEndpoints.water.applySupplier, { ...form, minimumDeliveryValue: Number(form.minimumDeliveryValue || 0), businessDocumentNo: docNo });
      Alert.alert('Application submitted', 'An administrator will verify your business details before catalogue publication.');
      await load();
    } catch (error: any) {
      if (withAuthRetry(error, () => { void submitApplication(); })) return;
      Alert.alert('Could not submit', error?.message || 'Please review the details and retry.');
    }
    finally { setSaving(false); }
  };

  const createProduct = async () => {
    const body = { ...product, bottlesPerCase: Number(product.bottlesPerCase), casePrice: Number(product.casePrice), minimumCases: Number(product.minimumCases), availableCases: Number(product.availableCases), isActive: true };
    if (!body.brand.trim() || !body.name.trim() || !body.bottleSize.trim() || Object.values(body).some(v => typeof v === 'number' && !Number.isFinite(v))) { Alert.alert('Product details required', 'Complete every product and pricing field with valid numbers.'); return; }
    setSaving(true);
    try { await apiClient.post(ApiEndpoints.water.createProduct, body); setProduct({ brand: '', name: '', bottleSize: '', bottlesPerCase: '', casePrice: '', minimumCases: '', availableCases: '' }); await load(); }
    catch (error: any) {
      if (withAuthRetry(error, () => { void createProduct(); })) return;
      Alert.alert('Could not save product', error?.message || 'Please retry.');
    }
    finally { setSaving(false); }
  };

  const advanceOrder = async (order: Order) => {
    const next: Record<string, string> = { PENDING: 'ACCEPTED', ACCEPTED: 'PREPARING', PREPARING: 'DISPATCHED', DISPATCHED: 'DELIVERED' };
    const status = next[order.status];
    if (!status) return;
    const action = status === 'ACCEPTED' ? 'accept this order and issue its unpaid invoice' : `move this order to ${status.toLowerCase()}`;
    Alert.alert('Update order?', `This will ${action}.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: async () => {
      try { await apiClient.put(ApiEndpoints.water.updateOrderStatus(order.id), { status }); await load(); }
      catch (error: any) {
        if (withAuthRetry(error, () => { void advanceOrder(order); })) return;
        Alert.alert('Could not update', error?.message || 'Refresh the order and try again.');
      }
    } }]);
  };

  const submitQuoteOffer = async (quote: Quote) => {
    const rates = quoteRates[quote.id] || {};
    const lines = quote.lines.map(line => ({ productId: line.productId, casePrice: Number(rates[line.productId]) }));
    if (lines.some(line => !Number.isFinite(line.casePrice) || line.casePrice <= 0)) { Alert.alert('Enter all quote rates', 'Add a positive price per case for every requested product.'); return; }
    try { await apiClient.put(ApiEndpoints.water.offerQuote(quote.id), { lines }); await load(); }
    catch (error: any) {
      if (withAuthRetry(error, () => { void submitQuoteOffer(quote); })) return;
      Alert.alert('Could not send quotation', error?.message || 'Refresh and retry.');
    }
  };

  const setField = (key: keyof typeof form, value: string) => setForm(old => ({ ...old, [key]: value }));
  const setProductField = (key: keyof typeof product, value: string) => setProduct(old => ({ ...old, [key]: value }));

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={20} color={theme.textPrimary} /></TouchableOpacity><View><Text style={[styles.title, { color: theme.textPrimary }]}>Supplier Workspace</Text><Text style={[styles.subtitle, { color: theme.textSecondary }]}>Verification, catalogue and fulfillment</Text></View></View>
    <ScrollView contentContainerStyle={styles.content}>
      {loading ? <ActivityIndicator style={{ marginTop: 80 }} color={theme.primary} /> : null}
      {!loading && !supplier ? <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Apply as a water supplier</Text><Text style={[styles.hint, { color: theme.textSecondary }]}>Your products remain private until an administrator verifies the submitted business document.</Text>
        {([['businessName', 'Business name'], ['contactPhone', 'Business phone'], ['address', 'Business address'], ['city', 'Operating city'], ['deliveryCities', 'Delivery cities (comma separated)'], ['minimumDeliveryValue', 'Minimum delivery value'] ] as [keyof typeof form, string][]).map(([key, label]) => <View key={key}><Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text><TextInput value={form[key]} onChangeText={v => setField(key, v)} keyboardType={key === 'minimumDeliveryValue' ? 'decimal-pad' : 'default'} style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder }]} /></View>)}
        <TouchableOpacity onPress={uploadDocument} style={[styles.secondaryButton, { borderColor: theme.cardBorder }]}><Ionicons name="document-attach-outline" size={17} color={theme.primary} /><Text style={[styles.buttonText, { color: theme.primary }]}>{docName || 'Upload business document'}</Text></TouchableOpacity><TouchableOpacity disabled={saving} onPress={submitApplication} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>{saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Submit for review</Text>}</TouchableOpacity>
      </View> : null}
      {!loading && supplier?.status === 'PENDING' ? <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Application under review</Text><Text style={[styles.hint, { color: theme.textSecondary }]}>Your supplier profile and products will become available after approval.</Text></View> : null}
      {!loading && supplier?.status === 'REJECTED' ? <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Application needs attention</Text><Text style={[styles.hint, { color: theme.textSecondary }]}>{supplier.adminNotes || 'Contact support for next steps.'}</Text></View> : null}
      {!loading && supplier?.status === 'APPROVED' ? <>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Add a wholesale product</Text>{([['brand', 'Brand'], ['name', 'Product name'], ['bottleSize', 'Bottle size / packaging'], ['bottlesPerCase', 'Bottles per case'], ['casePrice', 'Wholesale price per case'], ['minimumCases', 'Minimum cases'], ['availableCases', 'Available stock (cases)']] as [keyof typeof product, string][]).map(([key, label]) => <View key={key}><Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text><TextInput value={product[key]} onChangeText={v => setProductField(key, v)} keyboardType={key === 'bottleSize' || key === 'brand' || key === 'name' ? 'default' : 'decimal-pad'} style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder }]} /></View>)}<TouchableOpacity disabled={saving} onPress={createProduct} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>{saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Publish product</Text>}</TouchableOpacity></View>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Your catalogue</Text>{products.map(p => <View key={p.id} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}><View style={{ flex: 1 }}><Text style={[styles.productName, { color: theme.textPrimary }]}>{p.brand} · {p.name}</Text><Text style={[styles.hint, { color: theme.textSecondary }]}>{p.bottleSize} · {p.bottlesPerCase}/case · ₹{p.casePrice.toFixed(2)} · MOQ {p.minimumCases} · stock {p.availableCases}</Text></View></View>)}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Incoming orders</Text>{orders.length === 0 ? <Text style={[styles.hint, { color: theme.textSecondary }]}>No orders yet.</Text> : orders.map(o => <View key={o.id} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}><View style={{ flex: 1 }}><Text style={[styles.productName, { color: theme.textPrimary }]}>{o.orderNumber} · {o.status}</Text><Text style={[styles.hint, { color: theme.textSecondary }]}>{o.lines.map(l => `${l.productName} × ${l.cases} cases`).join('\n')}</Text><Text style={[styles.hint, { color: theme.textSecondary }]}>₹{o.totalAmount.toFixed(2)} · {o.invoiceNumber || 'Invoice after acceptance'}</Text></View>{o.status !== 'DELIVERED' && o.status !== 'REJECTED' && o.status !== 'CANCELLED' ? <TouchableOpacity onPress={() => advanceOrder(o)} style={[styles.smallButton, { backgroundColor: theme.primary }]}><Text style={styles.primaryText}>{o.status === 'PENDING' ? 'Accept' : 'Advance'}</Text></TouchableOpacity> : null}</View>)}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quote requests</Text>{quotes.length === 0 ? <Text style={[styles.hint, { color: theme.textSecondary }]}>No quotation requests yet.</Text> : quotes.map(q => <View key={q.id} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}><View style={{ flex: 1 }}><Text style={[styles.productName, { color: theme.textPrimary }]}>Request #{q.id} · {q.status}</Text>{q.buyerNotes ? <Text style={[styles.hint, { color: theme.textSecondary }]}>{q.buyerNotes}</Text> : null}{q.lines.map(line => <View key={line.productId}><Text style={[styles.hint, { color: theme.textSecondary }]}>{line.productName} × {line.cases} cases</Text>{q.status === 'REQUESTED' ? <TextInput value={quoteRates[q.id]?.[line.productId] || ''} onChangeText={value => setQuoteRates(current => ({ ...current, [q.id]: { ...current[q.id], [line.productId]: value } }))} keyboardType="decimal-pad" placeholder="Offer price per case" placeholderTextColor={theme.textTertiary} style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder }]} /> : line.offeredCasePrice != null ? <Text style={[styles.hint, { color: theme.textSecondary }]}>Offered ₹{line.offeredCasePrice.toFixed(2)} / case</Text> : null}</View>)}</View>{q.status === 'REQUESTED' ? <TouchableOpacity onPress={() => submitQuoteOffer(q)} style={[styles.smallButton, { backgroundColor: theme.primary }]}><Text style={styles.primaryText}>Send quote</Text></TouchableOpacity> : null}</View>)}
      </> : null}
    </ScrollView>
  </SafeAreaView>;
};

const styles = StyleSheet.create({ safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: AppSpacing.lg, paddingVertical: AppSpacing.md, borderBottomWidth: 1 }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: AppSpacing.md }, title: { fontSize: 17, fontWeight: '700' }, subtitle: { fontSize: 12, marginTop: 3 }, content: { padding: AppSpacing.lg, paddingBottom: AppSpacing.huge }, card: { borderWidth: 1, borderRadius: AppRadius.lg, padding: AppSpacing.md, marginBottom: AppSpacing.md }, sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: AppSpacing.sm }, hint: { fontSize: 12, lineHeight: 17 }, label: { fontSize: 12, marginTop: 10, marginBottom: 5 }, input: { borderWidth: 1, borderRadius: AppRadius.md, minHeight: 40, paddingHorizontal: 10, paddingVertical: 8 }, secondaryButton: { marginTop: 14, borderWidth: 1, minHeight: 42, borderRadius: AppRadius.md, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontSize: 13, fontWeight: '700' }, primaryButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: AppRadius.md, marginTop: 12 }, primaryText: { color: '#FFF', fontSize: 12, fontWeight: '700' }, row: { flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderRadius: AppRadius.md, padding: AppSpacing.md, marginBottom: AppSpacing.sm }, productName: { fontSize: 14, fontWeight: '700' }, smallButton: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: AppRadius.sm },
});
