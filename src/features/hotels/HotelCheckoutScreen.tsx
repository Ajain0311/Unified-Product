import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { hotelService } from '../../services/hotelService';
import { Hotel, HotelRoom } from '../../models/hotel';
import { useAuthStore } from '../../store/authStore';

export const HotelCheckoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'HotelCheckout'>>();
  const { hotelId, roomId } = route.params;

  const { theme, isDark } = useAppTheme();
  const { t, language } = useLanguageStore();
  const { user } = useAuthStore();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [room, setRoom] = useState<HotelRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Booking form state
  const [guestName, setGuestName] = useState(user?.fullName || user?.name || '');
  const [guestPhone, setGuestPhone] = useState(user?.mobileNumber || user?.phone || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [nights, setNights] = useState(1);
  const [numRooms, setNumRooms] = useState(1);
  const [numGuests, setNumGuests] = useState(2);
  const [paymentOption, setPaymentOption] = useState<'PAY_NOW' | 'PAY_AT_HOTEL' | 'TOKEN'>('PAY_NOW');

  useEffect(() => {
    async function init() {
      try {
        const h = await hotelService.getHotelById(hotelId);
        const r = await hotelService.getRoomsByHotel(hotelId);
        const targetRoom = r.find((x) => x.id === roomId) || r[0];
        setHotel(h);
        setRoom(targetRoom);
      } catch {
        Alert.alert('Error', 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [hotelId, roomId]);

  if (loading || !hotel || !room) {
    return (
      <SafeAreaView style={[styles.centerArea, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  const subtotal = room.basePricePerNight * nights * numRooms;
  const taxes = Math.round((subtotal * room.taxPercentage) / 100);
  const total = subtotal + taxes;
  const tokenDeposit = hotel.payAtHotelPolicy.tokenDepositAmount || 500;

  const handleConfirmBooking = async () => {
    if (!guestName.trim()) {
      Alert.alert('Missing Field', 'Please provide guest full name');
      return;
    }
    if (!guestPhone.trim()) {
      Alert.alert('Missing Field', 'Please provide a valid contact number');
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date();
      const checkIn = new Date(today);
      checkIn.setDate(today.getDate() + 1);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + nights);

      const bookingMethod =
        paymentOption === 'PAY_NOW'
          ? 'RAZORPAY'
          : paymentOption === 'TOKEN'
          ? 'TOKEN_DEPOSIT_PARTIAL'
          : 'PAY_AT_HOTEL';

      const booking = await hotelService.createBooking({
        userId: user?.id ? String(user.id) : 'guest-user-01',
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelAddress: hotel.address,
        hotelCity: hotel.city,
        hotelPhoto: hotel.featuredPhoto,
        roomId: room.id,
        roomName: room.name,
        checkInDate: checkIn.toISOString().split('T')[0],
        checkOutDate: checkOut.toISOString().split('T')[0],
        numberOfNights: nights,
        numberOfRooms: numRooms,
        numberOfGuests: numGuests,
        guestFullName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        roomRatePerNight: room.basePricePerNight,
        subtotalAmount: subtotal,
        taxesAndFees: taxes,
        totalAmount: total,
        paymentMethod: bookingMethod,
        tokenAmountPaid: paymentOption === 'TOKEN' ? tokenDeposit : 0,
        balanceDueAtCheckIn:
          paymentOption === 'TOKEN'
            ? total - tokenDeposit
            : paymentOption === 'PAY_AT_HOTEL'
            ? total
            : 0,
        holdCutoffTimeText:
          paymentOption === 'PAY_AT_HOTEL'
            ? `${hotel.payAtHotelPolicy.holdCutoffHour}:00 PM`
            : undefined,
      });

      Alert.alert(
        language === 'hi' ? 'बुकिंग सफल!' : 'Booking Confirmed!',
        `${language === 'hi' ? 'बुकिंग कोड' : 'Booking Reference'}: ${booking.bookingCode}\n${
          bookingMethod === 'PAY_AT_HOTEL'
            ? 'Please arrive before 6:00 PM or token confirmation to prevent auto-release.'
            : 'Your room has been reserved with anti-no-show assurance.'
        }`,
        [
          {
            text: 'View Bookings',
            onPress: () => navigation.replace('HotelMyBookings'),
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Unable to complete your booking. Please try again.');
    } finally {
      setSubmitting(false);
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {language === 'hi' ? 'बुकिंग समीक्षा और चेकआउट' : 'Review & Checkout'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.hotelName, { color: theme.textPrimary }]}>{hotel.name}</Text>
          <Text style={[styles.roomName, { color: theme.primary }]}>{room.name}</Text>
          <Text style={[styles.hotelAddress, { color: theme.textSecondary }]}>
            {hotel.address}, {hotel.city}
          </Text>
        </View>

        {/* Stay Configurations */}
        <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'स्टे विवरण' : 'Stay Details'}
          </Text>

          <View style={styles.counterRow}>
            <Text style={[styles.counterLabel, { color: theme.textPrimary }]}>
              {language === 'hi' ? 'रातों की संख्या (Nights)' : 'Number of Nights'}
            </Text>
            <View style={styles.counterControl}>
              <TouchableOpacity
                onPress={() => setNights(Math.max(1, nights - 1))}
                style={[styles.counterBtn, { backgroundColor: theme.surfaceHover }]}
              >
                <Ionicons name="remove" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.counterValue, { color: theme.textPrimary }]}>{nights}</Text>
              <TouchableOpacity
                onPress={() => setNights(nights + 1)}
                style={[styles.counterBtn, { backgroundColor: theme.surfaceHover }]}
              >
                <Ionicons name="add" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.counterRow}>
            <Text style={[styles.counterLabel, { color: theme.textPrimary }]}>
              {language === 'hi' ? 'कमरे (Rooms)' : 'Number of Rooms'}
            </Text>
            <View style={styles.counterControl}>
              <TouchableOpacity
                onPress={() => setNumRooms(Math.max(1, numRooms - 1))}
                style={[styles.counterBtn, { backgroundColor: theme.surfaceHover }]}
              >
                <Ionicons name="remove" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.counterValue, { color: theme.textPrimary }]}>{numRooms}</Text>
              <TouchableOpacity
                onPress={() => setNumRooms(numRooms + 1)}
                style={[styles.counterBtn, { backgroundColor: theme.surfaceHover }]}
              >
                <Ionicons name="add" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Guest Details */}
        <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'अतिथि जानकारी' : 'Guest Information'}
          </Text>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            {language === 'hi' ? 'पूरा नाम' : 'Primary Guest Name'} *
          </Text>
          <TextInput
            value={guestName}
            onChangeText={setGuestName}
            placeholder="e.g. Aditya Sharma"
            placeholderTextColor={theme.textTertiary}
            style={[styles.inputBox, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
          />

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            {language === 'hi' ? 'मोबाइल नंबर' : 'Phone Number'} *
          </Text>
          <TextInput
            value={guestPhone}
            onChangeText={setGuestPhone}
            keyboardType="phone-pad"
            placeholder="e.g. 9876543210"
            placeholderTextColor={theme.textTertiary}
            style={[styles.inputBox, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
          />

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
          <TextInput
            value={guestEmail}
            onChangeText={setGuestEmail}
            keyboardType="email-address"
            placeholder="e.g. aditya@example.com"
            placeholderTextColor={theme.textTertiary}
            style={[styles.inputBox, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
          />
        </View>

        {/* Payment Policy Selection */}
        <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'भुगतान विकल्प (Anti No-Show Safe)' : 'Payment & Anti-No-Show Safeguard'}
          </Text>

          <TouchableOpacity
            onPress={() => setPaymentOption('PAY_NOW')}
            style={[
              styles.paymentOption,
              { borderColor: paymentOption === 'PAY_NOW' ? theme.primary : theme.border },
            ]}
          >
            <View style={styles.optionRadio}>
              <View
                style={[
                  styles.radioDot,
                  { backgroundColor: paymentOption === 'PAY_NOW' ? theme.primary : 'transparent' },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? '100% ऑनलाइन भुगतान' : 'Pay Full Online (Guaranteed Stay)'}
              </Text>
              <Text style={[styles.optSubtitle, { color: theme.textSecondary }]}>
                Instant confirmation. Protected under full cancellation policy.
              </Text>
            </View>
          </TouchableOpacity>

          {hotel.payAtHotelPolicy.allowPayAtHotel && (
            <TouchableOpacity
              onPress={() => setPaymentOption('PAY_AT_HOTEL')}
              style={[
                styles.paymentOption,
                { borderColor: paymentOption === 'PAY_AT_HOTEL' ? theme.primary : theme.border },
              ]}
            >
              <View style={styles.optionRadio}>
                <View
                  style={[
                    styles.radioDot,
                    { backgroundColor: paymentOption === 'PAY_AT_HOTEL' ? theme.primary : 'transparent' },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optTitle, { color: theme.textPrimary }]}>
                  {language === 'hi' ? 'होटल पर भुगतान (Pay at Hotel)' : 'Pay at Hotel (6:00 PM Hold Cutoff)'}
                </Text>
                <Text style={[styles.optSubtitle, { color: theme.textSecondary }]}>
                  Hold guaranteed till 6:00 PM check-in day. Free cancellation anytime before cutoff.
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {hotel.payAtHotelPolicy.requireTokenDeposit && (
            <TouchableOpacity
              onPress={() => setPaymentOption('TOKEN')}
              style={[
                styles.paymentOption,
                { borderColor: paymentOption === 'TOKEN' ? theme.primary : theme.border },
              ]}
            >
              <View style={styles.optionRadio}>
                <View
                  style={[
                    styles.radioDot,
                    { backgroundColor: paymentOption === 'TOKEN' ? theme.primary : 'transparent' },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optTitle, { color: theme.textPrimary }]}>
                  {language === 'hi' ? `टोकन डिपॉजिट (₹${tokenDeposit})` : `Token Deposit Only (₹${tokenDeposit})`}
                </Text>
                <Text style={[styles.optSubtitle, { color: theme.textSecondary }]}>
                  Locks room all night. Remaining ₹{total - tokenDeposit} payable upon arrival.
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'मूल्य विवरण' : 'Price Summary'}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              ₹{room.basePricePerNight} x {nights} nights ({numRooms} room)
            </Text>
            <Text style={[styles.priceValue, { color: theme.textPrimary }]}>₹{subtotal}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Taxes & Hotel Fees</Text>
            <Text style={[styles.priceValue, { color: theme.textPrimary }]}>₹{taxes}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.priceRow}>
            <Text style={[styles.totalLabel, { color: theme.textPrimary }]}>Total Payable</Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>₹{total}</Text>
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          onPress={handleConfirmBooking}
          disabled={submitting}
          style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmBtnText}>
              {paymentOption === 'PAY_NOW'
                ? `Pay ₹${total} & Confirm`
                : paymentOption === 'TOKEN'
                ? `Pay ₹${tokenDeposit} Token & Confirm`
                : 'Confirm Pay-at-Hotel Reservation'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centerArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  summaryCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  hotelName: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  roomName: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  hotelAddress: { fontSize: 12 },
  configCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  counterLabel: { fontSize: 14, fontWeight: '500' },
  counterControl: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: { marginHorizontal: 14, fontSize: 16, fontWeight: '700' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  inputBox: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 4,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  optSubtitle: { fontSize: 11, lineHeight: 15 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 13 },
  priceValue: { fontSize: 13, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: '700' },
  totalValue: { fontSize: 17, fontWeight: '800' },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  confirmBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
