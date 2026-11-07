import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppRadius, AppSpacing } from '../../theme/spacing';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { apiClient } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { RestaurantSummary } from '../../models/food';
import { RootStackParamList } from '../../navigation/types';

export const BeverageHubScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useAppTheme();
  const { language } = useLanguageStore();
  const [cafes, setCafes] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCafes = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const response: any = await apiClient.get(ApiEndpoints.food.restaurants, {
        params: { businessType: 'CAFE', page: 1, pageSize: 30 },
      });
      const payload = response?.data ?? response;
      const items = payload?.items ?? payload?.data?.items ?? [];
      if (!Array.isArray(items)) throw new Error('Cafe catalogue response was invalid');
      setCafes(items);
    } catch (e: any) {
      setError(e?.message || 'Could not load cafes. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadCafes(); }, [loadCafes]));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { borderBottomColor: theme.cardBorder, backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{language === 'hi' ? 'कैफ़े और पेय' : 'Cafes & Beverages'}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{language === 'hi' ? 'सत्यापित कैफ़े और उपलब्ध मेनू' : 'Local cafes and their current menus'}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCafes(true)} />}>
        {loading ? <ActivityIndicator style={styles.state} color={theme.primary} /> : null}
        {!loading && error ? (
          <View style={styles.state}>
            <Text style={[styles.message, { color: theme.textSecondary }]}>{error}</Text>
            <TouchableOpacity onPress={() => loadCafes()} style={[styles.retry, { backgroundColor: theme.primary }]}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
          </View>
        ) : null}
        {!loading && !error && cafes.length === 0 ? (
          <View style={styles.state}><Ionicons name="cafe-outline" size={34} color={theme.textTertiary} /><Text style={[styles.message, { color: theme.textSecondary }]}>{language === 'hi' ? 'अभी कोई स्वीकृत कैफ़े उपलब्ध नहीं है।' : 'No approved cafes are available yet.'}</Text></View>
        ) : null}
        {cafes.map((cafe) => (
          <TouchableOpacity
            key={cafe.id}
            accessibilityRole="button"
            onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: String(cafe.id) })}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          >
            {cafe.imageUrl ? <Image source={{ uri: cafe.imageUrl }} style={styles.image} resizeMode="cover" /> : <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: theme.chipBg }]}><Ionicons name="cafe" size={32} color={theme.textTertiary} /></View>}
            <View style={styles.cardBody}>
              <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>{cafe.name}</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>{cafe.description || cafe.addressLine || cafe.city || 'Cafe menu and ordering information'}</Text>
              <View style={styles.meta}><Ionicons name="star" size={13} color="#D19326" /><Text style={[styles.rating, { color: theme.textPrimary }]}>{cafe.rating.toFixed(1)}</Text><Text style={[styles.open, { color: theme.textTertiary }]}>{cafe.city || ''}</Text><Ionicons name="chevron-forward" size={18} color={theme.textTertiary} /></View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: AppSpacing.lg, paddingVertical: AppSpacing.md, borderBottomWidth: 1 },
  back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: AppSpacing.md },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 3 },
  content: { padding: AppSpacing.lg, paddingBottom: AppSpacing.huge },
  state: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12 },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retry: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: AppRadius.md },
  retryText: { color: '#FFF', fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: AppRadius.lg, marginBottom: AppSpacing.md, overflow: 'hidden' },
  image: { width: '100%', height: 170 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: AppSpacing.md },
  name: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 13, marginTop: 5, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  rating: { fontSize: 12, fontWeight: '700' },
  open: { flex: 1, fontSize: 12, marginLeft: 6 },
});
