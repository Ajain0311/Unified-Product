import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/themeStore';
import { apiClient } from '../../services/apiClient';

export const SubmitBusinessRequestScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'SubmitBusinessRequest'>>();

  const defaultType = route.params?.defaultType || 'NEW_PRODUCT';
  const [requestType, setRequestType] = useState<string>(defaultType);
  const [title, setTitle] = useState(route.params?.defaultTitle || '');
  const [category, setCategory] = useState(route.params?.defaultCategory || '');
  const [businessName, setBusinessName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [location, setLocation] = useState('');
  const [estimatedVolume, setEstimatedVolume] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requestTypes = [
    { key: 'NEW_PRODUCT', label: 'New Product' },
    { key: 'NEW_CATEGORY', label: 'New Category' },
    { key: 'NEW_MODULE', label: 'New Module' },
    { key: 'NEW_SERVICE', label: 'New Service' },
    { key: 'PARTNERSHIP', label: 'Partnership' },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title or item name for your request.');
      return;
    }
    if (!businessName.trim()) {
      Alert.alert('Required Field', 'Please enter your business or firm name.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please provide a brief description of the product or service.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post<any>('/grow/requests', {
        requestType,
        title: title.trim(),
        category: category.trim() || undefined,
        businessName: businessName.trim(),
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        location: location.trim() || undefined,
        estimatedVolume: estimatedVolume.trim() || undefined,
        description: description.trim(),
        attachmentUrls: attachmentUrls.trim() || undefined,
      });

      if (res.success) {
        Alert.alert(
          'Request Submitted!',
          'Your proposal has been submitted to the SuperApp Business Operations team. You can track status and feedback anytime under "My Requests".',
          [
            {
              text: 'Track Status',
              onPress: () => {
                navigation.replace('MyBusinessRequests');
              },
            },
          ]
        );
      } else {
        Alert.alert('Submission Notice', res.message || 'Could not submit request. Please retry.');
      }
    } catch (err: any) {
      Alert.alert('Submission Error', err?.message || 'Network error while submitting request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Submit Proposal</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textTertiary }]}>
              Grow with SuperApp Request Desk
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Request Type Selector */}
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Request Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeRow}
          >
            {requestTypes.map(t => {
              const isSelected = requestType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setRequestType(t.key)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: isSelected ? theme.accent : theme.surface,
                      borderColor: isSelected ? theme.accent : theme.cardBorder,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Form Fields */}
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
            Product / Item / Proposal Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary },
            ]}
            placeholder="e.g. 20L Purified Water Jars, Organic Cold Drinks"
            placeholderTextColor={theme.textTertiary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
            Category (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary },
            ]}
            placeholder="e.g. Beverages, Packaged Foods, Home Care"
            placeholderTextColor={theme.textTertiary}
            value={category}
            onChangeText={setCategory}
          />

          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
            Business / Shop / Brand Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary },
            ]}
            placeholder="e.g. Chittor Mineral Springs & Supplies"
            placeholderTextColor={theme.textTertiary}
            value={businessName}
            onChangeText={setBusinessName}
          />

          <View style={styles.twoColumnRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Contact Phone</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary },
                ]}
                placeholder="10-digit mobile"
                placeholderTextColor={theme.textTertiary}
                keyboardType="phone-pad"
                value={contactPhone}
                onChangeText={setContactPhone}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Location / Area</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary },
                ]}
                placeholder="e.g. Sector 4, Chittorgarh"
                placeholderTextColor={theme.textTertiary}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
            Estimated Daily Supply / Capacity (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary },
            ]}
            placeholder="e.g. 200 bottles/day, 50 orders/day"
            placeholderTextColor={theme.textTertiary}
            value={estimatedVolume}
            onChangeText={setEstimatedVolume}
          />

          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
            Proposal & Product Specifications *
          </Text>
          <TextInput
            style={[
              styles.inputArea,
              { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary },
            ]}
            placeholder="Describe product dimensions, pricing proposal, packaging type, hygiene standards, or business capabilities..."
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
            Sample Photo / Catalog URL (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary },
            ]}
            placeholder="https://example.com/product-catalog.pdf"
            placeholderTextColor={theme.textTertiary}
            value={attachmentUrls}
            onChangeText={setAttachmentUrls}
          />

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitButton, { backgroundColor: theme.accent }]}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit to Operations Desk</Text>
                <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
