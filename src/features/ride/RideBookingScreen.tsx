import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { apiClient, createIdempotencyKey } from '../../services/apiClient';
import { ApiEndpoints } from '../../constants/api';
import { locationService } from '../../services/locationService';
import { configService } from '../../services/configService';
import { LocationMapPicker } from '../../components/maps/LocationMapPicker';
import { FormKeyboardAvoid } from '../../components/common/FormKeyboardAvoid';
import { mapboxService, SelectedMapPlace } from '../../services/mapboxService';
import { useAppTheme, ThemePalette } from '../../theme/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { isAuthenticationError } from '../../utils/authErrors';
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';

interface VehicleOption {
  type: string;
  name: string;
  tag: string;
  tagColor: string;
  subtitle: string;
  fare: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  baseFare?: number;
  distanceFare?: number;
  timeFare?: number;
  bookingFee?: number;
  platformFee?: number;
  optionsTotal?: number;
}

const VEHICLES: VehicleOption[] = [
  {
    type: 'BIKE',
    name: 'Bike Taxi',
    tag: 'FASTEST',
    tagColor: colors.secondary,
    subtitle: 'Beat traffic • Helmet provided • Nearby',
    fare: 0,
    icon: 'two-wheeler',
  },
  {
    type: 'AUTO',
    name: 'Auto Rickshaw',
    tag: 'VALUE',
    tagColor: colors.blue,
    subtitle: 'Direct drop • Max 3 seats • Nearby',
    fare: 0,
    icon: 'electric-rickshaw',
  },
  {
    type: 'CAB',
    name: 'Economy Cab',
    tag: 'COMFORT',
    tagColor: colors.purple,
    subtitle: 'AC Hatchback • Luggage space • Nearby',
    fare: 0,
    icon: 'directions-car',
  },
];

