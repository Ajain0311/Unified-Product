import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useMarketplaceStore } from '../../store/marketplaceStore';
import { ListingSummary } from '../../models/marketplace';
import { colors } from '../../theme/colors';
import { useAppTheme, ThemePalette } from '../../theme/themeStore';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { apiClient } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { notificationService } from '../../services/notificationService';
import { documentService } from '../../services/documentService';
import { LocationService } from '../../services/locationService';
import { FormKeyboardAvoid } from '../../components/common/FormKeyboardAvoid';
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';
import * as ImagePicker from 'expo-image-picker';

const locationService = new LocationService();

const CATEGORIES = [
  { id: 1, name: 'Mobiles' },
  { id: 2, name: 'Vehicles' },
  { id: 3, name: 'Electronics' },
  { id: 4, name: 'Furniture' },
  { id: 5, name: 'Fashion' },
  { id: 6, name: 'Books' },
  { id: 7, name: 'Sports' },
  { id: 8, name: 'Others' },
];

const CONDITIONS = [
  { id: 'LIKE_NEW', label: 'LIKE NEW' },
  { id: 'NEW', label: 'BRAND NEW' },
  { id: 'USED', label: 'GENTLY USED' },
];

export const AddListingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { addListing } = useMarketplaceStore();
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  // Stepper State (Step 1: Photos -> Step 2: Title & Price -> Step 3: Location & Post)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(1);
  const [selectedCondition, setSelectedCondition] = useState('LIKE_NEW');
  const [categoriesList, setCategoriesList] = useState(CATEGORIES);

  // Processing States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await apiClient.get<any>(ApiEndpoints.marketplace.categories);
        const data = res.data?.data || res.data;
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const list = data.map((c: any) => ({ id: c.id, name: c.name }));
          setCategoriesList(list);
          if (!list.some((c: any) => c.id === selectedCategoryId)) {
            setSelectedCategoryId(list[0].id);
          }
        }
      } catch {
        // Fallback to static CATEGORIES
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePickPhoto = async () => {
    try {
      Alert.alert('Add Photo', 'Choose a source for your photo', [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const camPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (!camPermission.granted) {
                Alert.alert('Permission needed', 'Allow camera access to take photos.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.8,
              });
              if (!result.canceled && result.assets?.[0]?.uri) {
                await uploadPhoto(result.assets[0]);
              }
            } catch (cameraErr: any) {
              console.warn('[AddListing] Camera launch error:', cameraErr?.message);
              Alert.alert('Camera Error', cameraErr?.message || 'Could not launch camera. Try selecting from gallery instead.');
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            try {
              const libPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!libPermission.granted) {
                Alert.alert('Permission needed', 'Allow photo library access to pick photos.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                allowsMultipleSelection: true,
                selectionLimit: 5 - photos.length,
              });
              if (!result.canceled && result.assets?.length) {
                for (const asset of result.assets) {
                  await uploadPhoto(asset);
                }
              }
            } catch (galleryErr: any) {
              console.warn('[AddListing] Gallery launch error:', galleryErr?.message);
              Alert.alert('Gallery Error', galleryErr?.message || 'Could not open photo gallery.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (err: any) {
      Alert.alert('Picker failed', err?.message || 'Could not open image picker');
    }
  };

  const uploadPhoto = async (asset: any) => {
    setIsUploadingPhoto(true);
    try {
      const stored = await documentService.upload(asset.uri, asset.fileName || 'photo.jpg');
      setPhotos((current) => [...current, stored.imageUrl]);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message || 'Could not store the photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, idx) => idx !== index));
  };

  const handleUseGps = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const loc = await locationService.getCurrentLocation({ timeoutMs: 10000, throwOnError: true });
      if (loc && !loc.isFallback) {
        setLocation(loc.formattedAddress || `${loc.latitude.toFixed(4)}°, ${loc.longitude.toFixed(4)}°`);
      } else {
        Alert.alert('GPS Notice', 'Could not detect exact street address. Please enter your locality manually.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Could not retrieve GPS location';
      Alert.alert('Location Error', msg);
    } finally {
      setIsLocating(false);
    }
  };

  // Step 1 Validation -> Proceed to Step 2
  const handleProceedToStep2 = () => {
    if (photos.length === 0) {
      Alert.alert('Photo Required', 'Please add at least 1 photo of your item to attract buyers.');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation -> Proceed to Step 3
  const handleProceedToStep3 = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a clear title for your item.');
      return;
    }
    if (!price.trim() || isNaN(parseFloat(price.trim())) || parseFloat(price.trim()) <= 0) {
      Alert.alert('Valid Price Required', 'Please enter a valid selling price greater than ₹0.');
      return;
    }
    setCurrentStep(3);
  };

  // Step 3 Submission
  const handleSubmit = async () => {
    if (!location.trim()) {
      Alert.alert('Location Required', 'Please enter or detect your pickup locality.');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    let serverListing: any = null;
    try {
      const res = await apiClient.post<any>(ApiEndpoints.marketplace.manageListings, {
        action: 'ADD',
        title: title.trim(),
        description: description.trim() || title.trim(),
        price: parseFloat(price.trim()) || 0,
        condition: selectedCondition,
        categoryId: selectedCategoryId,
        location: location.trim(),
        imageUrls: photos,
      });
      const data = res.data?.data || res.data;
      if (!data || !data.id) {
        throw new Error(res.data?.message || 'Server did not return a valid listing confirmation.');
      }
      serverListing = data;
    } catch (err: any) {
      console.warn('[AddListing] Server error:', err?.message);
      setIsSubmitting(false);
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not publish listing to the server. Please check your connection and retry.';
      Alert.alert('Publish Failed', errorMessage);
      return;
    }

    setIsSubmitting(false);

    const cat = categoriesList.find((c) => c.id === selectedCategoryId) || categoriesList[0];

    const newListing: ListingSummary = {
      id: serverListing.id,
      title: serverListing.title || title.trim(),
      price: serverListing.price ?? (parseFloat(price.trim()) || 0),
      condition: serverListing.condition || selectedCondition,
      location: serverListing.location || location.trim(),
      primaryImageUrl: serverListing.primaryImageUrl || photos[0],
      isFeatured: Boolean(serverListing.isFeatured),
      viewCount: serverListing.viewCount ?? 0,
      createdAt: serverListing.createdAt || new Date().toISOString(),
      categoryId: serverListing.categoryId || selectedCategoryId,
      categoryName: serverListing.categoryName || cat.name,
      isFavorite: false,
    };

    addListing(newListing);

    try {
      notificationService.scheduleLocalNotification({
        title: 'Dhamaka! 🎉 Aapka ad live ho gaya!',
        body: `Puraani cheezon ko kaho bye-bye, jeb me aayegi nayi kamai! 💰📦 (${title.trim()} for ₹${price.trim()})`,
        data: {
          module: 'MARKETPLACE',
          listingId: serverListing.id.toString(),
        },
      });
    } catch {}

    Alert.alert('Success 🎉', 'Your Ad has been published to Community Bazaar!');
    navigation.goBack();
  };

  const selectedCatObj = categoriesList.find((c) => c.id === selectedCategoryId) || categoriesList[0];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface} />

      {/* Screen Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerLeftRow}>
          {currentStep > 1 ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentStep((currentStep - 1) as any)}
              accessibilityLabel="Previous Step"
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          ) : null}
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Post Ad in Bazaar</Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close Post Item"
          testID="add-listing-close-btn"
        >
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* 3-Step Wizard Progress Bar */}
      <View style={[styles.stepperContainer, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        {/* Step 1 */}
        <TouchableOpacity
          style={styles.stepItem}
          onPress={() => setCurrentStep(1)}
          activeOpacity={0.7}
        >
          <View style={[styles.stepCircle, currentStep >= 1 ? { backgroundColor: theme.primary } : { backgroundColor: theme.border }]}>
            <MaterialIcons name="photo-camera" size={14} color="#FFFFFF" />
          </View>
          <Text style={[styles.stepLabel, currentStep === 1 ? { color: theme.primary, fontWeight: '700' } : { color: theme.textTertiary }]}>
            1. Photos
          </Text>
        </TouchableOpacity>

        <View style={[styles.stepLine, { backgroundColor: currentStep >= 2 ? theme.primary : theme.border }]} />

        {/* Step 2 */}
        <TouchableOpacity
          style={styles.stepItem}
          onPress={() => {
            if (photos.length > 0) setCurrentStep(2);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.stepCircle, currentStep >= 2 ? { backgroundColor: theme.primary } : { backgroundColor: theme.border }]}>
            <MaterialIcons name="edit" size={14} color="#FFFFFF" />
          </View>
          <Text style={[styles.stepLabel, currentStep === 2 ? { color: theme.primary, fontWeight: '700' } : { color: theme.textTertiary }]}>
            2. Details
          </Text>
        </TouchableOpacity>

        <View style={[styles.stepLine, { backgroundColor: currentStep >= 3 ? theme.primary : theme.border }]} />

        {/* Step 3 */}
        <TouchableOpacity
          style={styles.stepItem}
          onPress={() => {
            if (photos.length > 0 && title.trim() && price.trim()) setCurrentStep(3);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.stepCircle, currentStep >= 3 ? { backgroundColor: theme.primary } : { backgroundColor: theme.border }]}>
            <MaterialIcons name="check-circle" size={14} color="#FFFFFF" />
          </View>
          <Text style={[styles.stepLabel, currentStep === 3 ? { color: theme.primary, fontWeight: '700' } : { color: theme.textTertiary }]}>
            3. Post
          </Text>
        </TouchableOpacity>
      </View>

      <FormKeyboardAvoid>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* STEP 1: PHOTOS */}
          {currentStep === 1 && (
            <View style={styles.stepContentBox}>
              <View style={styles.stepHeaderGroup}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Step 1: Add Item Photos</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Upload 1 to 5 clear photos. Items with multiple pictures sell 3x faster.
                </Text>
              </View>

              <View style={styles.photosGrid}>
                {photos.map((url, idx) => (
                  <View key={idx} style={[styles.photoCard, { borderColor: theme.cardBorder }, AppShadows.subtle]}>
                    <Image source={{ uri: url }} style={styles.photoImg} />
                    {idx === 0 && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>COVER</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      onPress={() => handleRemovePhoto(idx)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                {photos.length < 5 && (
                  <TouchableOpacity
                    style={[styles.addPhotoCard, { backgroundColor: theme.card, borderColor: theme.primary }]}
                    onPress={handlePickPhoto}
                    activeOpacity={0.75}
                  >
                    {isUploadingPhoto ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <>
                        <View style={[styles.addIconCircle, { backgroundColor: `${theme.primary}18` }]}>
                          <MaterialIcons name="add-a-photo" size={24} color={theme.primary} />
                        </View>
                        <Text style={[styles.addPhotoText, { color: theme.primary }]}>Add Photo</Text>
                        <Text style={[styles.addPhotoSub, { color: theme.textTertiary }]}>{photos.length}/5 uploaded</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.photoHintBox, { backgroundColor: theme.surfaceLight, borderColor: theme.cardBorder }]}>
                <Ionicons name="bulb-outline" size={18} color={theme.primary} />
                <Text style={[styles.photoHintText, { color: theme.textSecondary }]}>
                  Tip: Take photos from front, back, and any brand logos or accessories.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryNextBtn, { backgroundColor: theme.primary }, photos.length === 0 && { opacity: 0.6 }]}
                onPress={handleProceedToStep2}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryNextText}>Next: Title & Price</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: TITLE, CATEGORY & PRICE */}
          {currentStep === 2 && (
            <View style={styles.stepContentBox}>
              <View style={styles.stepHeaderGroup}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Step 2: Title & Price</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Describe what you are selling and set your desired price.
                </Text>
              </View>

              {/* Title */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Item Title *</Text>
              <TextInput
                testID="add-listing-title-input"
                placeholder="e.g. Samsung Galaxy S23 Ultra (128GB)"
                placeholderTextColor={theme.textTertiary}
                value={title}
                onChangeText={setTitle}
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              />

              {/* Category */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 14 }]}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categoriesList.map((cat) => {
                  const isSelected = cat.id === selectedCategoryId;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                      ]}
                      onPress={() => setSelectedCategoryId(cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: theme.textPrimary },
                          isSelected && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Price */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 14 }]}>Price *</Text>
              <View style={[styles.priceInputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Text style={[styles.pricePrefix, { color: theme.primary }]}>₹</Text>
                <TextInput
                  testID="add-listing-price-input"
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={theme.textTertiary}
                  value={price}
                  onChangeText={setPrice}
                  style={[styles.priceInput, { color: theme.textPrimary }]}
                />
              </View>

              {/* Condition */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 14 }]}>Condition *</Text>
              <View style={styles.conditionRow}>
                {CONDITIONS.map((cond) => {
                  const isSelected = cond.id === selectedCondition;
                  return (
                    <TouchableOpacity
                      key={cond.id}
                      style={[
                        styles.conditionChip,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        isSelected && { backgroundColor: `${theme.primary}20`, borderColor: theme.primary },
                      ]}
                      onPress={() => setSelectedCondition(cond.id)}
                    >
                      <Text
                        style={[
                          styles.conditionChipText,
                          { color: theme.textSecondary },
                          isSelected && { color: theme.primary, fontWeight: '700' },
                        ]}
                      >
                        {cond.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Buttons Row */}
              <View style={styles.stepperNavRow}>
                <TouchableOpacity
                  style={[styles.secondaryBackBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={() => setCurrentStep(1)}
                >
                  <Text style={[styles.secondaryBackText, { color: theme.textPrimary }]}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryNextBtn, { backgroundColor: theme.primary, flex: 2 }]}
                  onPress={handleProceedToStep3}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryNextText}>Next: Location & Post</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: LOCATION & PUBLISH REVIEW */}
          {currentStep === 3 && (
            <View style={styles.stepContentBox}>
              <View style={styles.stepHeaderGroup}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Step 3: Location & Post Ad</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Confirm your pickup location so nearby buyers can reach you.
                </Text>
              </View>

              {/* Location */}
              <View style={styles.locationHeaderRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Pickup Location *</Text>
                <TouchableOpacity
                  onPress={handleUseGps}
                  disabled={isLocating}
                  style={styles.gpsButton}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 4 }} />
                  ) : (
                    <MaterialIcons name="my-location" size={15} color={theme.primary} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.gpsButtonText, { color: theme.primary }]}>
                    {isLocating ? 'Detecting...' : 'Use Current GPS'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                testID="add-listing-location-input"
                placeholder="Enter city, locality or landmark"
                placeholderTextColor={theme.textTertiary}
                value={location}
                onChangeText={setLocation}
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              />

              {/* Description */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 14 }]}>Description (Optional)</Text>
              <TextInput
                placeholder="Mention age of item, usage details, warranty, reason for selling..."
                placeholderTextColor={theme.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={[styles.textInput, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              />

              {/* Preview Card */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 14 }]}>Ad Preview</Text>
              <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}>
                {photos[0] ? (
                  <Image source={{ uri: photos[0] }} style={styles.previewImage} />
                ) : null}
                <View style={styles.previewMeta}>
                  <Text style={[styles.previewPrice, { color: theme.primary }]}>₹{price || '0'}</Text>
                  <Text style={[styles.previewTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {title || 'Listing Title'}
                  </Text>
                  <View style={styles.previewPillsRow}>
                    <View style={[styles.previewBadge, { backgroundColor: `${theme.primary}18` }]}>
                      <Text style={[styles.previewBadgeText, { color: theme.primary }]}>{selectedCatObj.name}</Text>
                    </View>
                    <View style={[styles.previewBadge, { backgroundColor: theme.surfaceLight }]}>
                      <Text style={[styles.previewBadgeText, { color: theme.textSecondary }]}>{selectedCondition}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.stepperNavRow}>
                <TouchableOpacity
                  style={[styles.secondaryBackBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.secondaryBackText, { color: theme.textPrimary }]}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.publishSubmitBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  testID="add-listing-publish-btn"
                  accessibilityLabel="Publish Ad"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.publishSubmitText}>Post Ad Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </FormKeyboardAvoid>
    </SafeAreaView>
  );
};

const createStyles = (theme: ThemePalette, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
    },
    headerLeftRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backButton: {
      padding: spacing.xs,
    },
    headerTitle: {
      ...typography.h3,
      fontWeight: 'bold',
    },
    closeButton: {
      padding: spacing.xs,
    },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    stepCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
    stepLine: {
      flex: 1,
      height: 2,
      marginHorizontal: 8,
      borderRadius: 1,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    stepContentBox: {
      flex: 1,
    },
    stepHeaderGroup: {
      marginBottom: 16,
    },
    sectionTitle: {
      ...typography.h3,
      fontWeight: 'bold',
    },
    sectionSubtitle: {
      ...typography.caption,
      marginTop: 4,
      lineHeight: 18,
    },
    photosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    photoCard: {
      width: 100,
      height: 100,
      borderRadius: 12,
      borderWidth: 1,
      overflow: 'hidden',
      position: 'relative',
    },
    photoImg: {
      width: '100%',
      height: '100%',
      borderRadius: 11,
    },
    coverBadge: {
      position: 'absolute',
      bottom: 4,
      left: 4,
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    coverBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '800',
    },
    deletePhotoBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: 'rgba(0,0,0,0.7)',
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addPhotoCard: {
      width: 100,
      height: 100,
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    addPhotoText: {
      fontSize: 11,
      fontWeight: '700',
    },
    addPhotoSub: {
      fontSize: 9,
      marginTop: 2,
    },
    photoHintBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: AppRadius.md,
      borderWidth: 1,
      marginBottom: 20,
    },
    photoHintText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
    },
    inputLabel: {
      ...typography.caption,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    textInput: {
      height: 48,
      borderRadius: AppRadius.md,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      fontSize: 14,
    },
    textArea: {
      height: 80,
      paddingTop: spacing.sm,
      textAlignVertical: 'top',
    },
    categoryScroll: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: AppRadius.pill,
      borderWidth: 1,
      marginRight: 8,
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: '600',
    },
    priceInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
      borderRadius: AppRadius.md,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
    },
    pricePrefix: {
      fontSize: 18,
      fontWeight: 'bold',
      marginRight: 6,
    },
    priceInput: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
    },
    conditionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    conditionChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: AppRadius.md,
      borderWidth: 1,
      alignItems: 'center',
    },
    conditionChipText: {
      fontSize: 11,
      fontWeight: '700',
    },
    locationHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    gpsButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    gpsButtonText: {
      fontSize: 12,
      fontWeight: '700',
    },
    previewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: AppRadius.lg,
      borderWidth: 1,
      marginBottom: 20,
    },
    previewImage: {
      width: 64,
      height: 64,
      borderRadius: 10,
      marginRight: 12,
    },
    previewMeta: {
      flex: 1,
    },
    previewPrice: {
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 2,
    },
    previewTitle: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 6,
    },
    previewPillsRow: {
      flexDirection: 'row',
      gap: 6,
    },
    previewBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    previewBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    stepperNavRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    secondaryBackBtn: {
      flex: 1,
      height: 48,
      borderRadius: AppRadius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBackText: {
      fontSize: 14,
      fontWeight: '700',
    },
    primaryNextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      borderRadius: AppRadius.md,
      gap: 8,
      marginTop: 10,
    },
    primaryNextText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    publishSubmitBtn: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      borderRadius: AppRadius.md,
    },
    publishSubmitText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
  });
