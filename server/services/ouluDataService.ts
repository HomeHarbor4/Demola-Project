import fetch from 'node-fetch';
import { log } from '../vite';

// Define response types for the API
interface OuluApiResponse<T> {
  success: boolean;
  result: T;
  help?: string;
  error?: {
    message: string;
    __type: string;
  };
}

interface DatasetInfo {
  id: string;
  name: string;
  title: string;
  notes: string;
  metadata_created: string;
  metadata_modified: string;
  resources: ResourceInfo[];
  tags: { name: string }[];
  organization: { id: string; name: string; title: string; };
  // Add more properties as needed
}

interface ResourceInfo {
  id: string;
  name: string;
  description: string;
  format: string;
  url: string;
  // Add more properties as needed
}

interface ResourceData {
  resource_id: string;
  fields: { id: string; type: string; }[];
  records: Record<string, any>[];
  total: number;
  _links: {
    start: string;
    next: string;
  };
}

interface SearchResult {
  count: number;
  results: DatasetInfo[];
  search_facets: Record<string, any>;
}

/**
 * Service for interacting with the Oulu Open Data API
 * Data source: https://data.ouka.fi/data/fi/dataset/
 */
export class OuluDataService {
  // Updated API endpoint based on Oulu Open Data CKAN 2.10.7
  private baseUrl = 'https://data.ouka.fi/data/api/3/action';
  
