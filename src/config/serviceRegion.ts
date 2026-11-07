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
