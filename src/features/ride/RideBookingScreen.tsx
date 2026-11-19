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
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
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
import { mapboxService, SelectedMapPlace, MapPlaceSuggestion } from '../../services/mapboxService';
import { boundsFromPoints } from './rideMapUtils';
import { useAppTheme, ThemePalette } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { isAuthenticationError } from '../../utils/authErrors';
import { AppRadius, AppSpacing, AppShadows } from '../../theme/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const canUseNativeMap = Platform.OS === 'ios' || Platform.OS === 'android';

let MapboxMaps: typeof import('@rnmapbox/maps') | null = null;
if (canUseNativeMap) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    MapboxMaps = require('@rnmapbox/maps');
  } catch {
    MapboxMaps = null;
  }
}

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
  const { language } = useLanguageStore();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [vehicles, setVehicles] = useState<VehicleOption[]>(VEHICLES);
  const [routeMetrics, setRouteMetrics] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // GPS Coordinates and Address States
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

  // Autocomplete and Place Search States
  const [placeHits, setPlaceHits] = useState<{ label: string; latitude: number; longitude: number }[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [modalPoint, setModalPoint] = useState<'pickup' | 'dropoff'>('pickup');
  const [pickupInput, setPickupInput] = useState('');
  const [dropoffInput, setDropoffInput] = useState('');
  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff' | null>(null);

  // Dynamic nearby destination suggestions from Mapbox results
  const [nearbySuggestions, setNearbySuggestions] = useState<MapPlaceSuggestion[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  const isMountedRef = useRef(true);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickupInputRef = useRef<TextInput | null>(null);
  const dropoffInputRef = useRef<TextInput | null>(null);
  const rideIdempotencyKeyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const cameraRef = useRef<any>(null);

  const [tokenReady, setTokenReady] = useState(mapboxService.isConfigured());
  const MapView = MapboxMaps?.MapView;
  const Camera = MapboxMaps?.Camera;
  const PointAnnotation = MapboxMaps?.PointAnnotation;

  useEffect(() => {
    isMountedRef.current = true;
    if (!tokenReady) {
      configService.fetchConfig().then(() => {
        if (mapboxService.isConfigured()) {
          setTokenReady(true);
        }
      });
    }
    return () => {
      isMountedRef.current = false;
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [tokenReady]);

  useEffect(() => {
    if (MapboxMaps?.default?.setAccessToken && tokenReady) {
      MapboxMaps.default.setAccessToken(mapboxService.getAccessToken());
    }
  }, [tokenReady]);

  // Adjust Camera whenever pickup and/or dropoff coordinates change
  useEffect(() => {
    if (!cameraRef.current) return;
    if (pickupCoords && dropoffCoords) {
      const bounds = boundsFromPoints([pickupCoords, dropoffCoords]);
      if (bounds) {
        try {
          cameraRef.current.fitBounds(bounds.ne, bounds.sw, 48, 600);
        } catch {
          // ignore
        }
      }
    } else if (pickupCoords) {
      try {
        cameraRef.current.setCamera({
          centerCoordinate: [pickupCoords.longitude, pickupCoords.latitude],
          zoomLevel: 14,
          animationDuration: 600,
        });
      } catch {
        // ignore
      }
    }
  }, [pickupCoords?.latitude, pickupCoords?.longitude, dropoffCoords?.latitude, dropoffCoords?.longitude]);

  // Fetch dynamic nearby destination suggestions based on user GPS & real Mapbox POI search
  useEffect(() => {
    if (pickupCoords && !dropoffCoords) {
      let active = true;
      setIsLoadingNearby(true);
      mapboxService
        .getNearbySuggestions(pickupCoords)
        .then((items) => {
          if (active && isMountedRef.current) {
            setNearbySuggestions(items);
          }
        })
        .catch(() => {
          if (active && isMountedRef.current) {
            setNearbySuggestions([]);
          }
        })
        .finally(() => {
          if (active && isMountedRef.current) {
            setIsLoadingNearby(false);
          }
        });
      return () => {
        active = false;
      };
    } else if (dropoffCoords) {
      setNearbySuggestions([]);
    }
  }, [pickupCoords?.latitude, pickupCoords?.longitude, Boolean(dropoffCoords)]);

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
            setOptionCatalog(
              data.availableOptions.map((o: any) => ({
                code: o.code,
                name: o.name,
                additionalAmount: Number(o.additionalAmount) || 0,
              }))
            );
          }
        }
      })
      .catch((error: any) => {
        setRouteMetrics(error?.message || 'Fare could not be calculated. Check connection and try again.');
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
            'Location access is blocked in your phone settings. Please enable location permission in settings.',
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

  const onNativeMapTap = async (event: any) => {
    const coords = event?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      const [longitude, latitude] = coords;
      try {
        const place = await mapboxService.reverseGeocode(latitude, longitude);
        handlePlaceSelect(place, activePoint);
      } catch {
        handlePlaceSelect(
          {
            latitude,
            longitude,
            address: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
          },
          activePoint
        );
      }
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
      setPickupCoords(null);
      setPickupLocationKind(null);
      setPickupAddress(text);
    } else {
      setDropoffInput(text);
      setDropoffCoords(null);
      setDropoffAddress(text);
    }

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

  const defaultCenter = pickupCoords || { latitude: 24.8887, longitude: 74.6269 };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* 1. MAP-FIRST VIEWPORT */}
      <View style={styles.mapViewport}>
        {canUseNativeMap && MapView && Camera && tokenReady ? (
          <MapView
            style={StyleSheet.absoluteFill}
            styleURL={isDark ? 'mapbox://styles/mapbox/navigation-night-v1' : 'mapbox://styles/mapbox/streets-v12'}
            logoEnabled={false}
            attributionEnabled={false}
            onPress={onNativeMapTap}
          >
            <Camera
              ref={cameraRef}
              zoomLevel={14}
              centerCoordinate={[defaultCenter.longitude, defaultCenter.latitude]}
              animationMode="flyTo"
              animationDuration={600}
            />

            {/* Pickup Marker */}
            {PointAnnotation && pickupCoords && (
              <PointAnnotation
                id="pickup-map-marker"
                coordinate={[pickupCoords.longitude, pickupCoords.latitude]}
                title="Pickup"
              >
                <View style={styles.mapMarkerContainer}>
                  <View style={[styles.markerBadge, { backgroundColor: '#10B981' }]}>
                    <MaterialIcons name="my-location" size={13} color="#FFFFFF" />
                  </View>
                  <View style={[styles.markerTriangle, { borderTopColor: '#10B981' }]} />
                </View>
              </PointAnnotation>
            )}

            {/* Dropoff Marker */}
            {PointAnnotation && dropoffCoords && (
              <PointAnnotation
                id="dropoff-map-marker"
                coordinate={[dropoffCoords.longitude, dropoffCoords.latitude]}
                title="Dropoff"
              >
                <View style={styles.mapMarkerContainer}>
                  <View style={[styles.markerBadge, { backgroundColor: '#EF4444' }]}>
                    <MaterialIcons name="flag" size={13} color="#FFFFFF" />
                  </View>
                  <View style={[styles.markerTriangle, { borderTopColor: '#EF4444' }]} />
                </View>
              </PointAnnotation>
            )}
          </MapView>
        ) : (
          <LocationMapPicker
            key={`map-fallback-${activePoint}`}
            height={280}
            hideSearchInput={true}
            initialCoordinate={activePoint === 'pickup' ? pickupCoords || undefined : dropoffCoords || undefined}
            initialAddress={activePoint === 'pickup' ? pickupAddress : dropoffAddress}
            proximity={pickupCoords || undefined}
            onSelect={(place) => handlePlaceSelect(place, activePoint)}
          />
        )}

        {/* Floating Top Controls Overlay */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={[styles.floatingCircleBtn, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }
              navigation.navigate('MainTabs', { screen: 'Home' });
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Back"
          >
            <MaterialIcons name="chevron-left" size={26} color={theme.textPrimary} />
          </TouchableOpacity>

          {/* Active Tap Pin Mode Indicator Chip */}
          <TouchableOpacity
            style={[styles.modeIndicatorPill, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
            activeOpacity={0.8}
            onPress={() => setActivePoint(activePoint === 'pickup' ? 'dropoff' : 'pickup')}
          >
            <View
              style={[
                styles.modeDot,
                { backgroundColor: activePoint === 'pickup' ? '#10B981' : '#EF4444' },
              ]}
            />
            <Text style={[styles.modeText, { color: theme.textPrimary }]}>
              {activePoint === 'pickup'
                ? (language === 'hi' ? 'पिकअप पिन सक्रिय · टैप करें' : 'Pickup pin active · Tap to set')
                : (language === 'hi' ? 'ड्रॉप पिन सक्रिय · टैप करें' : 'Dropoff pin active · Tap to set')}
            </Text>
          </TouchableOpacity>

          {/* Re-center GPS Button */}
          <TouchableOpacity
            style={[
              styles.floatingCircleBtn,
              { backgroundColor: theme.surface, borderColor: theme.cardBorder },
              gpsStatus === 'DENIED' && { borderColor: theme.error },
            ]}
            onPress={() => handleLocateMe(true)}
            disabled={isLocating}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Re-center to GPS"
          >
            <MaterialIcons
              name={isLocating ? 'sync' : gpsStatus === 'DENIED' ? 'location-off' : 'my-location'}
              size={20}
              color={gpsStatus === 'DENIED' ? theme.error : isLocating ? '#2563EB' : '#10B981'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. COMPACT BOTTOM SHEET */}
      <View style={[styles.bottomSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

        <FormKeyboardAvoid>
          <ScrollView
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Location Inputs Block */}
            <View style={[styles.inputsCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
              {/* Pickup Input Row */}
              <TouchableOpacity
                activeOpacity={1}
                style={[styles.inputRow, activePoint === 'pickup' && styles.activeInputRow]}
                onPress={() => {
                  setActivePoint('pickup');
                  pickupInputRef.current?.focus();
                }}
              >
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <View style={styles.inputWrapper}>
                  <View style={styles.inputHeaderRow}>
                    <Text style={[styles.locationLabel, { color: activePoint === 'pickup' ? theme.primary : theme.textTertiary }]}>
                      {language === 'hi' ? 'पिकअप स्थान' : 'PICKUP LOCATION'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleLocateMe(true)}
                      disabled={isLocating}
                      style={styles.gpsActionBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="my-location" size={11} color={theme.primary} />
                      <Text style={[styles.gpsActionText, { color: theme.primary }]}>
                        {isLocating
                          ? (language === 'hi' ? 'खोज रहे...' : 'Locating...')
                          : (language === 'hi' ? 'जीपीएस' : 'Use GPS')}
                      </Text>
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
                      placeholder={language === 'hi' ? 'पिकअप स्थान कहां है?' : 'Where to pick you up?'}
                      placeholderTextColor={theme.textTertiary}
                      style={[styles.textInput, { color: theme.textPrimary }]}
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
                        <MaterialIcons name="cancel" size={16} color={theme.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.pinIconBtn, { backgroundColor: `${theme.primary}15` }]}
                  onPress={() => openMapModal('pickup')}
                  accessibilityLabel="Pin pickup on map"
                >
                  <MaterialIcons name="map" size={18} color={theme.primary} />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Connecting Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLineVertical, { backgroundColor: theme.border }]} />
                <View style={[styles.dividerHorizontal, { backgroundColor: theme.borderSubtle }]} />
              </View>

              {/* Destination Input Row */}
              <TouchableOpacity
                activeOpacity={1}
                style={[styles.inputRow, activePoint === 'dropoff' && styles.activeInputRow]}
                onPress={() => {
                  setActivePoint('dropoff');
                  dropoffInputRef.current?.focus();
                }}
              >
                <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                <View style={styles.inputWrapper}>
                  <Text style={[styles.locationLabel, { color: activePoint === 'dropoff' ? theme.primary : theme.textTertiary }]}>
                    {language === 'hi' ? 'ड्रॉप स्थान (कहाँ जाना है?)' : 'WHERE TO?'}
                  </Text>
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
                      placeholder={language === 'hi' ? 'ड्रॉप स्थान दर्ज करें' : 'Enter drop destination'}
                      placeholderTextColor={theme.textTertiary}
                      style={[styles.textInput, { color: theme.textPrimary }]}
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
                        <MaterialIcons name="cancel" size={16} color={theme.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.pinIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
                  onPress={() => openMapModal('dropoff')}
                  accessibilityLabel="Pin destination on map"
                >
                  <MaterialIcons name="map" size={18} color="#EF4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Autocomplete Dropdown List */}
            {isSearchingPlaces && placeHits.length === 0 && (
              <View style={[styles.autocompleteContainer, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.searchingText, { color: theme.textTertiary }]}>Searching addresses...</Text>
              </View>
            )}

            {placeHits.length > 0 && (
              <View style={[styles.autocompleteContainer, { backgroundColor: theme.surface, borderColor: theme.cardBorder }, AppShadows.md]}>
                {placeHits.map((hit, idx) => (
                  <TouchableOpacity
                    key={`${hit.latitude}-${hit.longitude}-${idx}`}
                    onPress={() => chooseSearchHit(hit)}
                    style={[styles.autocompleteItem, { borderBottomColor: theme.borderSubtle }]}
                  >
                    <MaterialIcons name="place" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.autocompleteText, { color: theme.textPrimary }]} numberOfLines={2}>
                      {hit.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {searchError ? (
              <Text style={{ color: theme.error, fontSize: 12, marginTop: 4 }}>{searchError}</Text>
            ) : null}

            {/* 3. DYNAMIC NEARBY DESTINATION SUGGESTIONS (Mapbox POIs) */}
            {nearbySuggestions.length > 0 && !dropoffCoords && (
              <View style={styles.suggestionsContainer}>
                <View style={styles.suggestionsHeaderRow}>
                  <Ionicons name="sparkles" size={13} color={theme.primary} />
                  <Text style={[styles.suggestionsTitle, { color: theme.textSecondary }]}>
                    {language === 'hi' ? 'आस-पास के सुझाव' : 'Nearby suggestions'}
                  </Text>
                  {isLoadingNearby && <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 6 }} />}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsScroll}
                >
                  {nearbySuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.suggestionChip,
                        { backgroundColor: theme.surface, borderColor: theme.cardBorder },
                        AppShadows.subtle,
                      ]}
                      onPress={() => {
                        handlePlaceSelect(
                          {
                            latitude: item.latitude,
                            longitude: item.longitude,
                            address: item.address || item.name,
                          },
                          'dropoff'
                        );
                      }}
                      activeOpacity={0.75}
                    >
                      <MaterialIcons name="place" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.suggestionChipText, { color: theme.textPrimary }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Route Metrics / Guidance Badge */}
            {routeMetrics ? (
              <View style={[styles.metricsBadge, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.08)' }]}>
                <MaterialIcons name="alt-route" size={16} color={theme.info} />
                <Text style={[styles.metricsText, { color: theme.info }]}>{routeMetrics}</Text>
              </View>
            ) : (
              <View style={[styles.metricsBadge, { backgroundColor: isDark ? 'rgba(255, 90, 31, 0.15)' : 'rgba(255, 90, 31, 0.08)' }]}>
                <MaterialIcons name="touch-app" size={16} color={theme.primary} />
                <Text style={[styles.metricsText, { color: theme.textSecondary }]}>
                  {dropoffCoords
                    ? (language === 'hi' ? 'किराया व रूट गणना हो रही है...' : 'Calculating route & fares...')
                    : (language === 'hi' ? 'ड्रॉप स्थान चुनें या मैप पर टैप करें' : 'Select drop destination or tap map')}
                </Text>
              </View>
            )}

            {/* Available Vehicles Section Header */}
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
              {language === 'hi' ? 'उपलब्ध सवारियां' : 'AVAILABLE VEHICLES'}
            </Text>

            {/* Vehicles Selector */}
            <View style={styles.vehiclesContainer}>
              {vehicles.map((vehicle, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <TouchableOpacity
                    key={vehicle.type}
                    activeOpacity={0.88}
                    style={[
                      styles.vehicleCard,
                      { backgroundColor: theme.surface, borderColor: theme.cardBorder },
                      isSelected && {
                        borderColor: '#2563EB',
                        borderWidth: 1.5,
                        backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                      },
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
            </View>

            {/* Ride Options Catalog (if configured) */}
            {optionCatalog.length > 0 && (
              <View style={styles.optionsCatalogSection}>
                <Text style={[styles.optionsCatalogTitle, { color: theme.textSecondary }]}>RIDE OPTIONS</Text>
                {optionCatalog.map((option) => {
                  const on = selectedOptions.includes(option.code);
                  return (
                    <TouchableOpacity
                      key={option.code}
                      onPress={() =>
                        setSelectedOptions((current) =>
                          on ? current.filter((code) => code !== option.code) : [...current, option.code]
                        )
                      }
                      style={styles.optionRow}
                    >
                      <MaterialIcons
                        name={on ? 'check-box' : 'check-box-outline-blank'}
                        size={18}
                        color={on ? theme.primary : theme.textTertiary}
                      />
                      <Text style={[styles.optionName, { color: theme.textPrimary }]}>
                        {option.name} (+₹{option.additionalAmount})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Action Bar */}
            <View style={styles.actionBar}>
              <View style={[styles.paymentButton, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
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
                {isBooking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.bookButtonText}>
                    {!dropoffCoords
                      ? (language === 'hi' ? 'ड्रॉप स्थान चुनें' : 'Select Destination')
                      : selectedVehicle.fare > 0
                      ? (language === 'hi'
                          ? `राइड बुक करें · ₹${selectedVehicle.fare.toFixed(0)}`
                          : `Confirm ride · ₹${selectedVehicle.fare.toFixed(0)}`)
                      : (language === 'hi' ? 'राइड बुक करें' : 'Confirm ride')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </FormKeyboardAvoid>
      </View>

      {/* Pin on Map Full Modal (preserved for fallback or deep map interaction) */}
      {isMapModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Pin {modalPoint === 'pickup' ? 'Pickup' : 'Destination'} on Map
              </Text>
              <TouchableOpacity onPress={() => setIsMapModalVisible(false)} style={styles.modalCloseBtn}>
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
              style={[styles.modalDoneBtn, { backgroundColor: theme.primary }]}
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
    mapViewport: {
      height: SCREEN_HEIGHT * 0.38,
      width: '100%',
      position: 'relative',
      backgroundColor: isDark ? '#111827' : '#E2E8F0',
    },
    floatingControls: {
      position: 'absolute',
      top: 14,
      left: 14,
      right: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    floatingCircleBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      ...AppShadows.md,
    },
    modeIndicatorPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: AppRadius.pill,
      borderWidth: 1,
      gap: 6,
      ...AppShadows.md,
    },
    modeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    modeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    mapMarkerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    markerBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      ...AppShadows.md,
    },
    markerTriangle: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderTopWidth: 6,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      alignSelf: 'center',
      marginTop: -1,
    },
    bottomSheet: {
      flex: 1,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      marginTop: -18,
      overflow: 'hidden',
      ...AppShadows.card,
    },
    sheetHandle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
    sheetScrollContent: {
      paddingHorizontal: AppSpacing.md,
      paddingTop: 8,
      paddingBottom: 36,
    },
    inputsCard: {
      borderRadius: AppRadius.lg,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
    },
    activeInputRow: {
      borderRadius: AppRadius.md,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    inputWrapper: {
      flex: 1,
    },
    inputHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    locationLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    gpsActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    gpsActionText: {
      fontSize: 11,
      fontWeight: '700',
    },
    inputFieldContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    textInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      paddingVertical: 2,
      marginRight: 6,
    },
    clearBtn: {
      padding: 4,
    },
    pinIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 6,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 12,
      marginVertical: 1,
    },
    dividerLineVertical: {
      width: 2,
      height: 12,
      marginLeft: 4,
    },
    dividerHorizontal: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      marginLeft: 14,
    },
    autocompleteContainer: {
      borderRadius: AppRadius.md,
      borderWidth: 1,
      marginBottom: 10,
      overflow: 'hidden',
    },
    searchingText: {
      fontSize: 12,
      marginLeft: 8,
    },
    autocompleteItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    autocompleteText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
    },
    suggestionsContainer: {
      marginBottom: 10,
    },
    suggestionsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
      paddingHorizontal: 2,
    },
    suggestionsTitle: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      marginLeft: 4,
    },
    suggestionsScroll: {
      gap: 8,
      paddingRight: 8,
    },
    suggestionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: AppRadius.pill,
      borderWidth: 1,
    },
    suggestionChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    metricsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: AppRadius.md,
      gap: 6,
      marginBottom: 12,
    },
    metricsText: {
      fontSize: 12,
      fontWeight: '600',
      flex: 1,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    vehiclesContainer: {
      gap: 8,
      marginBottom: 12,
    },
    vehicleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: AppRadius.md,
      borderWidth: 1,
    },
    vehicleIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    vehicleInfo: {
      flex: 1,
    },
    vehicleTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    vehicleName: {
      fontSize: 14,
      fontWeight: '700',
    },
    tagBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    tagText: {
      fontSize: 9,
      fontWeight: '800',
    },
    vehicleSubtitle: {
      fontSize: 11,
    },
    vehicleFare: {
      fontSize: 16,
      fontWeight: '700',
      marginLeft: 8,
    },
    optionsCatalogSection: {
      marginBottom: 12,
    },
    optionsCatalogTitle: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      gap: 6,
    },
    optionName: {
      fontSize: 12,
      fontWeight: '500',
    },
    actionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 6,
    },
    paymentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: AppRadius.md,
      borderWidth: 1,
      gap: 6,
    },
    paymentText: {
      fontSize: 12,
      fontWeight: '700',
    },
    bookButton: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: AppRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.md,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    modalTitle: {
      ...typography.h3,
      fontWeight: '700',
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalMapContent: {
      marginBottom: spacing.md,
      borderRadius: spacing.radiusMd,
      overflow: 'hidden',
    },
    modalDoneBtn: {
      paddingVertical: 14,
      borderRadius: AppRadius.md,
      alignItems: 'center',
    },
    modalDoneBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
  });
