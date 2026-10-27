import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../theme/colors';
import { hotelService } from '../../services/hotelService';
import { Hotel } from '../../models/hotel';

export const AdminHotelCommissionsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [activeTab, setActiveTab] = useState<'HOTELS' | 'PAYOUTS'>('HOTELS');
  const [isLoading, setIsLoading] = useState(true);

  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [commissionRate, setCommissionRate] = useState('12');

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    setIsLoading(true);
    const data = await hotelService.getHotels();
    setHotels(data);
    setIsLoading(false);
  };

  const handleUpdateCommission = () => {
    if (!selectedHotel) return;
    Alert.alert(
      'Commission Updated',
      `Hotel platform commission for "${selectedHotel.name}" updated to ${commissionRate}%.`
    );
    setRateModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={AppColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hotel Commissions & Settlements</Text>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'HOTELS' && styles.tabActive]}
          onPress={() => setActiveTab('HOTELS')}
        >
          <Text style={[styles.tabText, activeTab === 'HOTELS' && styles.tabTextActive]}>
            Partner Hotels ({hotels.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'PAYOUTS' && styles.tabActive]}
          onPress={() => setActiveTab('PAYOUTS')}
        >
          <Text style={[styles.tabText, activeTab === 'PAYOUTS' && styles.tabTextActive]}>
            Settlement Payouts
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading ? (
          <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 40 }} />
        ) : activeTab === 'HOTELS' ? (
          hotels.map((hotel) => (
            <View key={hotel.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hotelName}>{hotel.name}</Text>
                  <Text style={styles.hotelLocation}>{hotel.city} • {hotel.starRating}-Star</Text>
                </View>
                <View style={styles.rateTag}>
                  <Text style={styles.rateTagText}>12% Comm.</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statLabel}>Total Bookings</Text>
                  <Text style={styles.statVal}>₹1,48,990</Text>
                </View>
                <View>
                  <Text style={styles.statLabel}>Pay-At-Hotel Policy</Text>
                  <Text style={[styles.statVal, { color: hotel.payAtHotelPolicy.allowPayAtHotel ? AppColors.success : AppColors.error }]}>
                    {hotel.payAtHotelPolicy.allowPayAtHotel ? 'Enabled (6 PM)' : 'Online Prepay Only'}
                  </Text>
                </View>
              </View>

              {/* Settlement Cashflow Breakdown: Prepaid Online vs Pay-at-Hotel */}
              <View style={{ backgroundColor: '#0F172A', borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#334155' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' }}>
                  Hotel Cashflow & Commission Payout Breakdown
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: '#CBD5E1' }}>Prepaid Online Bookings (Payout Due):</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>
                    ₹1,31,111
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 6 }}>
                  App collected ₹1,48,990 via Gateway; Partner receives 88% net payout
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: '#CBD5E1' }}>Pay-at-Hotel / Walk-in (Comm Due):</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>
                    ₹4,200
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 8 }}>
                  Guest paid at counter; 12% platform fee to collect
                </Text>

                <View style={{ height: 1, backgroundColor: '#334155', marginVertical: 4 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Net Admin Action:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#10B981' }}>
                    Transfer Payout: ₹1,26,911
                  </Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtnOutline}
                  onPress={() => {
                    setSelectedHotel(hotel);
                    setRateModalVisible(true);
                  }}
                >
                  <Ionicons name="create-outline" size={15} color={AppColors.primary} />
                  <Text style={styles.actionBtnOutlineText}>Set Commission Rate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnFilled}
                  onPress={() => {
                    Alert.alert(
                      'Process Settlement',
                      `Pay Net Payout of ₹1,26,911 to ${hotel.name} after deducting 12% commission and counter fees?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Confirm Payout',
                          onPress: () => Alert.alert('Success', `Bank transfer of ₹1,26,911 processed for ${hotel.name}. Status marked SETTLED.`),
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="card-outline" size={15} color="#FFF" />
                  <Text style={styles.actionBtnFilledText}>Process Net Settlement</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle" size={48} color={AppColors.success} />
            <Text style={styles.emptyTitle}>All Hotel Accounts Settled</Text>
            <Text style={styles.emptySub}>Zero pending payout disputes for current settlement cycle.</Text>
          </View>
        )}
      </ScrollView>

      {/* Set Rate Modal */}
      {selectedHotel && (
        <Modal transparent animationType="fade" visible={rateModalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Set Platform Commission</Text>
              <Text style={styles.modalSub}>{selectedHotel.name}</Text>

              <Text style={styles.inputLabel}>COMMISSION RATE PERCENTAGE (%)</Text>
              <TextInput
                style={styles.input}
                value={commissionRate}
                onChangeText={setCommissionRate}
                keyboardType="numeric"
                placeholder="e.g. 12"
                placeholderTextColor={AppColors.textSecondary}
              />

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setRateModalVisible(false)}
                >
                  <Text style={{ color: AppColors.textPrimary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSave}
                  onPress={handleUpdateCommission}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Save Commission</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginLeft: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomColor: AppColors.primary, borderBottomWidth: 3 },
  tabText: { fontSize: 13, fontWeight: '700', color: AppColors.textSecondary },
  tabTextActive: { color: AppColors.primary },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 14,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hotelName: { fontSize: 15, fontWeight: '700', color: AppColors.textPrimary },
  hotelLocation: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  rateTag: {
    backgroundColor: `${AppColors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rateTagText: { fontSize: 11, fontWeight: '700', color: AppColors.primary },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statLabel: { fontSize: 11, color: AppColors.textSecondary },
  statVal: { fontSize: 13, fontWeight: '700', color: AppColors.textPrimary, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.primary,
    gap: 4,
  },
  actionBtnOutlineText: { fontSize: 11, fontWeight: '700', color: AppColors.primary },
  actionBtnFilled: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    gap: 4,
  },
  actionBtnFilledText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: AppColors.textPrimary, marginTop: 10 },
  emptySub: { fontSize: 12, color: AppColors.textSecondary, textAlign: 'center', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: AppColors.textPrimary },
  modalSub: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2, marginBottom: 12 },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: AppColors.surfaceLight,
    color: AppColors.textPrimary,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
  },
  modalSave: {
    flex: 1,
    backgroundColor: AppColors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
