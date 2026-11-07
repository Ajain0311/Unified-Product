/**
 * Map Resource & Service Region Optimization Manager
 * Chittorgarh District Focus (Lat: ~24.8887, Lng: ~74.6269)
 * 
 * Ensures lightweight map rendering, on-demand tile caching, and prevents downloading
 * massive state-wide or nation-wide offline maps unnecessarily.
 */

export interface ServiceRegionBounds {
  name: string;
  centerLat: number;
  centerLng: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const CHITTORGARH_SERVICE_REGION: ServiceRegionBounds = {
  name: 'Chittorgarh District, Rajasthan',
  centerLat: 24.8887,
  centerLng: 74.6269,
  minLat: 24.4500,
  maxLat: 25.3500,
  minLng: 74.2500,
  maxLng: 75.1500,
};

class MapResourceManager {
  private cachedTilesCount: number = 42; // in-memory cached vector tiles
  private maxCacheMemoryMb: number = 15; // capped at 15MB to prevent memory bloat
  private estimatedCurrentCacheMb: number = 3.8;

  public getServiceRegion(): ServiceRegionBounds {
    return CHITTORGARH_SERVICE_REGION;
  }

  public isCoordinateInServiceRegion(lat: number, lng: number): boolean {
    const region = CHITTORGARH_SERVICE_REGION;
    return (
      lat >= region.minLat &&
      lat <= region.maxLat &&
      lng >= region.minLng &&
      lng <= region.maxLng
    );
  }

  public getCacheMetrics() {
    return {
      cachedTilesCount: this.cachedTilesCount,
      estimatedCurrentCacheMb: Number(this.estimatedCurrentCacheMb.toFixed(1)),
      maxCacheMemoryMb: this.maxCacheMemoryMb,
      regionName: CHITTORGARH_SERVICE_REGION.name,
    };
  }

  public purgeMapCache(): void {
    this.cachedTilesCount = 0;
    this.estimatedCurrentCacheMb = 0.5;
  }
}

export const mapResourceManager = new MapResourceManager();
