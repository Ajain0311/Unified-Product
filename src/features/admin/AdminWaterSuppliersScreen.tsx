import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { absoluteImageUrl } from '../../services/documentService';
import { useAppTheme } from '../../theme/themeStore';
import { useAuthStore } from '../../store/authStore';
import { AppRadius, AppSpacing } from '../../theme/spacing';

type Supplier = { id: number; businessName: string; contactPhone: string; address: string; city: string; deliveryCities: string; businessDocumentNo: string; businessDocumentImageUrl: string; status: string; adminNotes?: string };
const body = (r: any) => r?.data?.data ?? r?.data;

export const AdminWaterSuppliersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useAppTheme();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});
  const load = useCallback(async () => {
    setLoading(true);
    try { setSuppliers(body(await apiClient.get(ApiEndpoints.water.adminSuppliers, { params: { status: 'PENDING' } })) || []); }
    catch (error: any) { Alert.alert('Could not load applications', error?.message || 'Admin authorization is required.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const review = (supplier: Supplier, status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !rejectionReasons[supplier.id]?.trim()) { Alert.alert('Reason required', 'Enter a reason so the supplier knows what needs attention.'); return; }
    Alert.alert(`${status === 'APPROVED' ? 'Approve' : 'Reject'} supplier?`, `${supplier.businessName} · ${supplier.city}`, [
    { text: 'Cancel', style: 'cancel' },
    { text: status === 'APPROVED' ? 'Approve' : 'Reject', style: status === 'REJECTED' ? 'destructive' : 'default', onPress: async () => {
      setBusyId(supplier.id);
      try { await apiClient.put(ApiEndpoints.water.reviewSupplier(supplier.id), { status, notes: status === 'REJECTED' ? rejectionReasons[supplier.id]?.trim() : undefined }); await load(); }
      catch (error: any) { Alert.alert('Review failed', error?.message || 'Refresh and retry.'); }
      finally { setBusyId(null); }
    } },
    ]);
  };
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={20} color={theme.textPrimary} /></TouchableOpacity><View><Text style={[styles.title, { color: theme.textPrimary }]}>Water Supplier Review</Text><Text style={[styles.subtitle, { color: theme.textSecondary }]}>Verify business details before publication</Text></View></View>
    {loading ? <ActivityIndicator style={{ marginTop: 80 }} color={theme.primary} /> : <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {suppliers.length === 0 ? <Text style={[styles.empty, { color: theme.textSecondary }]}>No pending supplier applications.</Text> : suppliers.map(s => <View key={s.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{s.businessName}</Text><Text style={[styles.detail, { color: theme.textSecondary }]}>{s.contactPhone} · {s.city}</Text><Text style={[styles.detail, { color: theme.textSecondary }]}>{s.address}</Text><Text style={[styles.detail, { color: theme.textSecondary }]}>Delivery cities: {s.deliveryCities}</Text><Text style={[styles.detail, { color: theme.textSecondary }]}>Verification document: {s.businessDocumentNo}</Text><Image source={{ uri: absoluteImageUrl(s.businessDocumentImageUrl), headers: { Authorization: `Bearer ${useAuthStore.getState().token || ''}` } }} style={styles.document} resizeMode="contain" /><TextInput value={rejectionReasons[s.id] || ''} onChangeText={value => setRejectionReasons(previous => ({ ...previous, [s.id]: value }))} placeholder="Reason (required when rejecting)" placeholderTextColor={theme.textTertiary} style={[styles.reason, { color: theme.textPrimary, borderColor: theme.cardBorder }]} />
        <View style={styles.actions}><TouchableOpacity disabled={busyId === s.id} onPress={() => review(s, 'REJECTED')} style={[styles.reject, { borderColor: theme.cardBorder }]}><Text style={{ color: '#B54747', fontWeight: '700' }}>Reject</Text></TouchableOpacity><TouchableOpacity disabled={busyId === s.id} onPress={() => review(s, 'APPROVED')} style={[styles.approve, { backgroundColor: theme.primary }]}>{busyId === s.id ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Approve</Text>}</TouchableOpacity></View>
      </View>)}
    </ScrollView>}
  </SafeAreaView>;
};

const styles = StyleSheet.create({ safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: AppSpacing.lg, paddingVertical: AppSpacing.md, borderBottomWidth: 1 }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: AppSpacing.md }, title: { fontSize: 17, fontWeight: '700' }, subtitle: { fontSize: 12, marginTop: 3 }, content: { padding: AppSpacing.lg }, card: { borderWidth: 1, borderRadius: AppRadius.lg, padding: AppSpacing.md, marginBottom: AppSpacing.md }, name: { fontSize: 16, fontWeight: '700', marginBottom: 5 }, detail: { fontSize: 12, lineHeight: 18 }, document: { width: '100%', height: 180, marginTop: 10 }, reason: { minHeight: 40, borderWidth: 1, borderRadius: AppRadius.md, marginTop: 10, paddingHorizontal: 10 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: AppSpacing.md }, reject: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: AppRadius.md }, approve: { minWidth: 100, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: AppRadius.md }, empty: { marginTop: 80, textAlign: 'center', fontSize: 14 },
});