export const RideBookingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [vehicles, setVehicles] = useState<VehicleOption[]>(VEHICLES);
  const [routeMetrics, setRouteMetrics] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Real Customer Device GPS State - initialized empty without hardcoded dummy locations
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pickupAddress, setPickupAddress] = useState('Locating your position...');
  const [pickupLocationKind, setPickupLocationKind] = useState<'GPS fresh' | 'GPS cached' | 'Manual' | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState('Tap map to set destination');
  const [activePoint, setActivePoint] = useState<'pickup' | 'dropoff'>('dropoff');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'ONLINE' | 'LOCATING' | 'DENIED' | 'UNAVAILABLE'>('LOCATING');
  const [optionCatalog, setOptionCatalog] = useState<{ code: string; name: string; additionalAmount: number }[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeHits, setPlaceHits] = useState<{ label: string; latitude: number; longitude: number }[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [modalPoint, setModalPoint] = useState<'pickup' | 'dropoff'>('pickup');
  const [pickupInput, setPickupInput] = useState('');
  const [dropoffInput, setDropoffInput] = useState('');
  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff' | null>(null);
  const isMountedRef = useRef(true);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickupInputRef = useRef<TextInput | null>(null);
  const dropoffInputRef = useRef<TextInput | null>(null);
  const rideIdempotencyKeyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const fetchEstimate = (
    pickup: { latitude: number; longitude: number } | null,
    pickupLabel: string,
    dropoff: { latitude: number; longitude: number } | null,
    dropoffLabel: string
  ) => {
    if (!pickup || !dropoff) {
      setRouteMetrics(null);
      return;
    }

    apiClient
      .post<any>(ApiEndpoints.ride.estimate, {
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,
        pickupAddress: pickupLabel,
        dropoffLatitude: dropoff.latitude,
        dropoffLongitude: dropoff.longitude,
        dropoffAddress: dropoffLabel,
        optionCodes: selectedOptions,
      })
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data) {
          if (data.distanceKm && data.estimatedMinutes) {
            setRouteMetrics(
              `${data.distanceKm} km • ~${data.estimatedMinutes} mins • ${data.trafficCondition || 'Moderate Traffic'}`
            );
          }
          if (data.vehicleOptions && data.vehicleOptions.length > 0) {
            const mapped: VehicleOption[] = data.vehicleOptions.map((v: any) => ({
              type: v.vehicleType || 'BIKE',
              name: v.title || v.vehicleType,
              tag: v.tag || 'FASTEST',
              tagColor:
                v.vehicleType === 'CAB'
                  ? colors.purple
                  : v.vehicleType === 'AUTO'
                  ? colors.blue
                  : colors.secondary,
              subtitle: v.subtitle || 'Nearby driver',
              fare: Number(v.estimatedFare) || 50,
              baseFare: Number(v.baseFare) || 0,
              distanceFare: Number(v.distanceFare) || 0,
              timeFare: Number(v.timeFare) || 0,
              bookingFee: Number(v.bookingFee) || 0,
              platformFee: Number(v.platformFee) || 0,
              optionsTotal: Number(v.optionsTotal) || 0,
              icon:
                v.vehicleType === 'CAB'
                  ? 'directions-car'
                  : v.vehicleType === 'AUTO'
                  ? 'electric-rickshaw'
                  : 'two-wheeler',
            }));
            setVehicles(mapped);
          }
          if (Array.isArray(data.availableOptions)) {
            setOptionCatalog(data.availableOptions.map((o: any) => ({
              code: o.code,
              name: o.name,
              additionalAmount: Number(o.additionalAmount) || 0,
            })));
          }
        }
      })
      .catch((error: any) => {
        setRouteMetrics(error?.message || 'Fare could not be calculated. Check the connection and try again.');
      });
  };

  const handleLocateMe = async (isInteractive: boolean = false) => {
    if (isLocating) return;
    setIsLocating(true);
    setGpsStatus('LOCATING');
    try {
      const result = await locationService.getDetailedLocation({
        timeoutMs: 10000,
      });

      if (!isMountedRef.current) return;

      if (result.state === 'SUCCESS' && result.coordinates) {
        const newCoords = {
          latitude: result.coordinates.latitude,
          longitude: result.coordinates.longitude,
        };
        const newAddress =
          result.coordinates.formattedAddress ||
          `${result.coordinates.latitude.toFixed(4)}°, ${result.coordinates.longitude.toFixed(4)}°`;

        setPickupCoords(newCoords);
        setPickupLocationKind(result.coordinates.isFallback ? 'GPS cached' : 'GPS fresh');
        setPickupAddress(newAddress);
        setPickupInput(newAddress);
        setGpsStatus('ONLINE');

        if (dropoffCoords) {
          fetchEstimate(newCoords, newAddress, dropoffCoords, dropoffAddress);
        }
      } else if (result.state === 'GPS_DISABLED') {
        setGpsStatus('UNAVAILABLE');
        if (isInteractive) {
          Alert.alert(
            'GPS Disabled',
            'Device location / GPS is turned off. Please turn on GPS so we can detect your pickup point.',
            [
              { text: 'Set on Map', style: 'cancel' },
              {
                text: 'Turn On GPS',
                onPress: async () => {
                  await locationService.promptEnableGps();
                  handleLocateMe(true);
                },
              },
            ]
          );
        }
        setPickupAddress('Location services disabled. Please enable GPS.');
      } else if (result.state === 'PERMISSION_BLOCKED') {
        setGpsStatus('DENIED');
        if (isInteractive) {
          Alert.alert(
            'Location Permission Blocked',
            'Location access is blocked in your phone settings. Please enable location permission to locate yourself.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => locationService.openDeviceSettings(),
              },
            ]
          );
        }
        setPickupAddress('Location permission blocked. Enable in Settings or select on map.');
      } else if (result.state === 'PERMISSION_DENIED') {
        setGpsStatus('DENIED');
        if (isInteractive) {
          Alert.alert(
            'Location Required',
            'Please allow location access so we can detect your pickup point and find nearby rides.',
            [
              { text: 'Set on Map', style: 'cancel' },
              {
                text: 'Retry',
                onPress: () => handleLocateMe(true),
              },
            ]
          );
        }
        setPickupAddress('Location permission denied. Search or move the map pin.');
      } else if (result.state === 'TIMEOUT') {
        setGpsStatus('UNAVAILABLE');
        if (isInteractive) {
          Alert.alert(
            'GPS Timeout',
            'Could not get a timely GPS lock. Please check your signal or pick your pickup point on the map.',
            [{ text: 'OK' }]
          );
        }
        setPickupAddress('GPS timed out. Tap map to select pickup point.');
      } else {
        setGpsStatus('UNAVAILABLE');
        setPickupAddress('GPS unavailable. Search an address or move the map pin.');
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.warn('[RideBookingScreen] Could not retrieve GPS:', error);
      setGpsStatus('UNAVAILABLE');
      setPickupAddress('GPS unavailable. Search an address or move the map pin.');
    } finally {
      if (isMountedRef.current) {
        setIsLocating(false);
      }
    }
  };

  const openMapModal = (point: 'pickup' | 'dropoff') => {
    setModalPoint(point);
    setActivePoint(point);
    setIsMapModalVisible(true);
  };

  const handlePlaceSelect = (place: SelectedMapPlace, pointTarget?: 'pickup' | 'dropoff') => {
    const target = pointTarget || modalPoint || activePoint;
    const coords = { latitude: place.latitude, longitude: place.longitude };
    const resolvedAddress = place.address || `${coords.latitude.toFixed(4)}°, ${coords.longitude.toFixed(4)}°`;

    if (target === 'pickup') {
      setPickupCoords(coords);
      setPickupLocationKind('Manual');
      setPickupAddress(resolvedAddress);
      setPickupInput(resolvedAddress);
      if (dropoffCoords) {
        fetchEstimate(coords, resolvedAddress, dropoffCoords, dropoffAddress);
      } else {
        setRouteMetrics(null);
      }
      return;
    }

    setDropoffCoords(coords);
    setDropoffAddress(resolvedAddress);
    setDropoffInput(resolvedAddress);
    if (pickupCoords) {
      fetchEstimate(pickupCoords, pickupAddress, coords, resolvedAddress);
    } else {
      setRouteMetrics(null);
    }
  };

  useEffect(() => {
    handleLocateMe(false);
  }, []);

  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      fetchEstimate(pickupCoords, pickupAddress, dropoffCoords, dropoffAddress);
    }
  }, [selectedOptions.join('|')]);

  const searchPlaces = (text: string, point: 'pickup' | 'dropoff') => {
    setActiveInput(point);
    setActivePoint(point);

    if (point === 'pickup') {
      setPickupInput(text);
      // Invalidate confirmed place coordinates since query was edited
      setPickupCoords(null);
      setPickupLocationKind(null);
      setPickupAddress(text);
    } else {
      setDropoffInput(text);
      // Invalidate confirmed place coordinates since query was edited
      setDropoffCoords(null);
      setDropoffAddress(text);
    }

    // Invalidate route metrics as coordinates are unconfirmed
    setRouteMetrics(null);
    setSearchError(null);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (text.trim().length < 2) {
      setPlaceHits([]);
      setIsSearchingPlaces(false);
      return;
    }

    setIsSearchingPlaces(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const hits = await mapboxService.searchPlaces(text.trim(), pickupCoords || undefined);
        if (isMountedRef.current) {
          setPlaceHits(hits.map((hit) => ({ label: hit.address || hit.name, latitude: hit.latitude, longitude: hit.longitude })));
        }
      } catch {
        if (isMountedRef.current) {
          setSearchError('Address search failed. Use map pin or try again.');
          setPlaceHits([]);
        }
      } finally {
        if (isMountedRef.current) {
          setIsSearchingPlaces(false);
        }
      }
    }, 250);
  };

  const handleClearField = (point: 'pickup' | 'dropoff') => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setPlaceHits([]);
    setSearchError(null);
    setIsSearchingPlaces(false);
    setRouteMetrics(null);
    setActiveInput(point);
    setActivePoint(point);

    if (point === 'pickup') {
      setPickupCoords(null);
      setPickupAddress('');
      setPickupInput('');
      pickupInputRef.current?.focus();
    } else {
      setDropoffCoords(null);
      setDropoffAddress('');
      setDropoffInput('');
      dropoffInputRef.current?.focus();
    }
  };

  const chooseSearchHit = async (hit: { label: string; latitude: number; longitude: number }) => {
    let address = hit.label;
    try {
      const reversed = await mapboxService.reverseGeocode(hit.latitude, hit.longitude);
      if (reversed.address) address = reversed.address;
    } catch {
      // Fallback to hit.label
    }
    const currentPoint = activeInput || activePoint;
    setActivePoint(currentPoint);
    handlePlaceSelect({ latitude: hit.latitude, longitude: hit.longitude, address }, currentPoint);
    setPlaceHits([]);
    setActiveInput(null);
  };

  const selectedVehicle = vehicles[selectedIndex] || vehicles[0];

  const handleBookRide = async () => {
    if (isBooking) return;

    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      useAuthModalStore.getState().openAuthModal({
        title: 'Sign In to Book Ride',
        subtitle: 'Enter your phone number & verify OTP right here to book your ride instantly.',
        onSuccess: () => {
          handleBookRide();
        },
      });
      return;
    }

    if (!pickupCoords) {
      Alert.alert('Pickup Required', 'Please set your pickup location on the map.');
      return;
    }
    if (!dropoffCoords) {
      Alert.alert('Destination Required', 'Please tap on the map to set your destination.');
      return;
    }

    setIsBooking(true);
    try {
      let confirmedPickup = pickupCoords;
      let confirmedPickupAddress = pickupAddress;
      if (pickupLocationKind === 'GPS fresh' || pickupLocationKind === 'GPS cached') {
        const config = await configService.fetchConfig(true);
        const maxAgeSeconds = config?.gpsMaxCachedAgeSeconds;
        const maxAccuracyMeters = config?.gpsMaxAccuracyMeters;
        if (!Number.isFinite(maxAgeSeconds) || !Number.isFinite(maxAccuracyMeters))
          throw new Error('Could not verify GPS quality rules. Select your pickup point on the map.');
        const freshFix = await locationService.getBookingGradeLocation({
          timeoutMs: 10000,
          maxAgeSeconds: maxAgeSeconds!,
          maxAccuracyMeters: maxAccuracyMeters!,
        });
        confirmedPickup = { latitude: freshFix.latitude, longitude: freshFix.longitude };
        confirmedPickupAddress = freshFix.formattedAddress;
        setPickupCoords(confirmedPickup);
        setPickupAddress(confirmedPickupAddress);
        setPickupLocationKind('GPS fresh');
      }
      const requestPayload = {
        vehicleType: selectedVehicle.type,
        pickupAddress: confirmedPickupAddress,
        pickupLatitude: confirmedPickup!.latitude,
        pickupLongitude: confirmedPickup!.longitude,
        dropoffAddress,
        dropoffLatitude: dropoffCoords.latitude,
        dropoffLongitude: dropoffCoords.longitude,
        paymentMethod: 'CASH',
        optionCodes: selectedOptions,
      };
      const fingerprint = JSON.stringify(requestPayload);
      if (rideIdempotencyKeyRef.current?.fingerprint !== fingerprint) {
        rideIdempotencyKeyRef.current = { fingerprint, key: createIdempotencyKey() };
      }
      const res = await apiClient.post<any>(ApiEndpoints.ride.book, requestPayload, {
        headers: { 'Idempotency-Key': rideIdempotencyKeyRef.current.key },
      });
      rideIdempotencyKeyRef.current = null;
      const data = res.data?.data || res.data;
      const rideId = data?.rideNumber || `RD-${data?.id || 'NEW'}`;
      const rideNumericId = data?.id;
      navigation.navigate('ActiveRide', {
        rideId,
        rideNumericId,
        rideData: data,
      });
    } catch (err: any) {
      if (isAuthenticationError(err)) {
        useAuthModalStore.getState().openAuthModal({
          title: 'Session expired',
          subtitle: 'Verify your phone number to continue booking this ride.',
          onSuccess: () => {
            void handleBookRide();
          },
        });
        return;
      }
      Alert.alert('Booking Error', err?.message || 'Unable to book ride. Please check connection and try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.chipBg }]}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            navigation.navigate('MainTabs', { screen: 'Home' });
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="chevron-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Find Your Ride</Text>
        <TouchableOpacity
          style={[
            styles.gpsChip,
            gpsStatus === 'DENIED' && styles.gpsChipDenied,
            gpsStatus === 'LOCATING' && styles.gpsChipLocating,
          ]}
          onPress={() => handleLocateMe(true)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={gpsStatus === 'DENIED' ? 'location-off' : isLocating ? 'sync' : 'gps-fixed'}
            size={13}
            color={gpsStatus === 'DENIED' ? theme.error : isLocating ? '#2563EB' : '#10B981'}
          />
          <Text
            style={[
              styles.gpsText,
              gpsStatus === 'DENIED' && { color: theme.error },
              gpsStatus === 'LOCATING' && { color: '#2563EB' },
            ]}
          >
            {isLocating ? 'Locating...' : gpsStatus === 'DENIED' ? 'GPS Denied' : 'GPS Active'}
          </Text>
        </TouchableOpacity>
      </View>

      <FormKeyboardAvoid>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Location Inputs Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }, AppShadows.subtle]}>
          {/* Pickup Row */}
          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor: theme.secondary }]} />
            <View style={styles.inputWrapper}>
              <View style={styles.pickupHeaderRow}>
                <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
                <TouchableOpacity
                  onPress={() => handleLocateMe(true)}
                  disabled={isLocating}
                  style={styles.locateMeButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="my-location" size={12} color={theme.primary} />
                  <Text style={styles.locateMeText}>{isLocating ? 'Locating...' : 'Use GPS'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputFieldContainer}>
                <TextInput
                  ref={pickupInputRef}
                  value={activeInput === 'pickup' ? pickupInput : (pickupAddress || '')}
                  onChangeText={(t) => searchPlaces(t, 'pickup')}
                  onFocus={() => {
                    setActiveInput('pickup');
                    setActivePoint('pickup');
                    setPickupInput(pickupAddress.startsWith('Locating') ? '' : pickupAddress);
                  }}
                  placeholder="Where to pick you up?"
                  placeholderTextColor={theme.textTertiary}
                  style={styles.textInput}
                  selectTextOnFocus
                  autoCorrect={false}
                />
                {(activeInput === 'pickup' ? pickupInput.length > 0 : !!pickupAddress && !pickupAddress.startsWith('Locating')) && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => handleClearField('pickup')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Clear pickup location"
                  >
                    <MaterialIcons name="cancel" size={18} color={theme.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
              {pickupLocationKind && (
                <Text style={{ color: theme.textTertiary, fontSize: 11, marginTop: 4 }}>
                  {pickupLocationKind} location{pickupLocationKind === 'GPS cached' ? ' · refreshed before booking' : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.pinMapBtn}
              onPress={() => openMapModal('pickup')}
              accessibilityLabel="Pin pickup on map"
            >
              <MaterialIcons name="map" size={20} color={theme.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLineVertical} />
            <View style={styles.dividerHorizontal} />
          </View>

          {/* Destination Row */}
          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor: theme.error }]} />
            <View style={styles.inputWrapper}>
              <Text style={styles.locationLabel}>WHERE TO?</Text>
              <View style={styles.inputFieldContainer}>
                <TextInput
                  ref={dropoffInputRef}
                  value={activeInput === 'dropoff' ? dropoffInput : (dropoffAddress.startsWith('Tap map') ? '' : dropoffAddress)}
                  onChangeText={(t) => searchPlaces(t, 'dropoff')}
                  onFocus={() => {
                    setActiveInput('dropoff');
                    setActivePoint('dropoff');
                    setDropoffInput(dropoffAddress.startsWith('Tap map') ? '' : dropoffAddress);
                  }}
                  placeholder="Enter drop destination"
                  placeholderTextColor={theme.textTertiary}
                  style={styles.textInput}
                  selectTextOnFocus
                  autoCorrect={false}
                />
                {(activeInput === 'dropoff' ? dropoffInput.length > 0 : !!dropoffAddress && !dropoffAddress.startsWith('Tap map')) && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => handleClearField('dropoff')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Clear destination"
                  >
                    <MaterialIcons name="cancel" size={18} color={theme.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.pinMapBtn}
              onPress={() => openMapModal('dropoff')}
              accessibilityLabel="Pin destination on map"
            >
              <MaterialIcons name="map" size={20} color={theme.error} />
            </TouchableOpacity>
          </View>

          {/* Autocomplete Dropdown List */}
          {isSearchingPlaces && placeHits.length === 0 && (
            <View style={[styles.autocompleteContainer, { padding: 12, alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          )}

          {placeHits.length > 0 && (
            <View style={styles.autocompleteContainer}>
              {placeHits.map((hit, idx) => (
                <TouchableOpacity
                  key={`${hit.latitude}-${hit.longitude}-${idx}`}
                  onPress={() => chooseSearchHit(hit)}
                  style={styles.autocompleteItem}
                >
                  <MaterialIcons name="place" size={18} color={theme.primary} />
                  <Text style={styles.autocompleteText} numberOfLines={2}>
                    {hit.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {searchError ? (
            <Text style={{ color: theme.error, fontSize: 12, marginTop: 6 }}>{searchError}</Text>
          ) : null}
        </View>

        {/* Route Metrics / Guidance Badge */}
        {routeMetrics ? (
          <View style={styles.metricsBadge}>
            <MaterialIcons name="alt-route" size={16} color={theme.info} />
            <Text style={styles.metricsText}>{routeMetrics}</Text>
          </View>
        ) : (
          <View style={[styles.metricsBadge, { backgroundColor: isDark ? 'rgba(255, 122, 69, 0.15)' : 'rgba(255, 90, 31, 0.08)' }]}>
            <MaterialIcons name="touch-app" size={16} color={theme.primary} />
            <Text style={[styles.metricsText, { color: theme.textSecondary }]}>
              {dropoffCoords
                ? 'Calculating route & fares...'
                : 'Type drop location or tap 🗺️ map icon to set on map'}
            </Text>
          </View>
        )}

        {/* Available Vehicles Section Header */}
        {optionCatalog.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionHeader}>RIDE OPTIONS</Text>
            {optionCatalog.map((option) => {
              const on = selectedOptions.includes(option.code);
              return (
                <TouchableOpacity
                  key={option.code}
                  onPress={() => setSelectedOptions((current) => on ? current.filter((code) => code !== option.code) : [...current, option.code])}
                  style={{ paddingVertical: 8 }}
                >
                  <Text style={{ color: theme.textPrimary }}>
                    {on ? '✓' : '○'} {option.name}  +₹{option.additionalAmount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {selectedVehicle.baseFare ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: theme.textSecondary }}>Estimated fare · {routeMetrics || 'set pickup and destination'}</Text>
            <Text style={{ color: theme.textPrimary }}>Base ₹{selectedVehicle.baseFare} · Distance ₹{selectedVehicle.distanceFare} · Time ₹{selectedVehicle.timeFare}</Text>
            <Text style={{ color: theme.textPrimary }}>Booking ₹{selectedVehicle.bookingFee} · Platform ₹{selectedVehicle.platformFee} · Options ₹{selectedVehicle.optionsTotal || 0}</Text>
          </View>
        ) : null}

        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>AVAILABLE VEHICLES</Text>

        {/* Vehicles List */}
        {vehicles.map((vehicle, index) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={vehicle.type}
              activeOpacity={0.88}
              style={[
                styles.vehicleCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                isSelected && { borderColor: '#2563EB', borderWidth: 1.5, backgroundColor: isDark ? '#1E293B' : '#EFF6FF' },
                AppShadows.subtle,
              ]}
              onPress={() => setSelectedIndex(index)}
            >
              <View
                style={[
                  styles.vehicleIconContainer,
                  { backgroundColor: `${vehicle.tagColor}18` },
                ]}
              >
                <MaterialIcons name={vehicle.icon as any} size={24} color={vehicle.tagColor} />
              </View>

              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleTitleRow}>
                  <Text
                    style={[
                      styles.vehicleName,
                      { color: theme.textPrimary },
                      isSelected && { fontWeight: '800' },
                    ]}
                  >
                    {vehicle.name}
                  </Text>
                  <View
                    style={[
                      styles.tagBadge,
                      { backgroundColor: `${vehicle.tagColor}20` },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: vehicle.tagColor }]}>
                      {vehicle.tag}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.vehicleSubtitle, { color: theme.textTertiary }]}>{vehicle.subtitle}</Text>
              </View>

              <Text
                style={[
                  styles.vehicleFare,
                  { color: theme.textPrimary },
                  isSelected && { color: '#2563EB', fontWeight: '800' },
                ]}
              >
                {vehicle.fare > 0 ? `₹${vehicle.fare.toFixed(0)}` : '--'}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Bottom Action Bar */}
        <View style={styles.actionBar}>
          <View style={[styles.paymentButton, { backgroundColor: theme.chipBg, borderColor: theme.cardBorder }]}>
            <MaterialIcons name="payment" size={17} color={theme.textSecondary} />
            <Text style={[styles.paymentText, { color: theme.textPrimary }]}>Cash / UPI ▼</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            style={[
              styles.bookButton,
              { backgroundColor: '#2563EB' },
              (isBooking || !dropoffCoords) && { opacity: 0.5 },
              AppShadows.md,
            ]}
            disabled={isBooking || !dropoffCoords}
            onPress={handleBookRide}
            testID="book-ride-button"
            accessibilityLabel="Book Ride"
          >
            <Text style={styles.bookButtonText}>
              {isBooking
                ? 'Booking Ride...'
                : !dropoffCoords
                ? 'Select Destination to Book'
                : selectedVehicle.fare > 0
                ? `Confirm ride · estimated ₹${selectedVehicle.fare.toFixed(0)}`
                : 'Confirm ride'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </FormKeyboardAvoid>

      {/* Pin on Map Modal */}
      {isMapModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Pin {modalPoint === 'pickup' ? 'Pickup' : 'Destination'} on Map
              </Text>
              <TouchableOpacity
                onPress={() => setIsMapModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalMapContent}>
              <LocationMapPicker
                key={modalPoint}
                label={modalPoint === 'pickup' ? 'Drag or tap map to set pickup' : 'Drag or tap map to set destination'}
                initialCoordinate={modalPoint === 'pickup' ? pickupCoords || undefined : dropoffCoords || undefined}
                initialAddress={modalPoint === 'pickup' ? pickupAddress : dropoffAddress}
                proximity={pickupCoords || undefined}
                height={300}
                hideSearchInput={false}
                onSelect={(place) => {
                  handlePlaceSelect(place);
                }}
              />
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setIsMapModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    },
    backButton: {
      padding: spacing.xs,
    },
    headerTitle: {
      ...typography.h2,
      color: theme.textPrimary,
    },
    gpsChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 200, 83, 0.15)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: spacing.radiusLg,
      borderWidth: 1,
      borderColor: 'rgba(0, 200, 83, 0.3)',
      gap: 4,
    },
    gpsChipDenied: {
      backgroundColor: 'rgba(244, 67, 54, 0.15)',
      borderColor: 'rgba(244, 67, 54, 0.3)',
    },
    gpsChipLocating: {
      backgroundColor: 'rgba(33, 150, 243, 0.15)',
      borderColor: 'rgba(33, 150, 243, 0.3)',
    },
    gpsText: {
      ...typography.caption,
      color: theme.secondary,
      fontWeight: '700',
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: spacing.sm,
    },
    locationTextGroup: {
      flex: 1,
    },
    pickupHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    locateMeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(255, 122, 69, 0.2)' : 'rgba(255, 90, 31, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    locateMeText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.primary,
    },
    locationLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textTertiary,
      letterSpacing: 0.8,
    },
    locationValue: {
      ...typography.bodyMedium,
      color: theme.textPrimary,
      fontWeight: '700',
      marginTop: 2,
    },
    coordsSubtitle: {
      fontSize: 10,
      color: theme.textTertiary,
      marginTop: 2,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 8,
    },
    dividerLineVertical: {
      width: 2,
      height: 20,
      backgroundColor: theme.cardBorder,
      marginLeft: 4,
      marginRight: spacing.md,
    },
    dividerHorizontal: {
      flex: 1,
      height: 1,
      backgroundColor: theme.cardBorder,
    },
    metricsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceLight,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: spacing.radiusMd,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginTop: spacing.sm,
      gap: 6,
    },
    metricsText: {
      ...typography.caption,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    inputWrapper: {
      flex: 1,
    },
    inputFieldContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    textInput: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      paddingVertical: 4,
      paddingRight: 6,
    },
    clearBtn: {
      padding: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pinMapBtn: {
      padding: 8,
      borderRadius: 10,
      backgroundColor: theme.surfaceLight,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    autocompleteContainer: {
      marginTop: 10,
      backgroundColor: theme.surfaceLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      overflow: 'hidden',
      maxHeight: 180,
    },
    autocompleteItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    autocompleteText: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 13,
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
      zIndex: 999,
    },
    modalSheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: spacing.md,
      borderTopWidth: 1,
      borderColor: theme.cardBorder,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    modalTitle: {
      ...typography.h3,
      color: theme.textPrimary,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalMapContent: {
      marginVertical: 4,
    },
    modalDoneBtn: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    modalDoneBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 15,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textTertiary,
      letterSpacing: 1.0,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    vehicleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: 10,
    },
    vehicleCardSelected: {
      backgroundColor: theme.surfaceLight,
      borderColor: theme.primary,
      borderWidth: 1.5,
    },
    vehicleIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vehicleInfo: {
      flex: 1,
      marginLeft: spacing.sm,
      marginRight: spacing.sm,
    },
    vehicleTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    vehicleName: {
      ...typography.bodyMedium,
      color: theme.textPrimary,
      fontWeight: '600',
    },
    tagBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    tagText: {
      fontSize: 9,
      fontWeight: '800',
    },
    vehicleSubtitle: {
      ...typography.caption,
      color: theme.textSecondary,
      marginTop: 3,
    },
    vehicleFare: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.textPrimary,
    },
    actionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.lg,
      gap: 12,
    },
    paymentButton: {
      height: 52,
      paddingHorizontal: 14,
      backgroundColor: theme.surfaceLight,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    paymentText: {
      ...typography.bodySmall,
      color: theme.textPrimary,
      fontWeight: '600',
    },
    bookButton: {
      flex: 1,
      height: 52,
      backgroundColor: theme.primary,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookButtonText: {
      ...typography.bodyLarge,
      color: '#FFFFFF',
      fontWeight: '800',
    },
  });
