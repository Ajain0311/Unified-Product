import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/themeStore';
import { apiClient } from '../../services/apiClient';

interface AdminBusinessRequest {
  id: number;
  userId: number;
  requesterName: string;
  requesterMobile: string;
  requestType: string;
  title: string;
  category?: string;
  description: string;
  businessName: string;
  contactPhone: string;
  contactEmail?: string;
  location?: string;
  estimatedVolume?: string;
  attachmentUrls?: string;
  status: string;
  adminNotes?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  createdAt: string;
}

export const AdminBusinessRequestsScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation();

  const [requests, setRequests] = useState<AdminBusinessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Status Update Modal State
  const [selectedRequest, setSelectedRequest] = useState<AdminBusinessRequest | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (search) params.append('search', search);

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get<any>(`/grow/admin/requests${query}`);
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
  }, [statusFilter, typeFilter]);

  const handleOpenReview = (item: AdminBusinessRequest) => {
    setSelectedRequest(item);
    setNewStatus(item.status);
    setAdminNotes(item.adminNotes || '');
  };

  const handleSaveStatus = async () => {
    if (!selectedRequest) return;
    try {
      setUpdating(true);
      const res = await apiClient.put<any>(`/grow/admin/requests/${selectedRequest.id}/status`, {
        status: newStatus,
        adminNotes: adminNotes.trim() || undefined,
      });

      if (res.success) {
        Alert.alert('Status Updated', `Request #${selectedRequest.id} marked as ${newStatus}`);
        setSelectedRequest(null);
        fetchRequests();
      } else {
        Alert.alert('Update Failed', res.message || 'Could not update request status.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Network error updating request.');
    } finally {
      setUpdating(false);
    }
  };

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

  const statuses = [
    { key: '', label: 'All Status' },
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  const types = [
    { key: '', label: 'All Types' },
    { key: 'NEW_PRODUCT', label: 'Products' },
    { key: 'NEW_CATEGORY', label: 'Categories' },
    { key: 'NEW_MODULE', label: 'Modules' },
    { key: 'PARTNERSHIP', label: 'Partnership' },
  ];

  const renderItem = ({ item }: { item: AdminBusinessRequest }) => {
    const badge = getStatusBadge(item.status);
    const dateFormatted = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.typeBadge, { color: theme.accent }]}>
              {item.requestType.replace('_', ' ')}
            </Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{item.title}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <Text style={[styles.businessText, { color: theme.textSecondary }]}>
          {item.businessName} • Requester: {item.requesterName} ({item.contactPhone})
        </Text>

        {item.location ? (
          <Text style={[styles.metaText, { color: theme.textTertiary }]}>
            Location: {item.location} {item.estimatedVolume ? `• Vol: ${item.estimatedVolume}` : ''}
          </Text>
        ) : null}

        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={3}>
          {item.description}
        </Text>

        {item.adminNotes ? (
          <View style={[styles.notesBox, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Text style={[styles.notesLabel, { color: theme.textTertiary }]}>Review Note:</Text>
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>{item.adminNotes}</Text>
          </View>
        ) : null}

        <View style={[styles.cardFooter, { borderTopColor: theme.cardBorder }]}>
          <Text style={[styles.dateText, { color: theme.textTertiary }]}>
            Submitted: {dateFormatted}
          </Text>
          <TouchableOpacity
            onPress={() => handleOpenReview(item)}
            style={[styles.reviewBtn, { backgroundColor: theme.accent }]}
            activeOpacity={0.8}
          >
            <Text style={styles.reviewBtnText}>Update Status</Text>
            <Ionicons name="create-outline" size={14} color="#FFFFFF" />
          </TouchableOpacity>
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
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Business Request Desk</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textTertiary }]}>
            Admin Review & Catalogue Integration
          </Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {statuses.map(s => {
            const isSelected = statusFilter === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => setStatusFilter(s.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.accent : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.cardBorder,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading incoming requests...</Text>
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
            <View style={styles.centerWrap}>
              <Ionicons name="file-tray-outline" size={40} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No requests matching filter</Text>
            </View>
          }
        />
      )}

      {/* Status Update Modal */}
      <Modal
        visible={!!selectedRequest}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRequest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Review Request #{selectedRequest?.id}
              </Text>
              <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                <Ionicons name="close" size={22} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
              {selectedRequest?.title} ({selectedRequest?.businessName})
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Change Status</Text>
            <View style={styles.statusSelectRow}>
              {['UNDER_REVIEW', 'APPROVED', 'INFO_REQUIRED', 'REJECTED', 'COMPLETED'].map(st => {
                const isSelected = newStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setNewStatus(st)}
                    style={[
                      styles.statusSelectChip,
                      {
                        backgroundColor: isSelected ? theme.accent : theme.surface,
                        borderColor: isSelected ? theme.accent : theme.cardBorder,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.statusSelectText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
                      {st.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Admin Feedback Notes</Text>
            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: theme.surface, borderColor: theme.cardBorder, color: theme.textPrimary },
              ]}
              placeholder="Enter instructions, requirements, or reason for approval/rejection..."
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={3}
              value={adminNotes}
              onChangeText={setAdminNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setSelectedRequest(null)}
                style={[styles.cancelBtn, { borderColor: theme.cardBorder }]}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveStatus}
                disabled={updating}
                style={[styles.saveBtn, { backgroundColor: theme.accent }]}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Status</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  filterWrap: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyText: {
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
    marginBottom: 4,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  businessText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 11,
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  notesBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 11,
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
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusSelectText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
