import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { useRoleStore, ROLE_CONFIGS } from '../store/roleStore';
import { useAppTheme } from '../theme/themeStore';
import { HomeScreen } from '../features/home/HomeScreen';
import { FoodHomeScreen } from '../features/food/FoodHomeScreen';
import { RideBookingScreen } from '../features/ride/RideBookingScreen';
import { MarketplaceHomeScreen } from '../features/marketplace/MarketplaceHomeScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { DriverHomeScreen } from '../features/driver/DriverHomeScreen';
import { DriverRidesScreen } from '../features/driver/DriverRidesScreen';
import { DriverEarningsScreen } from '../features/driver/DriverEarningsScreen';
import { VendorDashboardScreen } from '../features/vendor/VendorDashboardScreen';
import { VendorOrdersScreen } from '../features/vendor/VendorOrdersScreen';
import { VendorMenuScreen } from '../features/vendor/VendorMenuScreen';
import { SellerDashboardScreen } from '../features/seller/SellerDashboardScreen';
import { AddListingScreen } from '../features/marketplace/AddListingScreen';
import { AdminDashboardScreen } from '../features/admin/AdminDashboardScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const { activeRole } = useRoleStore();
  const { theme, isDark } = useAppTheme();
  const config = ROLE_CONFIGS[activeRole] || ROLE_CONFIGS.CUSTOMER;
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);

  const activeColor = config.color;
  const inactiveColor = theme.textTertiary;

  return (
    <Tab.Navigator
      key={activeRole}
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.background },
        tabBarStyle: {
          backgroundColor: theme.tabBarBg,
          borderTopColor: theme.cardBorder,
          borderTopWidth: 1,
          height: 54 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      {activeRole === 'CUSTOMER' && (
        <>
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: 'Home',
              tabBarButtonTestID: 'tab-home',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'home' : 'home-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Food"
            component={FoodHomeScreen}
            options={{
              tabBarLabel: 'Food',
              tabBarButtonTestID: 'tab-food',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: '#FF5A1F' }]} />}
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Rides"
            component={RideBookingScreen}
            options={{
              tabBarLabel: 'Rides',
              tabBarButtonTestID: 'tab-rides',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'car-sport' : 'car-sport-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: '#2563EB' }]} />}
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Bazaar"
            component={MarketplaceHomeScreen}
            options={{
              tabBarLabel: 'Bazaar',
              tabBarButtonTestID: 'tab-bazaar',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: '#D97706' }]} />}
                </View>
              ),
            }}
          />
        </>
      )}

      {activeRole === 'DRIVER' && (
        <>
          <Tab.Screen
            name="DriverHome"
            component={DriverHomeScreen}
            options={{
              tabBarLabel: 'Duty',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'car-sport' : 'car-sport-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="DriverRides"
            component={DriverRidesScreen}
            options={{
              tabBarLabel: 'Trips',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'list' : 'list-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="DriverEarnings"
            component={DriverEarningsScreen}
            options={{
              tabBarLabel: 'Earnings',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'cash' : 'cash-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
                </View>
              ),
            }}
          />
        </>
      )}

      {activeRole === 'RESTAURANT_OWNER' && (
        <>
          <Tab.Screen
            name="VendorDashboard"
            component={VendorDashboardScreen}
            options={{
              tabBarLabel: 'Overview',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'grid' : 'grid-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="VendorOrders"
            component={VendorOrdersScreen}
            options={{
              tabBarLabel: 'Kitchen',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="VendorMenu"
            component={VendorMenuScreen}
            options={{
              tabBarLabel: 'Menu',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'fast-food' : 'fast-food-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
                </View>
              ),
            }}
          />
        </>
      )}

      {activeRole === 'MARKETPLACE_SELLER' && (
        <>
          <Tab.Screen
            name="SellerDashboard"
            component={SellerDashboardScreen}
            options={{
              tabBarLabel: 'My Store',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="SellerAddListing"
            component={AddListingScreen}
            options={{
              tabBarLabel: 'Post Ad',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={23} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
                </View>
              ),
            }}
          />
        </>
      )}

      {activeRole === 'ADMIN' && (
        <>
          <Tab.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{
              tabBarLabel: 'Management',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconWrapper}>
                  <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={21} color={color} />
                  {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
                </View>
              ),
            }}
          />
        </>
      )}

      {/* Shared Account Tab across all roles */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarButtonTestID: 'tab-account',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={23} color={color} />
              {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
