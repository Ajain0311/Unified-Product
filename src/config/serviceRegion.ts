/**
 * Chittorgarh District Service Region Configuration
 *
 * Defines the geographic boundary and reference coordinates for
 * Chittorgarh District, Rajasthan, India.
 *
 * Used for service availability validation, map initial framing,
 * and geocoding proximity bias.
 */

export interface ServiceRegion {
  id: string;
  districtName: string;
  stateName: string;
  countryName: string;
  displayName: string;
  centerCoordinates: {
    latitude: number;
    longitude: number;
  };
  bounds: {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
  };
  keyLandmarks: Array<{
    name: string;
    latitude: number;
    longitude: number;
    category: 'fort' | 'transit' | 'commercial' | 'civic';
  }>;
}

export const CHITTORGARH_SERVICE_REGION: ServiceRegion = {
  id: 'chittorgarh-rajasthan',
  districtName: 'Chittorgarh',
  stateName: 'Rajasthan',
  countryName: 'India',
  displayName: 'Chittorgarh District, Rajasthan',
  centerCoordinates: {
    latitude: 24.8887,
    longitude: 74.6269,
  },
  // Bounding box encompassing Chittorgarh, Nimbahera, Kapasan, Begun, Rawatbhata, Gangrar, Bhadesar
  bounds: {
    minLatitude: 24.20,
    maxLatitude: 25.40,
    minLongitude: 74.10,
    maxLongitude: 75.45,
  },
  keyLandmarks: [
    {
      name: 'Shri Sanwaliya Seth Mandir, Mandphiya',
      latitude: 24.6600,
      longitude: 74.4000,
      category: 'fort',
    },
    {
      name: 'Chittorgarh Fort',
      latitude: 24.8879,
      longitude: 74.6450,
      category: 'fort',
    },
    {
      name: 'Collectorate Circle, City Center',
      latitude: 24.8887,
      longitude: 74.6269,
      category: 'civic',
    },
    {
      name: 'Chittorgarh Junction Railway Station',
      latitude: 24.8965,
      longitude: 74.6342,
      category: 'transit',
    },
    {
      name: 'Subhash Chowk Bazaar',
      latitude: 24.8856,
      longitude: 74.6288,
      category: 'commercial',
    },
    {
      name: 'Nimbahera Town Center',
      latitude: 24.6231,
      longitude: 74.6865,
      category: 'commercial',
    },
  ],
};

export const ACTIVE_SERVICE_REGION: ServiceRegion = CHITTORGARH_SERVICE_REGION;

/**
 * Initial Launch Operating Hub: Mandphiya, Rajasthan (Shri Sanwaliya Seth Temple)
 * Primary operating epicenter for food delivery (20 km), rides (20 km), and hotel discovery.
 */
export const MANDPHIYA_SERVICE_CENTER = {
  name: 'Mandphiya (Shri Sanwaliya Ji), Rajasthan',
  latitude: 24.6600,
  longitude: 74.4000,
  foodMaxDeliveryRadiusKm: 20,
  rideMaxDistanceKm: 20,
  hotelDefaultRadiusKm: 20,
};

export const MANDPHIYA_SERVICE_CONSTRAINTS = {
  maxDeliveryRadiusKm: 20,
  maxRideDistanceKm: 20,
  defaultHotelRadiusKm: 20,
};

/**
 * Calculate great-circle distance between two geographical points using Haversine formula (km).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadiusKm * c).toFixed(2));
}

/**
 * Validates whether given coordinates fall within the 20 km food delivery radius of Mandphiya.
 */
export function isWithinMandphiyaDeliveryRadius(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  maxKm = MANDPHIYA_SERVICE_CENTER.foodMaxDeliveryRadiusKm
): boolean {
  if (latitude == null || longitude == null) return false;
  const distance = calculateHaversineDistanceKm(
    MANDPHIYA_SERVICE_CENTER.latitude,
    MANDPHIYA_SERVICE_CENTER.longitude,
    latitude,
    longitude
  );
  return distance <= maxKm;
}

/**
 * Validates whether ride pickup or destination is within supported ride distance of Mandphiya.
 */
export function isWithinMandphiyaRideRadius(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  maxKm = MANDPHIYA_SERVICE_CENTER.rideMaxDistanceKm
): boolean {
  return isWithinMandphiyaDeliveryRadius(latitude, longitude, maxKm);
}

/**
 * Checks whether given coordinates are within the supported service region boundary.
 */
export function isCoordinatesWithinServiceRegion(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): boolean {
  if (latitude == null || longitude == null) return false;
  const { minLatitude, maxLatitude, minLongitude, maxLongitude } = ACTIVE_SERVICE_REGION.bounds;
  return (
    latitude >= minLatitude &&
    latitude <= maxLatitude &&
    longitude >= minLongitude &&
    longitude <= maxLongitude
  );
}

/**
 * Returns a human-friendly location badge or warning status for given coordinates.
 */
export function getServiceRegionStatus(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): {
  isServiceable: boolean;
  regionName: string;
  message: string;
} {
  if (latitude == null || longitude == null) {
    return {
      isServiceable: true,
      regionName: ACTIVE_SERVICE_REGION.displayName,
      message: `Browsing ${ACTIVE_SERVICE_REGION.displayName}`,
    };
  }

  const inRegion = isCoordinatesWithinServiceRegion(latitude, longitude);
  if (inRegion) {
    return {
      isServiceable: true,
      regionName: ACTIVE_SERVICE_REGION.displayName,
      message: 'You are inside the active service area.',
    };
  }

  return {
    isServiceable: false,
    regionName: ACTIVE_SERVICE_REGION.displayName,
    message: `Services are currently rolling out exclusively in ${ACTIVE_SERVICE_REGION.displayName}. You can explore the catalogue, but orders and rides are limited to this region.`,
  };
}
