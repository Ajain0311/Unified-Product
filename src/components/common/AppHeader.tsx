import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '../../store/authStore';
import { AppSpacing, AppRadius, AppShadows } from '../../theme/spacing';

interface AppHeaderProps {
  deliverTo: string;
  onPressLocation: () => void;
  onPressNotifications: () => void;
  onPressProfile: () => void;
  unreadCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  deliverTo,
  onPressLocation,
  onPressNotifications,
  onPressProfile,
  unreadCount = 0,
}) => {
  const { theme, isDark, toggleTheme } = useAppTheme();
  const { language, toggleLanguage } = useLanguageStore();
  const user = useAuthStore((state) => state.user);

  const getInitials = () => {
    if (!user || !user.fullName) return 'U';
    const parts = user.fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.fullName.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Location Selector */}
      <TouchableOpacity
        style={[
          styles.locationCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          },
          AppShadows.subtle,
        ]}
        onPress={onPressLocation}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FF5A1F', '#FF8A5C']}
          style={styles.locationIconBox}
        >
          <Ionicons name="location-sharp" size={16} color="#FFFFFF" />
        </LinearGradient>

        <View style={styles.locationTextWrap}>
          <View style={styles.captionRow}>
            <Text style={[styles.caption, { color: theme.primary }]}>
              {language === 'hi' ? 'डिलीवरी पता' : 'DELIVER TO'}
            </Text>
            <View style={styles.pulseDot} />
          </View>
          <View style={styles.addressRow}>
            <Text
              style={[styles.addressText, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {deliverTo}
            </Text>
            <Ionicons name="chevron-down" size={13} color={theme.textTertiary} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Quick Actions */}
      <View style={styles.actionsRow}>
        {/* Language Switch */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
            AppShadows.subtle,
          ]}
          onPress={toggleLanguage}
          activeOpacity={0.8}
        >
          <Text style={[styles.langText, { color: theme.primary }]}>
            {language === 'hi' ? 'EN' : 'हि'}
          </Text>
        </TouchableOpacity>

        {/* Theme Toggle */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
            AppShadows.subtle,
          ]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={18}
            color={isDark ? '#F59E0B' : '#475569'}
          />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
            AppShadows.subtle,
          ]}
          onPress={onPressNotifications}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={19} color={theme.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Profile Avatar */}
        <TouchableOpacity
          style={[styles.avatarButton, AppShadows.subtle]}
          onPress={onPressProfile}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppSpacing.md,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: AppSpacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
  },
  locationIconBox: {
    width: 32,
    height: 32,
    borderRadius: AppRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  locationTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caption: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginLeft: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
    maxWidth: '85%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  langText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
