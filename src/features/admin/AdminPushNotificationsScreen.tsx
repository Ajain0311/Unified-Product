import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';
import { useAppTheme } from '../../theme/themeStore';

export interface CampaignHistoryItem {
  id: number;
  title: string;
  body: string;
  imageUrl?: string;
  targetAudiences: string[];
  deepLink?: string;
  scheduledFor?: string;
  status: string;
  sentByAdminName?: string;
  totalTargeted: number;
  acceptedByFcm: number;
  deviceFailed: number;
  devicePruned: number;
  openedCount: number;
  failureReason?: string;
  createdAt: string;
  sentAt?: string;
}

const AUDIENCE_OPTIONS = [
  { id: 'ALL_CUSTOMERS', label: 'All Registered Customers', icon: 'people-outline' },
  { id: 'FOOD_CUSTOMERS', label: 'Food Delivery Customers', icon: 'fast-food-outline' },
  { id: 'RIDE_CUSTOMERS', label: 'Ride / Cab Customers', icon: 'car-sport-outline' },
  { id: 'MARKETPLACE_CUSTOMERS', label: 'Marketplace Buyers', icon: 'basket-outline' },
  { id: 'HOTEL_CUSTOMERS', label: 'Hotel & Stay Guests', icon: 'bed-outline' },
  { id: 'BAR_CUSTOMERS', label: 'Bar & Lounge Visitors', icon: 'wine-outline' },
  { id: 'CAFE_CUSTOMERS', label: 'Cafe & Beverage Patrons', icon: 'cafe-outline' },
  { id: 'B2B_WATER_CUSTOMERS', label: 'B2B Water Buyers', icon: 'water-outline' },
  { id: 'RESTAURANT_OWNERS', label: 'Restaurant Owners', icon: 'restaurant-outline' },
  { id: 'DRIVERS', label: 'Drivers & Captains', icon: 'car-outline' },
  { id: 'MARKETPLACE_SELLERS', label: 'Marketplace Sellers', icon: 'storefront-outline' },
  { id: 'HOTEL_OWNERS', label: 'Hotel Owners', icon: 'business-outline' },
  { id: 'BAR_OWNERS', label: 'Bar Owners', icon: 'beer-outline' },
  { id: 'CAFE_OWNERS', label: 'Cafe Owners', icon: 'ice-cream-outline' },
  { id: 'B2B_SUPPLIERS', label: 'B2B Water Suppliers', icon: 'cube-outline' },
  { id: 'INACTIVE_USERS', label: 'Inactive Users (>30 Days)', icon: 'time-outline' },
];

