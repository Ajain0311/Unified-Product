import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
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
import { Hotel, HotelBooking } from '../../models/hotel';

export const HotelOwnerDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [allowPayAtHotel, setAllowPayAtHotel] = useState(true);
  const [requireTokenDeposit, setRequireTokenDeposit] = useState(true);
  const [autoCancelCutoff, setAutoCancelCutoff] = useState(true);

  useEffect(() => {
    async function load() {
      const list = await hotelService.getHotels();
      if (list.length > 0) {
        setHotel(list[0]);
        setAllowPayAtHotel(list[0].payAtHotelPolicy.allowPayAtHotel);
        setRequireTokenDeposit(list[0].payAtHotelPolicy.requireTokenDeposit);
        setAutoCancelCutoff(list[0].payAtHotelPolicy.autoCancelUnconfirmedAtCutoff);
      }
      const bList = await hotelService.getMyBookings();
      setBookings(bList);
    }
    load();
  }, []);

  const handleUpdatePolicy = () => {
    Alert.alert(
      language === 'hi' ? 'नीति सहेजी गई' : 'Policy Saved',
      language === 'hi'
        ? 'आपकी नो-शो रोकथाम नीति और पे-एट-होटल नियम सफलतापूर्वक अपडेट कर दिए गए हैं।'
        : 'Your Anti-No-Show safeguards and hold cutoff rules have been updated in real-time.'
    );
  };

  const totalGross = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalSettled = Math.round(totalGross * 0.88); // 12% commission
  const totalCommission = totalGross - totalSettled;

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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {language === 'hi' ? 'होटल पार्टनर डैशबोर्ड' : 'Hotel Partner Dashboard'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Gross Bookings</Text>
            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>₹{totalGross}</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Net Payout (88%)</Text>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>₹{totalSettled}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Platform Commission (12%)</Text>
            <Text style={[styles.metricValue, { color: theme.primary }]}>₹{totalCommission}</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Reservations</Text>
            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{bookings.length}</Text>
          </View>
        </View>

        {/* Anti No-Show Safeguards Configuration */}
        <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.configHeader}>
            <Ionicons name="shield-outline" size={20} color={theme.primary} />
            <Text style={[styles.configTitle, { color: theme.textPrimary }]}>
              {language === 'hi' ? 'नो-शो सुरक्षा और होल्ड सेटिंग्स' : 'Anti-No-Show Safeguard Settings'}
            </Text>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.switchTitle, { color: theme.textPrimary }]}>Enable Pay at Hotel</Text>
              <Text style={[styles.switchDesc, { color: theme.textSecondary }]}>
                Allow guests to reserve without paying upfront full amount.
              </Text>
            </View>
            <Switch
              value={allowPayAtHotel}
              onValueChange={setAllowPayAtHotel}
              trackColor={{ false: '#767577', true: theme.primary + '80' }}
              thumbColor={allowPayAtHotel ? theme.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.switchTitle, { color: theme.textPrimary }]}>Require Token Deposit (₹500)</Text>
              <Text style={[styles.switchDesc, { color: theme.textSecondary }]}>
                Mandate token deposit to protect inventory against casual no-shows.
              </Text>
            </View>
            <Switch
              value={requireTokenDeposit}
              onValueChange={setRequireTokenDeposit}
              trackColor={{ false: '#767577', true: theme.primary + '80' }}
              thumbColor={requireTokenDeposit ? theme.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.switchTitle, { color: theme.textPrimary }]}>6:00 PM Auto-Release Cutoff</Text>
              <Text style={[styles.switchDesc, { color: theme.textSecondary }]}>
                Automatically release unconfirmed pay-at-hotel bookings at 6 PM to walk-in guests.
              </Text>
            </View>
            <Switch
              value={autoCancelCutoff}
              onValueChange={setAutoCancelCutoff}
              trackColor={{ false: '#767577', true: theme.primary + '80' }}
              thumbColor={autoCancelCutoff ? theme.primary : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity
            onPress={handleUpdatePolicy}
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.saveBtnText}>
              {language === 'hi' ? 'नीति अपडेट करें' : 'Save Safeguards'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Guest Check-In List */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          {language === 'hi' ? 'हाल की बुकिंग्स और आगमन' : 'Recent Bookings & Arrivals'}
        </Text>

        {bookings.map((b) => (
          <View
            key={b.id}
            style={[styles.bookingItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.bookingRow}>
              <View>
                <Text style={[styles.guestName, { color: theme.textPrimary }]}>{b.guestFullName}</Text>
                <Text style={[styles.roomText, { color: theme.textSecondary }]}>
                  {b.roomName} • {b.checkInDate} to {b.checkOutDate}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: '#10B98120' }]}>
                <Text style={[styles.statusPillText, { color: '#10B981' }]}>{b.status}</Text>
              </View>
            </View>
            <Text style={[styles.payDetail, { color: theme.textSecondary }]}>
              Payment: {b.paymentMethod} (₹{b.totalAmount})
            </Text>
          </View>
        ))}
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
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  metricCard: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, marginHorizontal: 4 },
  metricLabel: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  configCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginVertical: 14 },
  configHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  configTitle: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  switchTitle: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  switchDesc: { fontSize: 11, lineHeight: 15 },
  saveBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  sectionHeading: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 10 },
  bookingItem: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  bookingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  guestName: { fontSize: 14, fontWeight: '700' },
  roomText: { fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  payDetail: { fontSize: 11, marginTop: 6 },
});
