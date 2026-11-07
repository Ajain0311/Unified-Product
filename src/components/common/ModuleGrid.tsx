import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BUSINESS_MODULES, BusinessModuleConfig } from '../../config/businessModules';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { AppSpacing, AppRadius, AppShadows } from '../../theme/spacing';

interface ModuleGridProps {
  modules?: BusinessModuleConfig[];
  onSelectModule: (route: string) => void;
  variant?: 'cards' | 'compact' | 'featured';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ModuleGrid: React.FC<ModuleGridProps> = ({
  modules = BUSINESS_MODULES,
  onSelectModule,
  variant = 'cards',
}) => {
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();

  const activeModules = modules.filter((m) => m.isReady !== false);

  if (variant === 'compact') {
    return (
      <View style={styles.compactRow}>
        {activeModules.map((mod) => (
          <TouchableOpacity
            key={mod.id}
            activeOpacity={0.8}
            onPress={() => onSelectModule(mod.route)}
            style={styles.compactItem}
          >
            <LinearGradient
              colors={mod.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.compactIconBox}
            >
              <Ionicons name={mod.icon as any} size={22} color="#FFFFFF" />
            </LinearGradient>
            <Text
              style={[styles.compactLabel, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {language === 'hi' ? mod.nameHi : mod.nameEn}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Premium 2-column balanced card grid
  return (
    <View style={styles.gridContainer}>
      {activeModules.map((mod) => {
        const title = language === 'hi' ? mod.nameHi : mod.nameEn;
        const desc = language === 'hi' ? mod.descriptionHi : mod.descriptionEn;
        const badge = language === 'hi' ? mod.badgeHi : mod.badgeEn;

        return (
          <TouchableOpacity
            key={mod.id}
            activeOpacity={0.88}
            onPress={() => onSelectModule(mod.route)}
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
              AppShadows.subtle,
            ]}
          >
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={mod.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name={mod.icon as any} size={22} color="#FFFFFF" />
              </LinearGradient>

              {badge ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isDark ? `${mod.gradient[0]}25` : `${mod.gradient[0]}15`,
                    },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: mod.gradient[0] }]}>
                    {badge}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              style={[styles.cardTitle, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {title}
            </Text>

            <Text
              style={[styles.cardDesc, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {desc}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.exploreText, { color: mod.gradient[0] }]}>
                {language === 'hi' ? 'खोजें' : 'Explore'}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={12}
                color={mod.gradient[0]}
                style={{ marginLeft: 3 }}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: AppSpacing.md,
  },
  card: {
    width: '48.5%',
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    padding: AppSpacing.md,
    justifyContent: 'space-between',
    minHeight: 142,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppSpacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: AppRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: AppRadius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: AppSpacing.sm,
    paddingTop: AppSpacing.xs,
  },
  exploreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  compactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: AppSpacing.md,
  },
  compactItem: {
    width: (SCREEN_WIDTH - 32 - AppSpacing.md * 3) / 4,
    alignItems: 'center',
  },
  compactIconBox: {
    width: 52,
    height: 52,
    borderRadius: AppRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  compactLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