export const AdminPushNotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();

  const [activeTab, setActiveTab] = useState<'COMPOSE' | 'HISTORY'>('COMPOSE');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Compose State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deepLink, setDeepLink] = useState('MainTabs');
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(['ALL_CUSTOMERS']);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDelayHours, setScheduleDelayHours] = useState('2');

  // History State
  const [campaigns, setCampaigns] = useState<CampaignHistoryItem[]>([]);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/admin/notifications/campaigns');
      if (Array.isArray(res)) {
        setCampaigns(res);
      } else if (res?.data && Array.isArray(res.data)) {
        setCampaigns(res.data);
      }
    } catch (e: any) {
      console.warn('Failed to load campaigns:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const toggleAudience = (id: string) => {
    if (id === 'ALL_CUSTOMERS') {
      setSelectedAudiences(['ALL_CUSTOMERS']);
      return;
    }

    const filtered = selectedAudiences.filter((a) => a !== 'ALL_CUSTOMERS');
    if (filtered.includes(id)) {
      const next = filtered.filter((a) => a !== id);
      setSelectedAudiences(next.length === 0 ? ['ALL_CUSTOMERS'] : next);
    } else {
      setSelectedAudiences([...filtered, id]);
    }
  };

  const handleSendCampaign = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Required', 'Please enter a notification title and message body.');
      return;
    }

    let scheduledFor: string | undefined;
    if (isScheduled) {
      const hours = parseFloat(scheduleDelayHours) || 2;
      scheduledFor = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    }

    try {
      setLoading(true);
      const res = await apiClient.post('/admin/notifications/campaigns', {
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || undefined,
        deepLink: deepLink.trim() || undefined,
        targetAudiences: selectedAudiences,
        scheduledFor,
      });

      if (res.success) {
        Alert.alert(
          'Campaign Dispatched',
          `Notification successfully created and targeted to ${res.data?.totalTargeted ?? 'target'} recipients.`
        );
        setTitle('');
        setBody('');
        setImageUrl('');
        setActiveTab('HISTORY');
        fetchCampaigns();
      } else {
        Alert.alert('Error', res.message || 'Failed to dispatch notification campaign.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Push Notifications</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>FCM Mobile Broadcast & Targeting</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchCampaigns}>
          <Ionicons name="reload" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Segment Tab Toggle */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'COMPOSE' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('COMPOSE')}
        >
          <Ionicons
            name="send-outline"
            size={16}
            color={activeTab === 'COMPOSE' ? '#FFF' : theme.textSecondary}
          />
          <Text style={[styles.tabBtnText, { color: activeTab === 'COMPOSE' ? '#FFF' : theme.textSecondary }]}>
            Compose Campaign
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'HISTORY' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('HISTORY')}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={activeTab === 'HISTORY' ? '#FFF' : theme.textSecondary}
          />
          <Text style={[styles.tabBtnText, { color: activeTab === 'HISTORY' ? '#FFF' : theme.textSecondary }]}>
            Campaign History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'COMPOSE' ? (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Target Audience Selector */}
          <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>1. SELECT AUDIENCE SEGMENT</Text>
          <View style={styles.audienceGrid}>
            {AUDIENCE_OPTIONS.map((opt) => {
              const isSelected = selectedAudiences.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.audienceChip,
                    {
                      backgroundColor: isSelected ? theme.primary + '20' : theme.card,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => toggleAudience(opt.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={isSelected ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.audienceText,
                      { color: isSelected ? theme.primary : theme.textPrimary, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notification Details Form */}
          <Text style={[styles.inputLabel, { color: theme.textPrimary, marginTop: 18 }]}>2. NOTIFICATION CONTENT</Text>
          
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.fieldTitle, { color: theme.textSecondary }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="e.g. Special Offer: 20% OFF Mandphiya Dining!"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              maxLength={150}
            />

            <Text style={[styles.fieldTitle, { color: theme.textSecondary, marginTop: 12 }]}>Message Body</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Enter engaging notification text for customers..."
              placeholderTextColor={theme.textSecondary}
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <Text style={[styles.fieldTitle, { color: theme.textSecondary, marginTop: 12 }]}>Optional Image URL</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="https://... (banner or promo image)"
              placeholderTextColor={theme.textSecondary}
              value={imageUrl}
              onChangeText={setImageUrl}
            />

            <Text style={[styles.fieldTitle, { color: theme.textSecondary, marginTop: 12 }]}>Deep-Link Screen Target</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="MainTabs (or FoodDelivery, RideBooking, Bazaar)"
              placeholderTextColor={theme.textSecondary}
              value={deepLink}
              onChangeText={setDeepLink}
            />
          </View>

          {/* Live Mobile Push Preview */}
          <Text style={[styles.inputLabel, { color: theme.textPrimary, marginTop: 18 }]}>3. LIVE NOTIFICATION PREVIEW</Text>
          <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.previewHeader}>
              <View style={styles.previewAppBadge}>
                <Ionicons name="sparkles" size={12} color="#FFF" />
                <Text style={styles.previewAppName}>ZUPIFY SUPERAPP</Text>
              </View>
              <Text style={[styles.previewTime, { color: theme.textSecondary }]}>Now</Text>
            </View>

            <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>
              {title.trim() || 'Notification Title Preview'}
            </Text>
            <Text style={[styles.previewBody, { color: theme.textSecondary }]}>
              {body.trim() || 'Notification body message will be rendered here for user attention...'}
            </Text>

            {imageUrl.trim().length > 0 && (
              <Image
                source={{ uri: imageUrl.trim() }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSendCampaign}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color="#FFF" />
                <Text style={styles.submitBtnText}>Dispatch Push Notification Now</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCampaigns(); }} tintColor={theme.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {campaigns.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="notifications-off-outline" size={38} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Notification Campaigns</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Compose a targeted campaign to broadcast notifications.
              </Text>
            </View>
          ) : (
            campaigns.map((c) => (
              <View key={c.id} style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.historyTopRow}>
                  <View style={[styles.statusBadge, { backgroundColor: c.status === 'SENT' ? '#10B98120' : '#F59E0B20' }]}>
                    <Text style={[styles.statusText, { color: c.status === 'SENT' ? '#10B981' : '#F59E0B' }]}>
                      {c.status}
                    </Text>
                  </View>
                  <Text style={[styles.historyDate, { color: theme.textSecondary }]}>
                    {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <Text style={[styles.historyTitle, { color: theme.textPrimary }]}>{c.title}</Text>
                <Text style={[styles.historyBody, { color: theme.textSecondary }]}>{c.body}</Text>

                {/* Metrics Breakdown */}
                <View style={[styles.metricsRow, { borderColor: theme.border }]}>
                  <View style={styles.metricCol}>
                    <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{c.totalTargeted}</Text>
                    <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Targeted</Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={[styles.metricVal, { color: '#10B981' }]}>{c.acceptedByFcm}</Text>
                    <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>FCM Accepted</Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={[styles.metricVal, { color: '#EF4444' }]}>{c.deviceFailed}</Text>
                    <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Failed</Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={[styles.metricVal, { color: '#6366F1' }]}>{c.openedCount}</Text>
                    <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Opened</Text>
                  </View>
                </View>

                {c.failureReason && (
                  <Text style={styles.failureReasonText}>Note: {c.failureReason}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 8,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  audienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  audienceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  audienceText: {
    fontSize: 12,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  fieldTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  previewCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewAppBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  previewAppName: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  previewTime: {
    fontSize: 11,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  previewBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginTop: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  historyCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  historyDate: {
    fontSize: 11,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  historyBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricLbl: {
    fontSize: 10,
    marginTop: 2,
  },
  failureReasonText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 8,
  },
});
