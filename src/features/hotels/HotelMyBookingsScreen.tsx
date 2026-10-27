import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { hotelService } from '../../services/hotelService';
import { HotelBooking } from '../../models/hotel';

export const HotelMyBookingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useAppTheme();
  const { t, language } = useLanguageStore();

  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const data = await hotelService.getMyBookings();
      setBookings(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = (booking: HotelBooking) => {
    Alert.alert(
      language === 'hi' ? 'बुकिंग रद्द करें?' : 'Cancel Booking?',
      language === 'hi'
        ? `क्या आप ${booking.hotelName} के लिए अपनी बुकिंग रद्द करना चाहते हैं? रद्दीकरण नीति के अनुसार रिफंड लागू होगा।`
        : `Are you sure you want to cancel your stay at ${booking.hotelName}? Refunds are governed by the hotel's cancellation policy.`,
      [
        { text: 'Keep Reservation', style: 'cancel' },
        {
          text: 'Confirm Cancellation',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(booking.id);
            try {
              const updated = await hotelService.cancelBooking(booking.id, 'User requested cancellation');
              if (updated) {
                Alert.alert(
                  'Cancelled',
                  `Booking cancelled. Refund of ₹${updated.refundAmount || 0} initiated.`
                );
                fetchBookings();
              }
            } catch {
              Alert.alert('Error', 'Unable to cancel booking.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#10B981';
      case 'CHECKED_IN':
        return '#3B82F6';
      case 'AUTO_CANCELLED_NO_SHOW':
        return '#F59E0B';
      case 'CANCELLED':
        return '#EF4444';
      default:
        return '#64748B';
    }
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('myHotelBookings')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchBookings();
            }}
            tintColor={theme.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="bed-outline" size={56} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {language === 'hi' ? 'कोई सक्रिय बुकिंग नहीं' : 'No Bookings Yet'}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {language === 'hi'
                ? 'आपने अभी तक कोई होटल बुक नहीं किया है। शानदार होटल देखें!'
                : 'Explore boutique stays and premium resorts with our anti-no-show guarantee.'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('HotelHome')}
              style={[styles.exploreBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.exploreBtnText}>
                {language === 'hi' ? 'होटल खोजें' : 'Browse Stays'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          bookings.map((b) => {
            const statusColor = getStatusColor(b.status);
            return (
              <View
                key={b.id}
                style={[styles.bookingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.codeText, { color: theme.textSecondary }]}>
                      Booking #{b.bookingCode}
                    </Text>
                    <Text style={[styles.hotelName, { color: theme.textPrimary }]}>{b.hotelName}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{b.status}</Text>
                  </View>
                </View>

                <View style={styles.stayDetails}>
                  <View style={styles.stayCol}>
                    <Text style={[styles.stayLabel, { color: theme.textSecondary }]}>Check-in</Text>
                    <Text style={[styles.stayVal, { color: theme.textPrimary }]}>{b.checkInDate}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={theme.textTertiary} />
                  <View style={styles.stayCol}>
                    <Text style={[styles.stayLabel, { color: theme.textSecondary }]}>Check-out</Text>
                    <Text style={[styles.stayVal, { color: theme.textPrimary }]}>{b.checkOutDate}</Text>
                  </View>
                </View>

                <View style={[styles.roomBanner, { backgroundColor: theme.surfaceHover }]}>
                  <Text style={[styles.roomBannerText, { color: theme.textPrimary }]}>
                    {b.roomName} • {b.numberOfRooms} Room(s) • {b.numberOfGuests} Guest(s)
                  </Text>
                </View>

                <View style={styles.billingRow}>
                  <View>
                    <Text style={[styles.payMethod, { color: theme.textSecondary }]}>
                      Payment: {b.paymentMethod}
                    </Text>
                    {b.balanceDueAtCheckIn ? (
                      <Text style={[styles.balanceDue, { color: '#F59E0B' }]}>
                        Due at Check-in: ₹{b.balanceDueAtCheckIn}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.totalAmount, { color: theme.primary }]}>₹{b.totalAmount}</Text>
                </View>

                {b.holdCutoffTimeText && b.status === 'CONFIRMED' && (
                  <View style={styles.warningNote}>
                    <Ionicons name="alert-circle" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                    <Text style={[styles.warningText, { color: '#F59E0B' }]}>
                      Held till {b.holdCutoffTimeText} on check-in day. Arrive or confirm to avoid auto-release.
                    </Text>
                  </View>
                )}

                {b.status === 'CONFIRMED' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => handleCancelBooking(b)}
                      disabled={cancellingId === b.id}
                      style={[styles.cancelBtn, { borderColor: '#EF4444' }]}
                    >
                      {cancellingId === b.id ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Text style={styles.cancelBtnText}>{t('cancelBooking')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
    marginRight: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 12 },
  emptyDesc: { fontSize: 13, textAlign: 'center', marginTop: 6, paddingHorizontal: 30 },
  exploreBtn: { marginTop: 18, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  exploreBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  bookingCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  codeText: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  hotelName: { fontSize: 15, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  stayDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  stayCol: { alignItems: 'center' },
  stayLabel: { fontSize: 11 },
  stayVal: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  roomBanner: { padding: 8, borderRadius: 8, marginVertical: 6 },
  roomBannerText: { fontSize: 12, fontWeight: '600' },
  billingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  payMethod: { fontSize: 12 },
  balanceDue: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  totalAmount: { fontSize: 16, fontWeight: '800' },
  warningNote: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  warningText: { fontSize: 11, flex: 1 },
  actionRow: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F020', paddingTop: 10 },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
});
