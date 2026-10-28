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
  const [guestName, setGuestName] = useState(user?.fullName || '');
  const [guestPhone, setGuestPhone] = useState(user?.mobileNumber || '');
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
        const targetRoom = r.find((x: HotelRoom) => x.id === roomId) || r[0];
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
        paymentStatus: paymentOption === 'PAY_NOW' ? 'PAID' : paymentOption === 'TOKEN' ? 'TOKEN_PAID_BALANCE_DUE' : 'PENDING',
        status: 'CONFIRMED',
        cancellationPolicyApplied: hotel.cancellationPolicy,
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
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.surfaceHover }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {language === 'hi' ? 'बुकिंग की पुष्टि' : 'Confirm Reservation'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Hotel & Room Banner */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.hotelName, { color: theme.textPrimary }]}>{hotel.name}</Text>
          <Text style={[styles.hotelAddress, { color: theme.textSecondary }]}>
            <Ionicons name="location-sharp" size={14} color={theme.primary} /> {hotel.address}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[styles.roomName, { color: theme.textPrimary }]}>{room.name}</Text>
              <Text style={{ fontSize: 12, color: theme.textTertiary, marginTop: 2 }}>{room.bedType} • Max {room.maxGuests} Guests</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.primary }}>
              ₹{room.basePricePerNight}
              <Text style={{ fontSize: 11, fontWeight: '400', color: theme.textTertiary }}>/night</Text>
            </Text>
          </View>
        </View>

        {/* Guest Details Form */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'अतिथि जानकारी' : 'Guest Details'}
          </Text>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceLight, color: theme.textPrimary, borderColor: theme.border }]}
            value={guestName}
            onChangeText={setGuestName}
            placeholder="John Doe"
            placeholderTextColor={theme.textTertiary}
          />

          <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>Mobile Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceLight, color: theme.textPrimary, borderColor: theme.border }]}
            value={guestPhone}
            onChangeText={setGuestPhone}
            placeholder="9876543210"
            keyboardType="phone-pad"
            placeholderTextColor={theme.textTertiary}
          />

          <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>Email (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceLight, color: theme.textPrimary, borderColor: theme.border }]}
            value={guestEmail}
            onChangeText={setGuestEmail}
            placeholder="john@example.com"
            keyboardType="email-address"
            placeholderTextColor={theme.textTertiary}
          />
        </View>

        {/* Stay Parameters */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'ठहरने का विवरण' : 'Stay Summary'}
          </Text>

          <View style={styles.counterRow}>
            <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>Number of Nights</Text>
            <View style={styles.counterControls}>
              <TouchableOpacity
                onPress={() => setNights(Math.max(1, nights - 1))}
                style={[styles.counterBtn, { backgroundColor: theme.surfaceLight }]}
              >
                <Ionicons name="remove" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={{ marginHorizontal: 12, fontWeight: '800', color: theme.textPrimary }}>{nights}</Text>
              <TouchableOpacity
                onPress={() => setNights(nights + 1)}
                style={[styles.counterBtn, { backgroundColor: theme.surfaceLight }]}
              >
                <Ionicons name="add" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.counterRow, { marginTop: 14 }]}>
            <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>Number of Rooms</Text>
            <View style={styles.counterControls}>
              <TouchableOpacity
                onPress={() => setNumRooms(Math.max(1, numRooms - 1))}
                style={[styles.counterBtn, { backgroundColor: theme.surfaceLight }]}
              >
                <Ionicons name="remove" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={{ marginHorizontal: 12, fontWeight: '800', color: theme.textPrimary }}>{numRooms}</Text>
              <TouchableOpacity
                onPress={() => setNumRooms(numRooms + 1)}
                style={[styles.counterBtn, { backgroundColor: theme.surfaceLight }]}
              >
                <Ionicons name="add" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Anti-No-Show Payment Options */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'भुगतान विकल्प एवं एंटी-नो-शो गारंटी' : 'Payment & Anti-No-Show Safeguard'}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 14 }}>
            Hotels release unpaid holds after 6:00 PM. Select your preferred confirmation mode:
          </Text>

          {/* Option 1: Pay 100% Online */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPaymentOption('PAY_NOW')}
            style={[
              styles.optionCard,
              {
                borderColor: paymentOption === 'PAY_NOW' ? theme.primary : theme.border,
                backgroundColor: paymentOption === 'PAY_NOW' ? `${theme.primary}12` : theme.surfaceLight,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={paymentOption === 'PAY_NOW' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={paymentOption === 'PAY_NOW' ? theme.primary : theme.textTertiary}
              />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>
                  {language === 'hi' ? '100% ऑनलाइन भुगतान (सर्वश्रेष्ठ छूट)' : 'Pay Full Amount Online'}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                  Guaranteed room reservation with Instant Check-in & priority upgrades.
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Option 2: Pay Token to Hold */}
          {hotel.payAtHotelPolicy.requireTokenDeposit && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaymentOption('TOKEN')}
              style={[
                styles.optionCard,
                {
                  marginTop: 10,
                  borderColor: paymentOption === 'TOKEN' ? theme.primary : theme.border,
                  backgroundColor: paymentOption === 'TOKEN' ? `${theme.primary}12` : theme.surfaceLight,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={paymentOption === 'TOKEN' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={paymentOption === 'TOKEN' ? theme.primary : theme.textTertiary}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>
                    {language === 'hi'
                      ? `₹${tokenDeposit} टोकन देकर रूम सुरक्षित करें`
                      : `Pay ₹${tokenDeposit} Token Deposit to Lock Room`}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                    Locks room overnight past 6 PM. Pay remaining ₹{total - tokenDeposit} during check-in.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Option 3: Pay at Hotel with 6 PM Cutoff */}
          {hotel.payAtHotelPolicy.allowPayAtHotel && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaymentOption('PAY_AT_HOTEL')}
              style={[
                styles.optionCard,
                {
                  marginTop: 10,
                  borderColor: paymentOption === 'PAY_AT_HOTEL' ? '#F59E0B' : theme.border,
                  backgroundColor: paymentOption === 'PAY_AT_HOTEL' ? '#F59E0B12' : theme.surfaceLight,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={paymentOption === 'PAY_AT_HOTEL' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={paymentOption === 'PAY_AT_HOTEL' ? '#F59E0B' : theme.textTertiary}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>
                    {language === 'hi' ? 'होटल पर नकद/कार्ड भुगतान (शाम 6 बजे कटऑफ)' : 'Pay at Hotel (6:00 PM Release Window)'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#D97706', marginTop: 2 }}>
                    ⚠️ Reservation automatically expires at 6:00 PM if check-in is unconfirmed.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Cancellation Policy Banner */}
        <View style={[styles.card, { backgroundColor: '#10B98115', borderColor: '#10B98144' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="shield-checkmark" size={18} color="#10B981" />
            <Text style={{ marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#10B981' }}>
              {hotel.cancellationPolicy.title}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 16 }}>
            {hotel.cancellationPolicy.description}
          </Text>
        </View>

        {/* Price Breakdown */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'मूल्य विवरण' : 'Price Breakdown'}
          </Text>

          <View style={styles.breakdownRow}>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Room Charge ({nights} night x {numRooms} room)</Text>
            <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>₹{subtotal}</Text>
          </View>

          <View style={[styles.breakdownRow, { marginTop: 8 }]}>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Taxes & GST ({room.taxPercentage}%)</Text>
            <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>₹{taxes}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.breakdownRow}>
            <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '800' }}>Total Amount</Text>
            <Text style={{ color: theme.primary, fontSize: 18, fontWeight: '800' }}>₹{total}</Text>
          </View>

          {paymentOption === 'TOKEN' && (
            <View style={[styles.breakdownRow, { marginTop: 10, padding: 8, backgroundColor: `${theme.primary}15`, borderRadius: 8 }]}>
              <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>Pay Today (Token Deposit)</Text>
              <Text style={{ color: theme.primary, fontSize: 15, fontWeight: '800' }}>₹{tokenDeposit}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Action */}
      <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <View>
          <Text style={{ fontSize: 11, color: theme.textTertiary, textTransform: 'uppercase', fontWeight: '700' }}>
            {paymentOption === 'TOKEN' ? 'Due Today' : 'Total Payable'}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.primary }}>
            ₹{paymentOption === 'TOKEN' ? tokenDeposit : paymentOption === 'PAY_AT_HOTEL' ? 0 : total}
          </Text>
        </View>

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
                ? 'Pay & Confirm'
                : paymentOption === 'TOKEN'
                ? 'Pay ₹500 & Hold'
                : 'Confirm Reservation'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingVertical: 14,
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
  scrollContent: { padding: 16, paddingBottom: 100 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  hotelName: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  hotelAddress: { fontSize: 12, marginBottom: 12 },
  roomName: { fontSize: 15, fontWeight: '700' },
  divider: { height: 1, marginVertical: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  confirmBtn: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
