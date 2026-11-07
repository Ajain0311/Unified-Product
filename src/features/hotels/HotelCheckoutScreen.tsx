import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/themeStore';

export const HotelCheckoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.surfaceHover }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Reservation</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={44} color={theme.primary} />
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Online hotel booking is not available yet
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            No payment has been taken. Please contact the hotel directly to reserve a room.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.actionText}>Back to hotel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { flex: 1, padding: 16, justifyContent: 'center' },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', marginTop: 14, textAlign: 'center' },
  body: { fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  actionBtn: {
    marginTop: 20,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
