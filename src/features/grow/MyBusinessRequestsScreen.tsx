import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/themeStore';
import { apiClient } from '../../services/apiClient';

interface BusinessRequestItem {
  id: number;
  requestType: string;
  title: string;
  category?: string;
  description: string;
  businessName: string;
  contactPhone: string;
  status: string;
  adminNotes?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  createdAt: string;
}

export const MyBusinessRequestsScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [requests, setRequests] = useState<BusinessRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get<any>('/grow/my-requests');
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'COMPLETED') {
      return { bg: '#DEF7EC', text: '#03543F', label: s === 'COMPLETED' ? 'Live in Catalogue' : 'Approved' };
    }
    if (s === 'UNDER_REVIEW') {
      return { bg: '#FEF3C7', text: '#92400E', label: 'Under Review' };
    }
    if (s === 'INFO_REQUIRED') {
      return { bg: '#FFEDD5', text: '#C2410C', label: 'Info Required' };
    }
    if (s === 'REJECTED') {
      return { bg: '#FDE8E8', text: '#9B1C1C', label: 'Declined' };
    }
    return { bg: '#E1EFFE', text: '#1E429F', label: 'Submitted' };
  };

  const renderItem = ({ item }: { item: BusinessRequestItem }) => {
    const badge = getStatusBadge(item.status);
    const dateFormatted = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.requestTypeBadge, { color: theme.accent }]}>
              {item.requestType.replace('_', ' ')}
            </Text>
            <Text style={[styles.requestTitle, { color: theme.textPrimary }]}>{item.title}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <Text style={[styles.businessText, { color: theme.textSecondary }]}>
          Business: {item.businessName} {item.category ? `• ${item.category}` : ''}
        </Text>

        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={3}>
          {item.description}
        </Text>

        {item.adminNotes ? (
          <View style={[styles.feedbackBox, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.accent} />
              <Text style={[styles.feedbackTitle, { color: theme.textPrimary }]}>
                Operations Desk Feedback
              </Text>
            </View>
            <Text style={[styles.feedbackText, { color: theme.textSecondary }]}>{item.adminNotes}</Text>
          </View>
        ) : null}

        <View style={[styles.cardFooter, { borderTopColor: theme.cardBorder }]}>
          <Text style={[styles.dateText, { color: theme.textTertiary }]}>
            Submitted on {dateFormatted}
          </Text>
          <Text style={[styles.phoneText, { color: theme.textTertiary }]}>
            {item.contactPhone}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Business Proposals</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textTertiary }]}>
            Onboarding & Product Requests
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('SubmitBusinessRequest', { defaultType: 'NEW_PRODUCT' })}
          style={[styles.newBtn, { backgroundColor: theme.accent }]}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading proposals...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchRequests();
              }}
              tintColor={theme.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIconWrap, { backgroundColor: theme.surface }]}>
                <Ionicons name="document-text-outline" size={32} color={theme.textTertiary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No Business Requests Submitted Yet
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Want to sell water supplies, beverages, register a restaurant, or propose a new product? Submit a proposal to start growing with SuperApp.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SubmitBusinessRequest', { defaultType: 'NEW_PRODUCT' })}
                style={[styles.emptyCta, { backgroundColor: theme.accent }]}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyCtaText}>Submit First Proposal</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  newBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  requestTypeBadge: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  businessText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  feedbackBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  feedbackTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  feedbackText: {
    fontSize: 12,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: 11,
  },
  phoneText: {
    fontSize: 11,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyCta: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
