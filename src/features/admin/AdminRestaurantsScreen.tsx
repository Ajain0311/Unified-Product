import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../theme/colors';
import { useAppTheme } from '../../theme/themeStore';
import { apiClient } from '../../services/apiClient';
import { FormKeyboardAvoid } from '../../components/common/FormKeyboardAvoid';
import { AdminRestaurant } from './types';

interface AdminRestaurantsScreenProps {
  navigation: any;
}

export const AdminRestaurantsScreen: React.FC<AdminRestaurantsScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Add Restaurant Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Chandigarh');
  const [address, setAddress] = useState('');
  const [isVeg, setIsVeg] = useState(false);
  const [minOrder, setMinOrder] = useState('100');
  const [deliveryFee, setDeliveryFee] = useState('30');
  const [isSaving, setIsSaving] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();

      const res = await apiClient.get<any>('/admin/restaurants', { params });
      const payload = res.data?.data || res.data || [];
      setRestaurants(payload);
    } catch (err: any) {
      console.warn('[AdminRestaurantsScreen] Error fetching restaurants:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    setIsLoading(true);
    const delay = setTimeout(() => {
      fetchRestaurants();
    }, 250);
    return () => clearTimeout(delay);
  }, [fetchRestaurants]);

  const handleToggleStatus = async (item: AdminRestaurant) => {
    const updatedStatus = !item.isActive;
    try {
      await apiClient.post('/admin/restaurants', {
        action: 'STATUS',
        id: item.id,
        isActive: updatedStatus,
      });

      setRestaurants((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, isActive: updatedStatus } : r))
      );
      Alert.alert('Status Updated', `${item.name} is now ${updatedStatus ? 'ACTIVE' : 'INACTIVE'}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update restaurant status');
    }
  };

  const handleAddRestaurant = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a restaurant name.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiClient.post<any>('/admin/restaurants', {
        action: 'ADD',
        name: name.trim(),
        description: description.trim() || name.trim(),
        phone: phone.trim() || '9876543210',
        city: city.trim() || 'Chandigarh',
        addressLine: address.trim() || 'Main Market',
        isVeg,
        minOrderAmount: parseFloat(minOrder) || 100,
        deliveryFee: parseFloat(deliveryFee) || 30,
        isFeatured: false,
      });

      const created = res.data?.data || res.data;
      if (created?.id) {
        setRestaurants((prev) => [created, ...prev]);
      }
      setShowAddModal(false);
      setName('');
      setDescription('');
      setPhone('');
      setAddress('');
      Alert.alert('Success 🎉', `Restaurant "${name.trim()}" published successfully!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add restaurant');
    } finally {
      setIsSaving(false);
    }
  };

  const renderRestaurantCard = ({ item }: { item: AdminRestaurant }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.nameRow}>
              <Text style={styles.restaurantName}>{item.name}</Text>
              {item.isVeg && (
                <View style={styles.vegBadge}>
                  <Text style={styles.vegBadgeText}>PURE VEG</Text>
                </View>
              )}
            </View>
            <Text style={styles.locationText}>
              <Ionicons name="location-outline" size={12} color={AppColors.textSecondary} />{' '}
              {item.city || 'City'} • {item.addressLine || 'Address'}
            </Text>
          </View>
          <View style={styles.statusSwitch}>
            <Switch
              value={item.isActive}
              onValueChange={() => handleToggleStatus(item)}
              trackColor={{ false: AppColors.surfaceLight, true: AppColors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Min Order</Text>
            <Text style={styles.detailValue}>₹{item.minOrderAmount}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Delivery Fee</Text>
            <Text style={styles.detailValue}>₹{item.deliveryFee}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Rating</Text>
            <Text style={[styles.detailValue, { color: AppColors.yellow }]}>
              ★ {item.rating ?? '4.5'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Restaurants</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search by restaurant name or city..."
            placeholderTextColor={theme.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Restaurants List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Fetching restaurants...</Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRestaurantCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchRestaurants();
              }}
              tintColor={AppColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color={AppColors.border} />
              <Text style={styles.emptyTitle}>No Restaurants Found</Text>
              <Text style={styles.emptySubtitle}>Tap "+ Add" above to register a restaurant</Text>
            </View>
          }
        />
      )}

      {/* Add Restaurant Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <FormKeyboardAvoid>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Add New Restaurant</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Restaurant Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.cardBorder }]}
                placeholder="e.g. Royal Heritage Dhaba"
                placeholderTextColor={theme.textTertiary}
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.cardBorder }]}
                placeholder="Cuisine, specialties..."
                placeholderTextColor={theme.textTertiary}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Contact Phone</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.cardBorder }]}
                placeholder="10-digit mobile number"
                placeholderTextColor={theme.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>City</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.cardBorder }]}
                    placeholder="City"
                    placeholderTextColor={theme.textTertiary}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Address Line</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.cardBorder }]}
                    placeholder="Market / Area"
                    placeholderTextColor={theme.textTertiary}
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Min Order (₹)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.cardBorder }]}
                    placeholder="100"
                    placeholderTextColor={theme.textTertiary}
                    value={minOrder}
                    onChangeText={setMinOrder}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Delivery Fee (₹)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.cardBorder }]}
                    placeholder="30"
                    placeholderTextColor={theme.textTertiary}
                    value={deliveryFee}
                    onChangeText={setDeliveryFee}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.vegSwitchRow}>
                <Text style={[styles.vegSwitchLabel, { color: theme.textPrimary }]}>Pure Vegetarian Restaurant</Text>
                <Switch
                  value={isVeg}
                  onValueChange={setIsVeg}
                  trackColor={{ false: theme.cardBorder, true: theme.secondary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                onPress={handleAddRestaurant}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Create & Publish Restaurant</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        </FormKeyboardAvoid>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: AppColors.surfaceLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchContainer: {
    padding: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
  },
  listContent: {
    padding: 14,
    gap: 12,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  vegBadge: {
    backgroundColor: '#00C85320',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vegBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: AppColors.secondary,
  },
  locationText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  statusSwitch: {
    marginLeft: 10,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: AppColors.border,
    paddingTop: 10,
  },
  detailCol: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: AppColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: AppColors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
  },
  vegSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },
  vegSwitchLabel: {
    fontSize: 14,
    color: AppColors.textPrimary,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
