import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { RestaurantSummary } from '../../models/food';
import { apiClient, createIdempotencyKey } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { useAppTheme } from '../../theme/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { isAuthenticationError } from '../../utils/authErrors';
import { AppRadius, AppSpacing } from '../../theme/spacing';

type Reservation = { id: number; restaurantName: string; reservationAt: string; partySize: number; status: string };
const localDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const parseLocalDateTime = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d, h, min] = match.map(Number);
  const date = new Date(y, m - 1, d, h, min);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const BarHubScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useAppTheme();
  const [venues, setVenues] = useState<RestaurantSummary[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selected, setSelected] = useState<RestaurantSummary | null>(null);
  const [reservationAt, setReservationAt] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [venuesResult, reservationsResult] = await Promise.all([
        apiClient.get<any>(ApiEndpoints.bars.venues, { params: { page: 1, pageSize: 30 } }),
        useAuthStore.getState().isAuthenticated
          ? apiClient.get<any>(ApiEndpoints.bars.myReservations, { suppressAuthPrompt: true })
          : Promise.resolve(null),
      ]);
      const venuePayload = venuesResult?.data ?? venuesResult;
      const list = venuePayload?.items ?? venuePayload?.data?.items ?? [];
      if (!Array.isArray(list)) throw new Error('Bar catalogue response was invalid');
      setVenues(list);
      const reservationPayload = reservationsResult?.data?.data ?? reservationsResult?.data ?? [];
      setReservations(Array.isArray(reservationPayload) ? reservationPayload : []);
    } catch (e: any) {
      setError(e?.message || 'Could not load bars and lounges.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const openReservation = (venue: RestaurantSummary) => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(19, 0, 0, 0);
    setReservationAt(localDateTime(date));
    setPartySize('2');
    setSelected(venue);
  };

  const reserve = async (venue: RestaurantSummary) => {
    if (!useAuthStore.getState().isAuthenticated) {
      useAuthModalStore.getState().openAuthModal({
        title: 'Sign in to reserve',
        subtitle: 'Verify your phone number to request a table.',
        onSuccess: () => { void reserve(venue); },
      });
      return;
    }
    const date = parseLocalDateTime(reservationAt);
    const count = Number(partySize);
    if (!date || date <= new Date() || !Number.isInteger(count) || count < 1) {
      Alert.alert('Check reservation details', 'Enter a future local date and time, and a party size of at least one.');
      return;
    }
    setSubmitting(true);
    try {
      const availabilityResponse: any = await apiClient.get(ApiEndpoints.bars.availability(venue.id), { params: { reservationAt: date.toISOString(), partySize: count }, headers: { 'Cache-Control': 'no-cache' } });
      const availability = availabilityResponse?.data?.data ?? availabilityResponse?.data;
      if (!availability?.available) {
        Alert.alert('Unavailable', 'This venue does not have enough seating for the selected time.');
        return;
      }
      await apiClient.post(ApiEndpoints.bars.createReservation, { restaurantId: venue.id, reservationAt: date.toISOString(), partySize: count }, { headers: { 'Idempotency-Key': createIdempotencyKey() } });
      setSelected(null);
      Alert.alert('Request sent', 'The venue will review your reservation request.');
      await load(true);
    } catch (e: any) {
      if (isAuthenticationError(e)) {
        useAuthModalStore.getState().openAuthModal({
          title: 'Session expired',
          subtitle: 'Verify your phone number to continue this reservation.',
          onSuccess: () => { void reserve(venue); },
        });
        return;
      }
      Alert.alert('Could not reserve', e?.message || 'Please try again.');
    } finally { setSubmitting(false); }
  };

  const cancelReservation = (id: number) => Alert.alert('Cancel reservation?', 'This will send a cancellation to the venue.', [
    { text: 'Keep', style: 'cancel' },
    { text: 'Cancel reservation', style: 'destructive', onPress: async () => {
      try { await apiClient.post(ApiEndpoints.bars.cancelReservation(id), {}); await load(true); }
      catch (e: any) {
        if (isAuthenticationError(e)) {
          useAuthModalStore.getState().openAuthModal({
            title: 'Session expired',
            subtitle: 'Verify your phone number to cancel this reservation.',
            onSuccess: async () => {
              try {
                await apiClient.post(ApiEndpoints.bars.cancelReservation(id), {});
                await load(true);
              } catch (retryError: any) {
                Alert.alert('Could not cancel', retryError?.message || 'Please try again.');
              }
            },
          });
          return;
        }
        Alert.alert('Could not cancel', e?.message || 'Please try again.');
      }
    } },
  ]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={20} color={theme.textPrimary} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={[styles.title, { color: theme.textPrimary }]}>Bars & Lounges</Text><Text style={[styles.subtitle, { color: theme.textSecondary }]}>Verified venues and table reservations</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
        {loading ? <ActivityIndicator style={styles.state} color={theme.primary} /> : null}
        {!loading && error ? <View style={styles.state}><Text style={[styles.message, { color: theme.textSecondary }]}>{error}</Text><TouchableOpacity onPress={() => load()}><Text style={{ color: theme.primary, fontWeight: '700' }}>Try again</Text></TouchableOpacity></View> : null}
        {!loading && !error && venues.length === 0 ? <View style={styles.state}><Ionicons name="wine-outline" size={34} color={theme.textTertiary} /><Text style={[styles.message, { color: theme.textSecondary }]}>No approved bars or lounges are available yet.</Text></View> : null}
        {venues.map((venue) => <View key={venue.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {venue.imageUrl ? <Image source={{ uri: venue.imageUrl }} style={styles.image} /> : <View style={[styles.image, styles.imageBlank, { backgroundColor: theme.chipBg }]}><Ionicons name="wine" size={30} color={theme.textTertiary} /></View>}
          <View style={styles.cardBody}>
            <Text style={[styles.venueName, { color: theme.textPrimary }]}>{venue.name}</Text>
            <Text style={[styles.detail, { color: theme.textSecondary }]}>{venue.description || venue.addressLine || venue.city || 'Venue details and opening information'}</Text>
            <View style={styles.meta}><Ionicons name="star" size={13} color="#D19326" /><Text style={[styles.rating, { color: theme.textPrimary }]}>{venue.rating.toFixed(1)}</Text><Text style={[styles.city, { color: theme.textTertiary }]}>{venue.city || ''}</Text></View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: String(venue.id) })} style={[styles.secondaryButton, { borderColor: theme.cardBorder }]}><Text style={[styles.secondaryText, { color: theme.textPrimary }]}>View venue</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => openReservation(venue)} style={[styles.primaryButton, { backgroundColor: theme.primary }]}><Text style={styles.primaryText}>Reserve</Text></TouchableOpacity>
            </View>
          </View>
        </View>)}
        {reservations.length > 0 ? <><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Your reservations</Text>{reservations.map((item) => <View key={item.id} style={[styles.reservation, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}><View style={{ flex: 1 }}><Text style={[styles.venueName, { color: theme.textPrimary }]}>{item.restaurantName}</Text><Text style={[styles.detail, { color: theme.textSecondary }]}>{new Date(item.reservationAt).toLocaleString()} · {item.partySize} guests · {item.status}</Text></View>{!['CANCELLED', 'REJECTED', 'COMPLETED'].includes(item.status) ? <TouchableOpacity onPress={() => cancelReservation(item.id)}><Text style={{ color: '#B54747', fontWeight: '700' }}>Cancel</Text></TouchableOpacity> : null}</View>)}</> : null}
      </ScrollView>
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}><View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Reserve at {selected?.name}</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Local date and time (YYYY-MM-DDTHH:mm)</Text>
          <TextInput value={reservationAt} onChangeText={setReservationAt} autoCapitalize="none" placeholder="2026-11-09T19:00" placeholderTextColor={theme.textTertiary} style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder }]} />
          <Text style={[styles.label, { color: theme.textSecondary }]}>Party size</Text>
          <TextInput value={partySize} onChangeText={setPartySize} keyboardType="number-pad" style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder }]} />
          <View style={styles.actions}><TouchableOpacity onPress={() => setSelected(null)} style={[styles.secondaryButton, { borderColor: theme.cardBorder }]}><Text style={[styles.secondaryText, { color: theme.textPrimary }]}>Close</Text></TouchableOpacity><TouchableOpacity disabled={submitting} onPress={() => selected && reserve(selected)} style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}>{submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Check and request</Text>}</TouchableOpacity></View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: AppSpacing.lg, paddingVertical: AppSpacing.md, borderBottomWidth: 1 },
  back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: AppSpacing.md }, title: { fontSize: 18, fontWeight: '700' }, subtitle: { fontSize: 12, marginTop: 3 },
  content: { padding: AppSpacing.lg, paddingBottom: AppSpacing.huge }, state: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12 }, message: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: AppRadius.lg, overflow: 'hidden', marginBottom: AppSpacing.md }, image: { width: '100%', height: 165 }, imageBlank: { alignItems: 'center', justifyContent: 'center' }, cardBody: { padding: AppSpacing.md }, venueName: { fontSize: 16, fontWeight: '700' }, detail: { fontSize: 13, marginTop: 5, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 }, rating: { fontSize: 12, fontWeight: '700' }, city: { flex: 1, fontSize: 12 }, actions: { flexDirection: 'row', gap: 10, marginTop: 14, justifyContent: 'flex-end' }, secondaryButton: { borderWidth: 1, borderRadius: AppRadius.md, paddingHorizontal: 14, paddingVertical: 10 }, secondaryText: { fontSize: 13, fontWeight: '700' }, primaryButton: { minWidth: 110, alignItems: 'center', justifyContent: 'center', borderRadius: AppRadius.md, paddingHorizontal: 14, paddingVertical: 10 }, primaryText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: AppSpacing.md, marginBottom: AppSpacing.sm }, reservation: { borderWidth: 1, borderRadius: AppRadius.md, padding: AppSpacing.md, marginBottom: AppSpacing.sm, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalBackdrop: { flex: 1, backgroundColor: '#0009', justifyContent: 'center', padding: AppSpacing.lg }, modalCard: { borderRadius: AppRadius.lg, padding: AppSpacing.lg }, label: { fontSize: 12, marginTop: 12, marginBottom: 5 }, input: { borderWidth: 1, borderRadius: AppRadius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
});
