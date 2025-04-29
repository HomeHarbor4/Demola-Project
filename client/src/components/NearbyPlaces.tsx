import { useState } from 'react';
import { useQuery } from '@tanstack/react-query'; // Import useQuery
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient'; // Import apiRequest
import { Spinner } from './Spinner'; // Import Spinner
import { Button } from './ui/button'; // Import Button for retry
import { useLanguage } from '@/contexts/LanguageContext';

interface NearbyPlace {
  name: string;
  vicinity: string;
  rating?: number;
  types: string[];
  distance?: string;
  icon?: string;
  latitude: number;
  longitude: number;
  type: string;
}

// Define the expected structure of the API response from your backend proxy
interface GooglePlacesApiResponse {
  status: string;
  results: any[]; // Define a more specific type if possible based on Google Places API fields
  error_message?: string;
}

interface NearbyPlacesProps {
  latitude: number;
  longitude: number;
  onPlacesLoaded?: (places: NearbyPlace[]) => void;
}

export default function NearbyPlaces({ latitude, longitude, onPlacesLoaded }: NearbyPlacesProps) {
  const [activeTab, setActiveTab] = useState('restaurants');
  const { t } = useLanguage();

  // Icon mapping for place types
  const placeIcons: Record<string, string> = {
    restaurants: "ri-restaurant-line",
    schools: "ri-school-line",
    hospitals: "ri-hospital-line",
    parks: "ri-park-line",
    shopping: "ri-shopping-bag-line",
    metro: "ri-train-line",
    religious: "ri-building-4-line",
    atms: "ri-bank-card-line",
    transit: "ri-bus-line"
  };

  // Mapping from our internal tab keys to Google Places API types
  const placeTypeMap: Record<string, string> = {
    restaurants: 'restaurant',
    schools: 'school',
    hospitals: 'hospital',
    parks: 'park',
    shopping: 'shopping_mall',
    metro: 'subway_station',
    religious: 'place_of_worship',
    atms: 'atm',
    transit: 'transit_station'
  };

  // --- Fetch nearby places using React Query ---
  const {
    data: places, // This will hold the formatted places for the active tab
    isLoading,
    error,
    refetch // Function to manually refetch data
  } = useQuery<NearbyPlace[], Error>({ // Specify the expected data type and error type
    queryKey: ['/places/nearby', activeTab, latitude, longitude], // Query key includes dependencies
    queryFn: async () => {
      const googlePlaceType = placeTypeMap[activeTab];
      // Use apiRequest to fetch data from your backend proxy
      const data = await apiRequest<GooglePlacesApiResponse>(
        'GET',
        `/places/nearby?type=${googlePlaceType}&lat=${latitude}&lng=${longitude}`
      );

      // Check Google Places API status within the response
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API Error:', data.status, data.error_message);
        throw new Error(data.error_message || `Google Places API error: ${data.status}`);
      }

      // Process and format the results
      const formattedPlaces = (data.results || []).map((place: any) => ({
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        types: place.types,
        icon: place.icon,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        type: activeTab,
        distance: place.distance
      })).slice(0, 6); // Limit to top 6 results

      // Call onPlacesLoaded if provided
      if (onPlacesLoaded) {
        onPlacesLoaded(formattedPlaces);
      }

      return formattedPlaces;
    },
    enabled: !!latitude && !!longitude && !!placeTypeMap[activeTab], // Only run query if coordinates and type are valid
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    gcTime: 1000 * 60 * 15, // Keep data in cache for 15 minutes
    refetchOnWindowFocus: false, // Optional: disable refetch on window focus
  });

  // Function to get the display name for the tab
  const getTabDisplayName = (type: string): string => {
    return t(`nearbyPlaces.types.${type}`);
  };

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold mb-4">{t('nearbyPlaces.title')}</h4>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="relative mb-4">
          {/* Horizontal scrollable TabsList */}
          <div className="overflow-x-auto pb-1 scrollbar-hide">
            <TabsList className="w-auto inline-flex border-collapse h-9 items-center justify-start rounded-lg border p-1 text-muted-foreground">
              {Object.keys(placeTypeMap).map(type => (
                <TabsTrigger key={type} value={type} className="whitespace-nowrap text-xs px-3 py-1.5">
                  <i className={`${placeIcons[type]} mr-1.5`}></i>
                  <span>{getTabDisplayName(type)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {/* Fade effect for scrollable area */}
          <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white to-transparent pointer-events-none dark:from-background dark:to-transparent"></div>
        </div>

        {/* Content for the active tab */}
        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            // Skeleton Loader while fetching
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="flex space-x-1 mt-1">
                          {[...Array(5)].map((_, starIndex) => <Skeleton key={starIndex} className="h-3 w-3" />)}
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            // Error message display
            <div className="text-center py-8 bg-red-50 border border-red-200 rounded-lg">
              <i className="ri-error-warning-line text-3xl text-red-500 mb-2"></i>
              <p className="text-red-600 font-medium">{t('nearbyPlaces.error.title')}</p>
              <p className="text-sm text-red-500 mt-1">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                <i className="ri-refresh-line mr-1"></i> {t('nearbyPlaces.error.retry')}
              </Button>
            </div>
          ) : !places || places.length === 0 ? (
            // Display when no places are found for the selected type
            <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <i className={`${placeIcons[activeTab]} text-2xl text-slate-400`}></i>
              </div>
              <h4 className="text-base font-medium text-slate-700 mb-1">
                {t('nearbyPlaces.empty.title', { type: getTabDisplayName(activeTab) })}
              </h4>
              <p className="text-slate-500 text-sm max-w-md text-center">
                {t('nearbyPlaces.empty.description', { type: getTabDisplayName(activeTab).toLowerCase() })}
              </p>
              <Button variant="link" size="sm" onClick={() => refetch()} className="mt-3 text-primary-600">
                <i className="ri-refresh-line mr-1"></i> {t('nearbyPlaces.empty.refresh')}
              </Button>
            </div>
          ) : (
            // Display the list of found places
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {places.map((place, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 flex-shrink-0 rounded-md flex items-center justify-center bg-primary-50 text-primary-600">
                        {/* Use specific icon or fallback */}
                        <i className={`${placeIcons[activeTab] || 'ri-map-pin-line'} text-lg`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-sm truncate">{place.name}</h5>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-medium whitespace-nowrap">
                            {getTabDisplayName(activeTab)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{place.vicinity}</p>
                        {place.rating !== undefined && place.rating > 0 && (
                          <div className="flex items-center mt-1.5">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <i
                                  key={i}
                                  className={`text-xs ${i < Math.floor(place.rating!) ? 'ri-star-fill text-yellow-500' : (i < place.rating!) ? 'ri-star-half-fill text-yellow-500' : 'ri-star-line text-slate-300'}`}
                                ></i>
                              ))}
                            </div>
                            <span className="text-xs font-medium ml-1.5 text-slate-600">{place.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      {/* Distance display removed as it's not directly available */}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-500">
                        {getTabDisplayName(activeTab)}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.vicinity)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-700 hover:underline flex items-center"
                      >
                        <span>{t('nearbyPlaces.viewOnMap')}</span>
                        <i className="ri-external-link-line ml-1"></i>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