  /**
   * Fetches package list (datasets) from Oulu Open Data API
   * @returns List of available datasets
   */
  async getDatasetList(): Promise<string[]> {
    log(`[OuluDataService] getDatasetList called`, 'oulu-api');
    try {
      log(`[OuluDataService] Fetching dataset list from Oulu Open Data`, 'oulu-api');
      const response = await fetch(`${this.baseUrl}/package_list`);
      if (!response.ok) {
        log(`[OuluDataService] Failed to fetch dataset list: ${response.status} ${response.statusText}`, 'oulu-api');
        throw new Error(`Failed to fetch dataset list: ${response.status} ${response.statusText}`);
      }
      const data = await response.json() as OuluApiResponse<string[]>;
      if (!data.success) {
        log(`[OuluDataService] API Error: ${data.error?.message || 'Unknown error'}`, 'oulu-api');
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
      log(`[OuluDataService] Dataset list fetched: ${data.result.length} datasets`, 'oulu-api');
      return data.result;
    } catch (error) {
      log(`[OuluDataService] Error fetching dataset list: ${error}`, 'oulu-api');
      throw error;
    }
  }
  
  /**
   * Fetches dataset information by ID
   * @param datasetId The ID of the dataset to fetch
   * @returns Detailed information about the dataset
   */
  async getDatasetInfo(datasetId: string): Promise<DatasetInfo> {
    log(`[OuluDataService] getDatasetInfo called with id=${datasetId}`, 'oulu-api');
    try {
      log(`[OuluDataService] Fetching dataset info for: ${datasetId}`, 'oulu-api');
      const response = await fetch(`${this.baseUrl}/package_show?id=${datasetId}`);
      if (!response.ok) {
        log(`[OuluDataService] Failed to fetch dataset info: ${response.status} ${response.statusText}`, 'oulu-api');
        throw new Error(`Failed to fetch dataset info: ${response.status} ${response.statusText}`);
      }
      const data = await response.json() as OuluApiResponse<DatasetInfo>;
      if (!data.success) {
        log(`[OuluDataService] API Error: ${data.error?.message || 'Unknown error'}`, 'oulu-api');
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
      log(`[OuluDataService] Dataset info fetched for id=${datasetId}`, 'oulu-api');
      return data.result;
    } catch (error) {
      log(`[OuluDataService] Error fetching dataset info for id=${datasetId}: ${error}`, 'oulu-api');
      throw error;
    }
  }
  
  /**
   * Fetches data records from a specific resource within a dataset
   * @param resourceId The ID of the resource to fetch
   * @param limit Maximum number of records to fetch (default: 100)
   * @param offset Starting point for records (default: 0)
   * @param filters Optional filters to apply to the data
   * @returns Data records from the resource
   */
  async getResourceData(resourceId: string, limit: number = 100, offset: number = 0, filters: Record<string, any> = {}): Promise<ResourceData> {
    log(`[OuluDataService] getResourceData called with id=${resourceId} limit=${limit} offset=${offset}`, 'oulu-api');
    try {
      log(`[OuluDataService] Fetching resource data for: ${resourceId}`, 'oulu-api');
      
      // Build query parameters
      const params = new URLSearchParams({
        id: resourceId,
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      // Add any filters as query parameters
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
      
      const response = await fetch(`${this.baseUrl}/datastore_search?${params.toString()}`);
      
      if (!response.ok) {
        log(`[OuluDataService] Failed to fetch resource data: ${response.status} ${response.statusText}`, 'oulu-api');
        throw new Error(`Failed to fetch resource data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as OuluApiResponse<ResourceData>;
      
      if (!data.success) {
        log(`[OuluDataService] API Error: ${data.error?.message || 'Unknown error'}`, 'oulu-api');
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
      
      log(`[OuluDataService] Resource data fetched for id=${resourceId} (${data.result.records.length} records)`, 'oulu-api');
      return data.result;
    } catch (error) {
      log(`[OuluDataService] Error fetching resource data for id=${resourceId}: ${error}`, 'oulu-api');
      throw error;
    }
  }
  
  /**
   * Searches for datasets matching the given query
   * @param query The search query
   * @param limit Maximum number of results (default: 10)
   * @returns Search results
   */
  async searchDatasets(query: string, limit: number = 10): Promise<SearchResult> {
    log(`[OuluDataService] searchDatasets called with query=${query} limit=${limit}`, 'oulu-api');
    try {
      log(`[OuluDataService] Searching datasets with query: ${query}`, 'oulu-api');
      
      const params = new URLSearchParams({
        q: query,
        rows: limit.toString()
      });
      
      const response = await fetch(`${this.baseUrl}/package_search?${params.toString()}`);
      
      if (!response.ok) {
        log(`[OuluDataService] Failed to search datasets: ${response.status} ${response.statusText}`, 'oulu-api');
        throw new Error(`Failed to search datasets: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as OuluApiResponse<SearchResult>;
      
      if (!data.success) {
        log(`[OuluDataService] API Error: ${data.error?.message || 'Unknown error'}`, 'oulu-api');
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
      
      log(`[OuluDataService] Search results fetched: ${data.result.count} results`, 'oulu-api');
      return data.result;
    } catch (error) {
      log(`[OuluDataService] Error searching datasets: ${error}`, 'oulu-api');
      throw error;
    }
  }
  
  /**
   * Fetches property price data for Oulu region
   * This is a specialized method for real estate data
   * @param limit Maximum number of records to fetch
   * @param filters Optional filters like neighborhood, property type, etc.
   * @returns Property price data
   */
  async getPropertyPriceData(limit: number = 50, filters: Record<string, any> = {}): Promise<ResourceData> {
    log(`[OuluDataService] getPropertyPriceData called limit=${limit}`, 'oulu-api');
    try {
      // Using the correct dataset ID for Oulu property data
      // Dataset: "oulun-kaupungin-kiinteistojen-perustiedot" - Oulu City Property Basic Information
      const PROPERTY_DATASET_ID = 'oulun-kaupungin-kiinteistojen-perustiedot';
      
      // First, get the dataset information to find the resource ID
      const datasetInfo = await this.getDatasetInfo(PROPERTY_DATASET_ID);
      
      // Find the appropriate resource (CSV or JSON format preferably)
      const resource = datasetInfo.resources.find(r => 
        r.format === 'CSV' || r.format === 'JSON' || r.format === 'XLSX'
      );
      
      if (!resource || !resource.id) {
        log(`[OuluDataService] No suitable resource found in the ${PROPERTY_DATASET_ID} dataset`, 'oulu-api');
        throw new Error(`No suitable resource found in the ${PROPERTY_DATASET_ID} dataset`);
      }
      
      log(`[OuluDataService] Using resource ID ${resource.id} for property price data`, 'oulu-api');
      
      return this.getResourceData(resource.id, limit, 0, filters);
    } catch (error) {
      log(`[OuluDataService] Error fetching property price data: ${error}`, 'oulu-api');
      
      // Fallback to another property-related dataset if the main one fails
      try {
        log('[OuluDataService] Trying fallback property dataset', 'oulu-api');
        const FALLBACK_DATASET_ID = 'asuntokunnat-kaupunginosittain';
        
        const datasetInfo = await this.getDatasetInfo(FALLBACK_DATASET_ID);
        const resource = datasetInfo.resources.find(r => 
          r.format === 'CSV' || r.format === 'JSON' || r.format === 'XLSX'
        );
        
        if (!resource || !resource.id) {
          log(`[OuluDataService] No suitable resource found in the ${FALLBACK_DATASET_ID} dataset`, 'oulu-api');
          throw new Error(`No suitable resource found in the ${FALLBACK_DATASET_ID} dataset`);
        }
        
        log(`[OuluDataService] Using fallback resource ID ${resource.id} for property data`, 'oulu-api');
        
        return this.getResourceData(resource.id, limit, 0, filters);
      } catch (fallbackError) {
        log(`[OuluDataService] Fallback property data also failed: ${fallbackError}`, 'oulu-api');
        throw error; // Throw the original error
      }
    }
  }
  
  /**
   * Fetches nearby cultural and natural attractions from ZoneAtlas Oulu Open Data
   * @param lat Latitude
   * @param lng Longitude
   * @param radius Radius in km (default 10)
   * @returns Array of nearby attractions
   */
  async getNearbyAttractions(lat: number, lng: number, radius: number = 10): Promise<any[]> {
    const response = await fetch("https://opendata.zoneatlas.com/oulu/objects.json");
    const allAttractions = await response.json() as any[];
    // Haversine function
    function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
      const toRad = (x: number) => (x * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    // Filter by distance
    const filtered = allAttractions.filter((item: any) => {
      const coords = item.geo?.coordinates;
      if (!coords || coords.length !== 2) return false;
      const [itemLat, itemLng] = coords;
      return haversine(lat, lng, itemLat, itemLng) <= radius;
    });
    // Map to frontend format
    return filtered.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.Categories?.[0]?.title || "Attraction",
      latitude: item.geo.coordinates[0],
      longitude: item.geo.coordinates[1],
      content: item.content || "",
      image: item.Media?.[0]?.path || null,
      url: item.buttons?.[0]?.url || null,
      category: item.Categories?.[0]?.slug || null,
      tags: item.Tags?.map((t: any) => t.title) || [],
      i18n: item.i18n || {},
    }));
  }
}

// Export a singleton instance
export const ouluDataService = new OuluDataService();