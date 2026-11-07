import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../theme/colors';
import { useAppTheme } from '../../theme/themeStore';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import { AdminDashboardData, AdminActivity } from './types';

interface AdminDashboardHomeProps {
  navigation: any;
}

export const AdminDashboardHome: React.FC<AdminDashboardHomeProps> = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useAppTheme();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/admin/dashboard');
      const payload = res.data?.data || res.data;
      setData(payload);
    } catch (err: any) {
      console.warn('[AdminDashboardHome] Error fetching dashboard data:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Admin Panel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'PhoneEntry' }],
          });
        },
      },
    ]);
  };

  const getModuleBadgeColor = (module: string) => {
    switch (module?.toUpperCase()) {
      case 'FOOD':
        return AppColors.foodModule;
      case 'RIDE':
        return AppColors.rideModule;
      case 'BAZAAR':
        return AppColors.primary;
      default:
        return AppColors.yellow;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading Platform Metrics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            fetchDashboard();
          }}
          tintColor={theme.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Card */}
      <View style={[styles.topHeader, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.headerInfo}>
          <View style={styles.badgeRow}>
            <View style={[styles.adminBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
              <Text style={styles.adminBadgeText}>ADMIN CONSOLE</Text>
            </View>
          </View>
          <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>SuperApp Overview</Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
            Signed in as {user?.fullName || 'Super Administrator'} ({user?.mobileNumber || 'Live'})
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: theme.surfaceLight, borderColor: theme.border }]}
            onPress={toggleTheme}
            activeOpacity={0.8}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={isDark ? '#F59E0B' : '#6366F1'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={AppColors.red} />
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Cards Grid */}
      <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>PLATFORM METRICS</Text>
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: '#3B82F6' }]}>
          <View style={[styles.kpiIconWrapper, { backgroundColor: '#3B82F620' }]}>
            <Ionicons name="people" size={22} color="#3B82F6" />
          </View>
          <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>{data?.totalUsers ?? 0}</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Total Users</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: AppColors.secondary }]}>
          <View style={[styles.kpiIconWrapper, { backgroundColor: AppColors.secondary + '20' }]}>
            <Ionicons name="car" size={22} color={AppColors.secondary} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>{data?.activeDrivers ?? 0}</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Active Drivers</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: AppColors.yellow }]}>
          <View style={[styles.kpiIconWrapper, { backgroundColor: AppColors.yellow + '20' }]}>
            <Ionicons name="restaurant" size={22} color={AppColors.yellow} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>{data?.totalRestaurants ?? 0}</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Restaurants</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: AppColors.primary }]}>
          <View style={[styles.kpiIconWrapper, { backgroundColor: AppColors.primary + '20' }]}>
            <Ionicons name="bag-handle" size={22} color={AppColors.primary} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>{data?.activeListings ?? 0}</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Marketplace Ads</Text>
        </View>
      </View>

      {/* Revenue Snapshot Card */}
      <View style={[styles.revenueCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.revenueHeader}>
          <Ionicons name="wallet-outline" size={18} color={AppColors.primary} />
          <Text style={styles.revenueHeaderText}>FINANCIAL SUMMARY</Text>
        </View>
        <View style={styles.revenueRow}>
          <View style={styles.revenueCol}>
            <Text style={[styles.revenueSublabel, { color: theme.textSecondary }]}>Food Sales</Text>
            <Text style={[styles.revenueValue, { color: theme.textPrimary }]}>₹{data?.grossFoodSales?.toLocaleString() ?? 0}</Text>
          </View>
          <View style={[styles.revenueDivider, { backgroundColor: theme.border }]} />
          <View style={styles.revenueCol}>
            <Text style={[styles.revenueSublabel, { color: theme.textSecondary }]}>Ride Volume</Text>
            <Text style={[styles.revenueValue, { color: theme.textPrimary }]}>₹{data?.grossRideFares?.toLocaleString() ?? 0}</Text>
          </View>
          <View style={[styles.revenueDivider, { backgroundColor: theme.border }]} />
          <View style={styles.revenueCol}>
            <Text style={[styles.revenueSublabel, { color: AppColors.primary }]}>Platform Net</Text>
            <Text style={[styles.revenueValue, { color: AppColors.primary }]}>
              ₹{data?.platformRevenue?.toLocaleString() ?? 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Navigation Cards */}
      <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>MANAGEMENT SECTIONS</Text>
      <View style={styles.navGrid}>
        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminPushNotifications')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#F43F5E20' }]}>
            <Ionicons name="notifications" size={24} color="#F43F5E" />
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Push Notifications (FCM)</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>Targeted campaigns, segments & history</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminUsers')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#3B82F620' }]}>
            <Ionicons name="people-outline" size={24} color="#3B82F6" />
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Users & Roles</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>Manage accounts, roles, and status</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminListings')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#F9731620' }]}>
            <Ionicons name="list-outline" size={24} color="#F97316" />
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Food & Marketplace Listings</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>Search, edit, activate or delete on one page</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminRestaurants')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: AppColors.yellow + '20' }]}>
            <Ionicons name="restaurant-outline" size={24} color={AppColors.yellow} />
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Restaurants</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>Directory, approvals, and menus</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminDrivers')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: AppColors.secondary + '20' }]}>
            <Ionicons name="car-outline" size={24} color={AppColors.secondary} />
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Drivers & Captains</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>Verification, vehicle reg, and duty</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminOrders')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: AppColors.primary + '20' }]}>
            <Ionicons name="receipt-outline" size={24} color={AppColors.primary} />
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Orders & Rides</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>Live orders tracking and ride records</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminPayments')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="card-outline" size={24} color="#10B981" />
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Payments & Payouts</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>Razorpay settlements and gross intake</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminRoleApplications')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#22D3EE20' }]}>
            <Ionicons name="people-circle-outline" size={24} color="#22D3EE" />
            {(data?.pendingRoleApplications ?? 0) > 0 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {(data?.pendingRoleApplications ?? 0) > 99
                    ? '99+'
                    : String(data?.pendingRoleApplications)}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Role Applications</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>
              {(data?.pendingRoleApplications ?? 0) > 0
                ? `${data?.pendingRoleApplications} waiting for approval`
                : 'Approve rider / hotel requests from citizens'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminCoupons')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#EC489920' }]}>
            <Ionicons name="pricetag-outline" size={24} color="#EC4899" />
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Coupons & Promos</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>Create, edit discounts & hotel limits</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminHotelCommissions')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="calculator-outline" size={24} color="#F59E0B" />
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Hotel Commission & Settlement</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>Ledger balances, rates & payout batches</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminRideFares')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#06B6D420' }]}>
            <Ionicons name="speedometer-outline" size={24} color="#06B6D4" />
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Ride Fare Configuration</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>Per-km, base fare, surge & vehicle tiers</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminSettings')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#8B5CF620' }]}>
            <Ionicons name="settings-outline" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.navCardInfo}>
            <Text style={[styles.navCardTitle, { color: theme.textPrimary }]}>Settings & Broadcast</Text>
            <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>Platform toggles and push alerts</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Recent Platform Activities */}
      <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>RECENT ACTIVITIES</Text>
      {(!data?.recentActivities || data.recentActivities.length === 0) ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No recent activity logged</Text>
        </View>
      ) : (
        data.recentActivities.map((act: AdminActivity) => (
          <View key={act.id} style={[styles.activityItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View
              style={[
                styles.activityBadge,
                { backgroundColor: getModuleBadgeColor(act.module) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.activityBadgeText,
                  { color: getModuleBadgeColor(act.module) },
                ]}
              >
                {act.module}
              </Text>
            </View>
            <View style={styles.activityMain}>
              <Text style={[styles.activityDesc, { color: theme.textPrimary }]} numberOfLines={1}>
                {act.description}
              </Text>
              <Text style={[styles.activityTime, { color: theme.textSecondary }]}>
                {new Date(act.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            {act.amount !== undefined && (
              <Text style={styles.activityAmount}>₹{act.amount}</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  headerInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#371818',
    borderRadius: 12,
  },
  themeBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: AppColors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  kpiIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  kpiLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  revenueCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  revenueHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: AppColors.primary,
    letterSpacing: 0.8,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueCol: {
    flex: 1,
    alignItems: 'center',
  },
  revenueDivider: {
    width: 1,
    height: 30,
    backgroundColor: AppColors.border,
  },
  revenueSublabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  navGrid: {
    gap: 10,
    marginBottom: 20,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  navIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: AppColors.surface,
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  navCardInfo: {
    flex: 1,
  },
  navCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  navCardSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  activityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  activityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activityMain: {
    flex: 1,
  },
  activityDesc: {
    fontSize: 13,
    color: AppColors.textPrimary,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.secondary,
    marginLeft: 8,
  },
  emptyCard: {
    backgroundColor: AppColors.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
});
