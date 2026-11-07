import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { SplashScreen } from '../features/splash/SplashScreen';
import { PhoneEntryScreen } from '../features/auth/PhoneEntryScreen';
import { OtpVerificationScreen } from '../features/auth/OtpVerificationScreen';
import { AdminPortalScreen } from '../features/admin/AdminPortalScreen';
import { RestaurantDetailScreen } from '../features/food/RestaurantDetailScreen';
import { FoodOrderTrackingScreen } from '../features/food/FoodOrderTrackingScreen';
import { ActiveRideScreen } from '../features/ride/ActiveRideScreen';
import { ListingDetailScreen } from '../features/marketplace/ListingDetailScreen';
import { MarketplaceChatScreen } from '../features/marketplace/MarketplaceChatScreen';
import { AddListingScreen } from '../features/marketplace/AddListingScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { SavedAddressesScreen } from '../features/profile/SavedAddressesScreen';
import { HelpSupportScreen } from '../features/profile/HelpSupportScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { ActivityScreen } from '../features/activity/ActivityScreen';
import { VendorOrdersScreen } from '../features/vendor/VendorOrdersScreen';
import { VendorMenuScreen } from '../features/vendor/VendorMenuScreen';
import { VendorSettlementsScreen } from '../features/vendor/VendorSettlementsScreen';
import { SellerSettlementsScreen } from '../features/marketplace/SellerSettlementsScreen';
import { DriverRidesScreen } from '../features/driver/DriverRidesScreen';
import { DriverEarningsScreen } from '../features/driver/DriverEarningsScreen';
import { AdminCouponsScreen } from '../features/admin/AdminCouponsScreen';
import { AdminHotelCommissionsScreen } from '../features/admin/AdminHotelCommissionsScreen';
import { AdminRestaurantCommissionsScreen } from '../features/admin/AdminRestaurantCommissionsScreen';
import { AdminRideFaresScreen } from '../features/admin/AdminRideFaresScreen';
import { AdminRoleApplicationsScreen } from '../features/admin/AdminRoleApplicationsScreen';
import { RoleApplicationScreen } from '../features/profile/RoleApplicationScreen';
import {
  HotelHomeScreen,
  HotelDetailScreen,
  HotelCheckoutScreen,
  HotelMyBookingsScreen,
  HotelOwnerDashboardScreen,
} from '../features/hotels';
import { BarHubScreen } from '../features/bars/BarHubScreen';
import { BeverageHubScreen } from '../features/beverages/BeverageHubScreen';
import { B2BWaterSuppliesScreen } from '../features/supplies/B2BWaterSuppliesScreen';
import { ModuleCatalogScreen } from '../features/modules/ModuleCatalogScreen';
import { GrowWithSuperAppScreen } from '../features/grow/GrowWithSuperAppScreen';
import { SubmitBusinessRequestScreen } from '../features/grow/SubmitBusinessRequestScreen';
import { MyBusinessRequestsScreen } from '../features/grow/MyBusinessRequestsScreen';
import { AdminBusinessRequestsScreen } from '../features/admin/AdminBusinessRequestsScreen';
import { LazyScreen } from '../components/LazyScreen';
import { useAppTheme } from '../theme/themeStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigatorComponent: React.FC = () => {
  const { theme } = useAppTheme();

  const screenOptions = React.useMemo(() => ({
    headerShown: false,
    animation: 'slide_from_right' as const,
    contentStyle: { backgroundColor: theme.background },
  }), [theme.background]);

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={screenOptions}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="AdminPortal" component={AdminPortalScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="FoodOrderTracking" component={FoodOrderTrackingScreen} />
      <Stack.Screen name="ActiveRide" component={ActiveRideScreen} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <Stack.Screen name="MarketplaceChat" component={MarketplaceChatScreen} />
      <Stack.Screen name="AddListing" component={AddListingScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Activity" component={ActivityScreen} />
      <Stack.Screen name="KitchenOrders" component={VendorOrdersScreen} />
      <Stack.Screen name="VendorMenu" component={VendorMenuScreen} />
      <Stack.Screen name="VendorSettlements" component={VendorSettlementsScreen} />
      <Stack.Screen name="SellerSettlements" component={SellerSettlementsScreen} />
      <Stack.Screen name="DriverRides" component={DriverRidesScreen} />
      <Stack.Screen name="DriverEarnings" component={DriverEarningsScreen} />
      <Stack.Screen name="AdminCoupons" component={AdminCouponsScreen} />
      <Stack.Screen name="AdminHotelCommissions" component={AdminHotelCommissionsScreen} />
      <Stack.Screen name="AdminRestaurantCommissions" component={AdminRestaurantCommissionsScreen} />
      <Stack.Screen name="AdminRideFares" component={AdminRideFaresScreen} />
      <Stack.Screen name="AdminRoleApplications" component={AdminRoleApplicationsScreen} />
      <Stack.Screen name="RoleApplication" component={RoleApplicationScreen} />
      <Stack.Screen name="HotelHome" component={HotelHomeScreen} />
      <Stack.Screen name="HotelDetail" component={HotelDetailScreen} />
      <Stack.Screen name="HotelCheckout" component={HotelCheckoutScreen} />
      <Stack.Screen name="HotelMyBookings" component={HotelMyBookingsScreen} />
      <Stack.Screen name="HotelOwnerDashboard" component={HotelOwnerDashboardScreen} />
      <Stack.Screen name="BarHub" component={BarHubScreen} />
      <Stack.Screen name="BeverageHub" component={BeverageHubScreen} />
      <Stack.Screen name="B2BWaterSupplies" component={B2BWaterSuppliesScreen} />
      <Stack.Screen name="ModuleCatalog" component={ModuleCatalogScreen} />
      <Stack.Screen name="GrowWithSuperApp" component={GrowWithSuperAppScreen} />
      <Stack.Screen name="SubmitBusinessRequest" component={SubmitBusinessRequestScreen} />
      <Stack.Screen name="MyBusinessRequests" component={MyBusinessRequestsScreen} />
      <Stack.Screen name="AdminBusinessRequests" component={AdminBusinessRequestsScreen} />
    </Stack.Navigator>
  );
};

export const RootNavigator = React.memo(RootNavigatorComponent);
export default RootNavigator;
