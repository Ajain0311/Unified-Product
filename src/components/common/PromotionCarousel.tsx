import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/themeStore';
import { AppSpacing, AppRadius, AppShadows } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 164;

export interface BannerItem {
  id: string | number;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  badge?: string;
  gradient?: [string, string];
  [key: string]: any;
}

interface PromotionCarouselProps {
  banners: BannerItem[];
  onPressBanner: (banner: BannerItem) => void;
  resolveImageUrl?: (url: string) => string;
}

export const PromotionCarousel: React.FC<PromotionCarouselProps> = ({
  banners,
  onPressBanner,
  resolveImageUrl = (url) => url,
}) => {
  const { theme, isDark } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!banners || banners.length === 0) return null;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + AppSpacing.md));
    if (slide !== activeIndex && slide >= 0 && slide < banners.length) {
      setActiveIndex(slide);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + AppSpacing.md}
        snapToAlignment="center"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {banners.map((item) => {
          const imgUri = item.imageUrl ? resolveImageUrl(item.imageUrl) : null;

          return (
            <TouchableOpacity
              key={String(item.id)}
              activeOpacity={0.92}
              onPress={() => onPressBanner(item)}
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                AppShadows.md,
              ]}
            >
              {imgUri ? (
                <Image
                  source={{ uri: imgUri }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={item.gradient || ['#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.placeholder}
                >
                  <Ionicons name="sparkles" size={36} color="#FFFFFF" />
                </LinearGradient>
              )}

              {/* Gradient Scrim */}
              <LinearGradient
                colors={['transparent', 'rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.92)']}
                locations={[0, 0.45, 1]}
                style={styles.scrim}
              >
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}

                <View style={styles.contentWrap}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}

                  {item.ctaText ? (
                    <View style={styles.ctaButton}>
                      <Text style={styles.ctaText}>{item.ctaText}</Text>
                      <Ionicons name="arrow-forward" size={11} color="#FFFFFF" style={{ marginLeft: 3 }} />
                    </View>
                  ) : null}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === activeIndex ? theme.primary : theme.border,
                  width: idx === activeIndex ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: AppSpacing.lg,
  },
  scrollList: {
    gap: AppSpacing.md,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: AppRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    padding: AppSpacing.md,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: AppRadius.round,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  contentWrap: {
    justifyContent: 'flex-end',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18.5,
    fontWeight: '800',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12.5,
    marginTop: 3,
    fontWeight: '500',
    letterSpacing: -0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FF5A1F',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: AppRadius.round,
    marginTop: 8,
    shadowColor: '#FF5A1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: AppSpacing.md,
    gap: 6,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
});
