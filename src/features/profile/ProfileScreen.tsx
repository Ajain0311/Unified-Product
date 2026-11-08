import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Switch,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useRoleStore, ROLE_CONFIGS } from '../../store/roleStore';
import { RoleSwitchModal } from '../../components/RoleSwitchModal';
import { apiClient } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { FormKeyboardAvoid } from '../../components/common/FormKeyboardAvoid';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';

interface MenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  badgeLabel?: string | null;
  badgeColor?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  color,
  onPress,
  badgeLabel,
  badgeColor,
}) => {
  const { theme } = useAppTheme();
  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIconContainer, { backgroundColor: `${color}18` }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.menuContent}>
        <View style={styles.menuTitleRow}>
          <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>{title}</Text>
          {badgeLabel ? (
            <View style={[styles.roleBadge, { backgroundColor: `${badgeColor || color}25` }]}>
              <Text style={[styles.roleBadgeText, { color: badgeColor || color }]}>{badgeLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={theme.textTertiary} />
    </TouchableOpacity>
  );
};

function latestStatusForRole(
  apps: Array<{ requestedRole?: string; status?: string; createdAt?: string }>,
  role: string
): string | null {
  const forRole = apps
    .filter((a) => String(a.requestedRole || '').toUpperCase() === role)
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  return forRole[0]?.status ? String(forRole[0].status).toUpperCase() : null;
}

function roleAppBadge(status: string | null): { label: string; color: string; subtitle: string } | null {
  if (!status) return null;
  if (status === 'PENDING') {
    return {
      label: 'Pending',
      color: '#F59E0B',
      subtitle: 'Application under admin review — tap to view status',
    };
  }
  if (status === 'APPROVED') {
    return {
      label: 'Approved',
      color: '#10B981',
      subtitle: 'Approved — tap to add another vehicle or outlet',
    };
  }
  if (status === 'REJECTED') {
    return {
      label: 'Rejected',
      color: '#EF4444',
      subtitle: 'Rejected — tap to see reason and apply again',
    };
  }
  if (status === 'CANCELLED') {
    return {
      label: 'Cancelled',
      color: '#94A3B8',
      subtitle: 'Cancelled — tap to submit again',
    };
  }
  return { label: status, color: colors.textSecondary, subtitle: `Status: ${status}` };
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const { language, toggleLanguage } = useLanguageStore();
  const { user, logout, updateUser } = useAuthStore();
  const { activeRole, hasMultipleRoles } = useRoleStore();
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [driverAppStatus, setDriverAppStatus] = useState<string | null>(null);
  const [hotelAppStatus, setHotelAppStatus] = useState<string | null>(null);
  const activeConfig = ROLE_CONFIGS[activeRole] || ROLE_CONFIGS.CUSTOMER;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await apiClient.get<any>(ApiEndpoints.roleApplications.mine);
          const data = res?.data?.data ?? res?.data;
          const list = Array.isArray(data) ? data : [];
          if (cancelled) return;
          setDriverAppStatus(latestStatusForRole(list, 'DRIVER'));
          setHotelAppStatus(latestStatusForRole(list, 'RESTAURANT_OWNER'));
        } catch {
          if (!cancelled) {
            setDriverAppStatus(null);
            setHotelAppStatus(null);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const driverBadge = roleAppBadge(driverAppStatus);
  const hotelBadge = roleAppBadge(hotelAppStatus);

  const openEditName = () => {
    setEditName(String(user?.fullName || '').trim());
    setEditVisible(true);
  };

  const handleSaveName = async () => {
    const next = editName.trim().replace(/\s+/g, ' ');
    if (!next) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    if (next.length < 2) {
      Alert.alert('Too Short', 'Name must be at least 2 characters.');
      return;
    }
    if (next.length > 100) {
      Alert.alert('Too Long', 'Name must be 100 characters or fewer.');
      return;
    }
    if (next === String(user?.fullName || '').trim()) {
      setEditVisible(false);
      return;
    }

    setSavingName(true);
    try {
      const res = await apiClient.put<any>(ApiEndpoints.auth.profile, { fullName: next });
      const data = res?.data?.data || res?.data || {};
      const savedName = String(data.fullName || data.FullName || next).trim();
      updateUser({ fullName: savedName });
      setEditVisible(false);
      Alert.alert('Updated', 'Your name has been saved.');
    } catch (e: any) {
      Alert.alert('Update Failed', e?.message || 'Could not update your name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const performLogout = async () => {
    try {
      await logout();
    } finally {
      navigation.reset({
        index: 0,
        routes: [{ name: 'PhoneEntry' }],
      });
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          void performLogout();
        },
      },
    ]);
  };

  const requireAuth = (action: () => void) => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in with your phone number to access this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('PhoneEntry') },
        ]
      );
      return;
    }
    action();
  };

  const name = user?.fullName || 'Guest Explorer';
  const phone = user?.mobileNumber ? `+91 ${user.mobileNumber}` : 'Exploring Mandphiya';
  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'GE';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="chevron-left" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Account</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card / Guest Card */}
        {user ? (
          <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}>
            <View style={[styles.avatarGradient, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>

            <View style={styles.profileMeta}>
              <Text style={[styles.profileName, { color: theme.textPrimary }]}>{name}</Text>
              <Text style={[styles.profilePhone, { color: theme.textSecondary }]}>{phone}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>Verified Member</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={openEditName}
              accessibilityRole="button"
              accessibilityLabel="Edit name"
            >
              <MaterialIcons name="edit" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.guestCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}>
            <View style={styles.guestCardHeader}>
              <View style={[styles.avatarGradient, { backgroundColor: theme.primary }]}>
                <Ionicons name="person-outline" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.profileMeta}>
                <Text style={[styles.profileName, { color: theme.textPrimary }]}>Guest Explorer</Text>
                <Text style={[styles.profilePhone, { color: theme.textSecondary }]}>Exploring Mandphiya & Chittorgarh</Text>
                <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <Text style={[styles.verifiedBadgeText, { color: '#2563EB' }]}>Guest Mode</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.guestPerksTitle, { color: theme.textPrimary }]}>Unlock Member Privileges</Text>
            <View style={styles.guestPerksList}>
              <View style={styles.guestPerkRow}>
                <Ionicons name="fast-food-outline" size={15} color={theme.primary} />
                <Text style={[styles.guestPerkText, { color: theme.textSecondary }]}>Order food from top Mandphiya restaurants</Text>
              </View>
              <View style={styles.guestPerkRow}>
                <Ionicons name="car-outline" size={15} color="#2563EB" />
                <Text style={[styles.guestPerkText, { color: theme.textSecondary }]}>Book quick bike, auto & cab rides</Text>
              </View>
              <View style={styles.guestPerkRow}>
                <Ionicons name="location-outline" size={15} color="#059669" />
                <Text style={[styles.guestPerkText, { color: theme.textSecondary }]}>Save your delivery addresses & order history</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('PhoneEntry')}
              activeOpacity={0.88}
            >
              <Text style={styles.signInButtonText}>Sign In / Register with Phone</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Multi-Role Switcher Card */}
        {hasMultipleRoles && (
          <TouchableOpacity
            style={[styles.roleSwitchCard, { backgroundColor: theme.card, borderColor: `${activeConfig.color}60` }, AppShadows.subtle]}
            activeOpacity={0.8}
            onPress={() => setRoleModalVisible(true)}
          >
            <View style={[styles.roleIconBox, { backgroundColor: `${activeConfig.color}25` }]}>
              <Ionicons name={activeConfig.icon as any} size={24} color={activeConfig.color} />
            </View>
            <View style={styles.roleTextCol}>
              <View style={styles.roleHeaderRow}>
                <Text style={styles.roleLabel}>CURRENT APP MODE</Text>
                <View style={[styles.switchBadge, { backgroundColor: activeConfig.color }]}>
                  <Text style={styles.switchBadgeText}>SWITCH</Text>
                </View>
              </View>
              <Text style={[styles.roleTitle, { color: activeConfig.color }]}>{activeConfig.badge}</Text>
              <Text style={[styles.roleSubtitle, { color: theme.textSecondary }]}>{activeConfig.tagline}</Text>
            </View>
            <MaterialIcons name="swap-horiz" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Section 1: Activity & Orders */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          {language === 'hi' ? 'गतिविधि और ऑर्डर' : 'Activity & Orders'}
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}>
          <MenuItem
            icon="fastfood"
            title={language === 'hi' ? 'फूड ऑर्डर्स' : 'Food Orders'}
            subtitle={language === 'hi' ? 'पुराने ऑर्डर्स और ट्रैकिंग' : 'Past deliveries & tracking'}
            color={colors.secondary}
            onPress={() => requireAuth(() => navigation.navigate('Activity', { initialTab: 0 }))}
          />
          <View style={styles.itemDivider} />
          <MenuItem
            icon="directions-bike"
            title={language === 'hi' ? 'मेरी राइड्स' : 'My Rides'}
            subtitle={language === 'hi' ? 'यात्रा रसीद और इतिहास' : 'Trip receipts & ride history'}
            color={colors.blue}
            onPress={() => requireAuth(() => navigation.navigate('Activity', { initialTab: 1 }))}
          />
          <View style={styles.itemDivider} />
          <MenuItem
            icon="store"
            title={language === 'hi' ? 'मार्केटप्लेस विज्ञापन' : 'Marketplace Listings'}
            subtitle={language === 'hi' ? 'आपके सक्रिय और बिके हुए सामान' : 'Your active and sold items'}
            color={colors.primary}
            onPress={() => requireAuth(() => navigation.navigate('Activity', { initialTab: 2 }))}
          />
          <View style={styles.itemDivider} />
          <MenuItem
            icon="account-balance-wallet"
            title={language === 'hi' ? 'बाज़ार विक्रेता भुगतान' : 'Bazaar Seller Settlements'}
            subtitle={language === 'hi' ? 'बिके हुए सामान का शुल्क और बकाया' : 'View sold listings fee and dues'}
            color="#059669"
            onPress={() => requireAuth(() => navigation.navigate('SellerSettlements'))}
          />
        </View>

        {/* Grow with SuperApp — role requests */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          {language === 'hi' ? 'सुपरऐप के साथ बिज़नेस बढ़ाएं' : 'Grow with SuperApp'}
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}>
          <MenuItem
            icon="two-wheeler"
            title={language === 'hi' ? 'राइडर / कैप्टन बनें' : 'Become a Rider / Captain'}
            subtitle={
              driverBadge?.subtitle ||
              (language === 'hi' ? 'बाइक, ऑटो या कार — एडमिन द्वारा सत्यापन' : 'Bike, Auto, or Car/Taxi — admin approves each vehicle')
            }
            color={colors.blue}
            badgeLabel={driverBadge?.label}
            badgeColor={driverBadge?.color}
            onPress={() => requireAuth(() => navigation.navigate('RoleApplication', { role: 'DRIVER' }))}
          />
          <View style={[styles.itemDivider, { backgroundColor: theme.borderSubtle }]} />
          <MenuItem
            icon="restaurant"
            title={language === 'hi' ? 'होटल / कैफे रजिस्टर करें' : 'Open a Hotel / Cafe'}
            subtitle={
              hotelBadge?.subtitle ||
              (language === 'hi' ? 'होटल, रेस्टोरेंट या कैफे पार्टनर बनें' : 'Hotel, restaurant, or cafe — admin approves each outlet')
            }
            color={colors.secondary}
            badgeLabel={hotelBadge?.label}
            badgeColor={hotelBadge?.color}
            onPress={() => requireAuth(() => navigation.navigate('RoleApplication', { role: 'RESTAURANT_OWNER' }))}
          />
          <View style={[styles.itemDivider, { backgroundColor: theme.borderSubtle }]} />
          <MenuItem
            icon="storefront"
            title={language === 'hi' ? 'बाज़ार में बेचें' : 'Sell on Bazaar'}
            subtitle={language === 'hi' ? 'कोई भी नागरिक सामान बेच सकता है' : 'Anyone can sell — no admin approval needed'}
            color={colors.primary}
            onPress={() =>
              Alert.alert(
                'Marketplace',
                'Any citizen can sell on Bazaar. Open the Bazaar tab and tap Post Ad / Add Listing. Seller role is granted automatically when you publish.',
                [
                  { text: 'OK', style: 'cancel' },
                  {
                    text: 'Go to Bazaar',
                    onPress: () => navigation.navigate('MainTabs', { screen: 'Bazaar' } as any),
                  },
                ]
              )
            }
          />
          <View style={[styles.itemDivider, { backgroundColor: theme.borderSubtle }]} />
          <MenuItem
            icon="rocket-launch"
            title={language === 'hi' ? 'पार्टनर ऑनबोर्डिंग' : 'Grow with SuperApp'}
            subtitle={language === 'hi' ? 'नया प्रोडक्ट, कैटेगरी व पार्टनर रिक्वेस्ट' : 'New product, category, module & partner onboarding'}
            color="#D97706"
            onPress={() => navigation.navigate('GrowWithSuperApp')}
          />
          <View style={[styles.itemDivider, { backgroundColor: theme.borderSubtle }]} />
          <MenuItem
            icon="layers"
            title={language === 'hi' ? 'मॉड्यूल और स्टोरेज' : 'Modules & Storage Manager'}
            subtitle={language === 'hi' ? 'ऑन-डिमांड डिलीवरी, वाई-फाई डाउनलोड व कैश' : 'On-demand delivery, Wi-Fi downloads & cache manager'}
            color="#059669"
            onPress={() => navigation.navigate('ModuleCatalog')}
          />
        </View>

        {/* Section 2: Account Settings */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          {language === 'hi' ? 'अकाउंट सेटिंग्स' : 'Account Settings'}
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}>
          <MenuItem
            icon="location-on"
            title={language === 'hi' ? 'सहेजे गए पते' : 'Saved Addresses'}
            subtitle={language === 'hi' ? 'घर, कार्यालय व अन्य पते' : 'Home, Work, and other addresses'}
            color={colors.yellow}
            onPress={() => requireAuth(() => navigation.navigate('SavedAddresses'))}
          />
          <View style={[styles.itemDivider, { backgroundColor: theme.borderSubtle }]} />
          <MenuItem
            icon="notifications"
            title={language === 'hi' ? 'सूचनाएं' : 'Notifications'}
            subtitle={language === 'hi' ? 'ऑर्डर अपडेट और प्रमोशनल अलर्ट' : 'Order updates & promotional alerts'}
            color={colors.blue}
            onPress={() => requireAuth(() => navigation.navigate('Notifications'))}
          />
          <View style={[styles.itemDivider, { backgroundColor: theme.borderSubtle }]} />
          <MenuItem
            icon="credit-card"
            title={language === 'hi' ? 'भुगतान विधियां' : 'Payment Methods'}
            subtitle={language === 'hi' ? 'कार्ड, यूपीआई और नेटबैंकिंग' : 'Cards, UPI, & Netbanking via Razorpay'}
            color={colors.secondary}
            onPress={() => Alert.alert('Payment Methods', 'UPI, Cards, and Netbanking are available directly at checkout via Razorpay.')}
          />
          <View style={[styles.itemDivider, { backgroundColor: theme.borderSubtle }]} />
          <MenuItem
            icon="headset-mic"
            title={language === 'hi' ? 'सहायता और संपर्क' : 'Help & Support'}
            subtitle={language === 'hi' ? 'सामान्य प्रश्न, कॉल और व्हाट्सएप' : 'FAQ, call, WhatsApp & email'}
            color={colors.purple}
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <View style={[styles.itemDivider, { backgroundColor: theme.borderSubtle }]} />
          <TouchableOpacity style={styles.menuItem} onPress={toggleLanguage} activeOpacity={0.7}>
            <View
              style={[
                styles.menuIconContainer,
                { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
              ]}
            >
              <Ionicons
                name="language"
                size={22}
                color="#10B981"
              />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'भाषा (Language)' : 'Language (भाषा)'}
              </Text>
              <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                {language === 'hi' ? 'वर्तमान: हिन्दी (English में बदलें)' : 'Current: English (Switch to हिन्दी)'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.itemDivider, { backgroundColor: theme.borderSubtle }]} />
          <View style={styles.menuItem}>
            <View
              style={[
                styles.menuIconContainer,
                { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.18)' : 'rgba(99, 102, 241, 0.12)' },
              ]}
            >
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={22}
                color={isDark ? '#FBBF24' : '#6366F1'}
              />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                {language === 'hi' ? 'डार्क मोड' : 'Dark Mode'}
              </Text>
              <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                {language === 'hi'
                  ? (isDark ? 'डार्क थीम सक्रिय' : 'लाइट थीम सक्रिय')
                  : (isDark ? 'Dark theme active' : 'Light theme active')}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Logout or Sign In Button */}
        {user ? (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color={colors.error} />
            <Text style={styles.logoutButtonText}>{language === 'hi' ? 'लॉग आउट' : 'Log Out'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: theme.primary, backgroundColor: `${theme.primary}12` }]}
            onPress={() => navigation.navigate('PhoneEntry')}
          >
            <MaterialIcons name="login" size={20} color={theme.primary} />
            <Text style={[styles.logoutButtonText, { color: theme.primary }]}>
              {language === 'hi' ? 'खाते में साइन इन करें' : 'Sign In to Account'}
            </Text>
          </TouchableOpacity>
        )}

        {/* App Version Info */}
        <Text style={styles.versionText}>Zupify v1.0.4 (Unified Ecosystem)</Text>
      </ScrollView>

      <RoleSwitchModal
        visible={roleModalVisible}
        onClose={() => setRoleModalVisible(false)}
      />

      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !savingName && setEditVisible(false)}
      >
        <FormKeyboardAvoid style={styles.editKeyboardRoot}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.editOverlay}>
              <View style={styles.editSheet}>
                <View style={styles.editHeader}>
                  <Text style={styles.editTitle}>Edit name</Text>
                  <TouchableOpacity
                    onPress={() => !savingName && setEditVisible(false)}
                    disabled={savingName}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="close" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.editHint}>
                  Only your display name can be changed. Phone number stays fixed.
                </Text>
                <Text style={styles.editLabel}>Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={100}
                  autoFocus
                  editable={!savingName}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleSaveName()}
                />
                <Text style={styles.editLabel}>Phone</Text>
                <View style={styles.editPhoneBox}>
                  <Text style={styles.editPhoneText}>{phone}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.editSaveBtn, savingName && { opacity: 0.7 }]}
                  onPress={() => void handleSaveName()}
                  disabled={savingName}
                  activeOpacity={0.85}
                >
                  {savingName ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.editSaveText}>Save name</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </FormKeyboardAvoid>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestPerksTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  guestPerksList: {
    gap: 8,
    marginBottom: 18,
  },
  guestPerkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guestPerkText: {
    fontSize: 12,
    fontWeight: '500',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileMeta: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  profilePhone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
  },
  editBtn: {
    padding: spacing.xs,
  },
  sectionHeader: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 14,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  menuTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  itemDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
    borderRadius: 14,
    height: 50,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(239, 83, 80, 0.25)',
    gap: 8,
  },
  logoutButtonText: {
    ...typography.bodyMedium,
    color: colors.error,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: spacing.lg,
  },
  roleSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1.5,
  },
  roleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  roleTextCol: {
    flex: 1,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  switchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  switchBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  roleSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editKeyboardRoot: {
    flex: 1,
  },
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  editSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: '92%',
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  editTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  editHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  editLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  editPhoneBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.lg,
    opacity: 0.85,
  },
  editPhoneText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  editSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
