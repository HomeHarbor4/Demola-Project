import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '../components/Spinner';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Home, Building, Palmtree, School, Stethoscope, Search, Home as HomeIcon, BarChart, MapPin, Info } from 'lucide-react';

type DatasetType = {
  id: string;
  name: string;
  title: string;
  notes: string;
};

type ResourceRecord = Record<string, any>;

const OuluDataViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('datasets');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPoiType, setSelectedPoiType] = useState<string>('school');
  
  // Query to get the list of datasets
  const { data: datasets, isLoading: isLoadingDatasets, error: datasetsError } = useQuery({
    queryKey: ['/oulu/datasets'],
    queryFn: () => apiRequest<string[]>('/oulu/datasets'),
    enabled: activeTab === 'datasets',
  });
  
  // Query to search datasets based on input query
  const { data: searchResults, isLoading: isLoadingSearch, error: searchError } = useQuery({
    queryKey: ['/oulu/search', searchQuery],
    queryFn: () => apiRequest<any>(`/oulu/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: !!searchQuery && activeTab === 'search',
  });
  
  // Query to get property price data
  const { data: propertyPriceData, isLoading: isLoadingPropertyPrices, error: propertyPricesError } = useQuery({
    queryKey: ['/oulu/property-prices'],
    queryFn: () => apiRequest<any>('/oulu/property-prices'),
    enabled: activeTab === 'property-prices',
  });
  
  // Query to get points of interest data
  const { data: poiData, isLoading: isLoadingPoi, error: poiError } = useQuery({
    queryKey: ['/oulu/pois', selectedPoiType],
    queryFn: () => apiRequest<any>(`/oulu/pois/${selectedPoiType}`),
    enabled: activeTab === 'points-of-interest',
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will automatically run when searchQuery changes
  };
  
  const handlePoiTypeChange = (value: string) => {
    setSelectedPoiType(value);
  };
  
  const renderDatasetList = () => {
    if (isLoadingDatasets) return <Spinner />;
    if (datasetsError) return <Alert><AlertDescription>Error loading datasets</AlertDescription></Alert>;
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {datasets?.slice(0, 9).map((dataset, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg truncate">{dataset}</CardTitle>
            </CardHeader>
            <CardFooter>
              <Button size="sm" variant="outline" asChild>
                <a href={`https://data.ouka.fi/data/fi/dataset/${dataset}`} target="_blank" rel="noopener noreferrer">
                  View Dataset <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  const renderSearchResults = () => {
    if (isLoadingSearch) return <Spinner />;
    if (searchError) return <Alert><AlertDescription>Error searching datasets</AlertDescription></Alert>;
    
    if (!searchQuery) {
      return (
        <div className="text-center py-6">
          <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-muted-foreground">Enter a search term to find datasets</p>
        </div>
      );
    }
    
    const results = searchResults?.results || [];
    
    if (results.length === 0) {
      return (
        <Alert>
          <AlertDescription>No results found for "{searchQuery}"</AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Found {searchResults?.count} results for "{searchQuery}"</p>
        
        {results.map((result: DatasetType) => (
          <Card key={result.id}>
            <CardHeader>
              <CardTitle>{result.title}</CardTitle>
              <CardDescription>{result.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{result.notes?.substring(0, 200)}...</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline" asChild>
                <a href={`https://data.ouka.fi/data/fi/dataset/${result.name}`} target="_blank" rel="noopener noreferrer">
                  View Dataset <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  const renderPropertyPrices = () => {
    if (isLoadingPropertyPrices) return <Spinner />;
    if (propertyPricesError) return <Alert><AlertDescription>Error loading property price data</AlertDescription></Alert>;
    
    const records = propertyPriceData?.records || [];
    
    if (records.length === 0) {
      return <Alert><AlertDescription>No property price data available</AlertDescription></Alert>;
    }
    
    // Create better display names for fields based on Finnish property data
    const getFieldValue = (record: ResourceRecord, fieldNames: string[], defaultValue: string = 'N/A') => {
      for (const field of fieldNames) {
        if (record[field] !== undefined && record[field] !== null) {
          return record[field];
        }
      }
      return defaultValue;
    };
    
    // Extract available fields for summary data
    const allFields = propertyPriceData?.fields || [];
    const fieldNames = allFields.map(f => f.id || '').filter(Boolean);
    
    // Calculate some statistics if we have numerical data
    const getStatSummary = () => {
      try {
        // Find price field
        const priceField = fieldNames.find(f => 
          f.toLowerCase().includes('price') || 
          f.toLowerCase().includes('hinta') || 
          f.toLowerCase().includes('kustannus')
        );
        
        // Find area field
        const areaField = fieldNames.find(f => 
          f.toLowerCase().includes('area') || 
          f.toLowerCase().includes('size') || 
          f.toLowerCase().includes('koko') || 
          f.toLowerCase().includes('ala')
        );
        
        if (!priceField && !areaField) return null;
        
        let avgPrice = 0;
        let minPrice = Infinity;
        let maxPrice = 0;
        let priceCount = 0;
        
        let avgArea = 0;
        let minArea = Infinity;
        let maxArea = 0;
        let areaCount = 0;
        
        // Calculate stats
        records.forEach(record => {
          if (priceField && !isNaN(Number(record[priceField]))) {
            const price = Number(record[priceField]);
            avgPrice += price;
            minPrice = Math.min(minPrice, price);
            maxPrice = Math.max(maxPrice, price);
            priceCount++;
          }
          
          if (areaField && !isNaN(Number(record[areaField]))) {
            const area = Number(record[areaField]);
            avgArea += area;
            minArea = Math.min(minArea, area);
            maxArea = Math.max(maxArea, area);
            areaCount++;
          }
        });
        
        avgPrice = priceCount > 0 ? avgPrice / priceCount : 0;
        avgArea = areaCount > 0 ? avgArea / areaCount : 0;
        
        return { 
          priceField, 
          areaField, 
          avgPrice: avgPrice > 0 ? avgPrice : null,
          minPrice: minPrice < Infinity ? minPrice : null,
          maxPrice: maxPrice > 0 ? maxPrice : null,
          avgArea: avgArea > 0 ? avgArea : null,
          minArea: minArea < Infinity ? minArea : null,
          maxArea: maxArea > 0 ? maxArea : null 
        };
      } catch (error) {
        console.error('Error calculating statistics:', error);
        return null;
      }
    };
    
    const stats = getStatSummary();
    
    return (
      <div className="space-y-8">
        {/* Statistics cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {stats.avgPrice && (
              <Card className="bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-blue-500" />
                    Average Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">€{stats.avgPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: €{stats.minPrice?.toLocaleString(undefined, {maximumFractionDigits: 0})} - 
                    €{stats.maxPrice?.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {stats.avgArea && (
              <Card className="bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <HomeIcon className="h-5 w-5 mr-2 text-green-500" />
                    Average Area
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.avgArea.toLocaleString(undefined, {maximumFractionDigits: 1})} m²</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: {stats.minArea?.toLocaleString(undefined, {maximumFractionDigits: 1})} - 
                    {stats.maxArea?.toLocaleString(undefined, {maximumFractionDigits: 1})} m²
                  </p>
                </CardContent>
              </Card>
            )}
            
            <Card className="bg-purple-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-purple-500" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">Oulu, Finland</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Property data from Oulu region
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Info className="h-5 w-5 mr-2 text-amber-500" />
                  Data Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{records.length} Properties</p>
                <p className="text-xs text-muted-foreground mt-1">
                  From Oulu Open Data Portal
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Property cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {records.slice(0, 6).map((record: ResourceRecord, index: number) => {
            // Try to intelligently determine good field names to display
            const propertyName = getFieldValue(
              record, 
              ['name', 'title', 'property_name', 'location', 'address', 'kohde', 'sijainti', 'osoite'],
              `Property ${index + 1}`
            );
            
            const propertyType = getFieldValue(
              record,
              ['type', 'property_type', 'building_type', 'tyyppi', 'rakennustyyppi', 'käyttötarkoitus'],
              'Residential'
            );
            
            const price = getFieldValue(
              record,
              ['price', 'cost', 'value', 'hinta', 'arvo', 'kustannus'],
              'N/A'
            );
            
            const area = getFieldValue(
              record,
              ['area', 'size', 'floor_area', 'pinta-ala', 'koko', 'neliömäärä'],
              'N/A'
            );
            
            const year = getFieldValue(
              record,
              ['year', 'built_year', 'construction_year', 'vuosi', 'rakennusvuosi'],
              'N/A'
            );
            
            return (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-base">{propertyName}</CardTitle>
                  <CardDescription>{propertyType}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center">
                        <BarChart className="h-4 w-4 mr-2 text-blue-500" />
                        Price:
                      </span>
                      <span className="font-semibold">
                        {isNaN(Number(price)) ? price : `€${Number(price).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center">
                        <HomeIcon className="h-4 w-4 mr-2 text-green-500" />
                        Area:
                      </span>
                      <span>
                        {isNaN(Number(area)) ? area : `${Number(area).toLocaleString()} m²`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Info className="h-4 w-4 mr-2 text-amber-500" />
                        Year:
                      </span>
                      <span>{year}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Data source: Oulu Open Data Portal</p>
          <Button variant="outline" size="sm" asChild>
            <a href="https://data.ouka.fi/data/fi/dataset/oulun-kaupungin-kiinteistojen-perustiedot" target="_blank" rel="noopener noreferrer">
              View Full Dataset <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  };
  
  const renderPointsOfInterest = () => {
    if (isLoadingPoi) return <Spinner />;
    if (poiError) return <Alert><AlertDescription>Error loading points of interest</AlertDescription></Alert>;
    
    const records = poiData?.records || [];
    
    if (records.length === 0) {
      return <Alert><AlertDescription>No points of interest data available</AlertDescription></Alert>;
    }
    
    // Function to get the appropriate icon based on POI type
    const getPoiIcon = () => {
      switch (selectedPoiType) {
        case 'school':
          return <School className="h-8 w-8 text-blue-500" />;
        case 'park':
          return <Palmtree className="h-8 w-8 text-green-500" />;
        case 'hospital':
          return <Stethoscope className="h-8 w-8 text-red-500" />;
        default:
          return <Building className="h-8 w-8 text-gray-500" />;
      }
    };
    
    // Create better display names for fields based on Finnish POI data
    const getFieldValue = (record: ResourceRecord, fieldNames: string[], defaultValue: string = 'N/A') => {
      for (const field of fieldNames) {
        if (record[field] !== undefined && record[field] !== null) {
          return record[field];
        }
      }
      return defaultValue;
    };
    
    // Get human-readable POI type name
    const getPoiTypeName = () => {
      switch (selectedPoiType) {
        case 'school':
          return 'Schools';
        case 'park':
          return 'Parks and Natural Monuments';
        case 'hospital':
          return 'Health Centers';
        default:
          return 'Points of Interest';
      }
    };
    
    // Extract location information from records
    const getLocationCounts = () => {
      const districts = new Map<string, number>();
      
      records.forEach(record => {
        const district = getFieldValue(
          record,
          ['district', 'area', 'region', 'alue', 'kaupunginosa'],
          ''
        );
        
        if (district) {
          districts.set(district, (districts.get(district) || 0) + 1);
        }
      });
      
      return Array.from(districts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    };
    
    const topDistricts = getLocationCounts();
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Select defaultValue={selectedPoiType} onValueChange={handlePoiTypeChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select POI type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="school">Schools</SelectItem>
                <SelectItem value="park">Parks</SelectItem>
                <SelectItem value="hospital">Health Centers</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Showing {records.length} locations</p>
          </div>
          
          {topDistricts.length > 0 && (
            <div className="flex space-x-2">
              {topDistricts.map(([district, count], index) => (
                <div key={index} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-800">
                  {district}: {count}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            {getPoiTypeName()} in Oulu
          </h3>
          <p className="text-sm text-blue-700">
            This data shows {selectedPoiType === 'school' ? 'educational facilities' : 
              selectedPoiType === 'park' ? 'parks and natural monuments' : 
              'health and wellness centers'} located throughout the Oulu region in Finland.
            The data is sourced directly from the official Oulu Open Data Portal.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {records.slice(0, 6).map((record: ResourceRecord, index: number) => {
            // Try to intelligently determine good field names to display
            const poiName = getFieldValue(
              record, 
              ['name', 'title', 'school_name', 'park_name', 'facility_name', 'nimi', 'kohteen_nimi'],
              `${getPoiTypeName().slice(0, -1)} ${index + 1}`
            );
            
            const address = getFieldValue(
              record,
              ['address', 'location', 'street_address', 'osoite', 'katuosoite', 'sijainti'],
              'Oulu region'
            );
            
            // Card background based on POI type
            const cardStyle = selectedPoiType === 'school' ? 'bg-gradient-to-r from-blue-50 to-indigo-50' :
                              selectedPoiType === 'park' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
                              'bg-gradient-to-r from-red-50 to-pink-50';
            
            return (
              <Card key={index} className="overflow-hidden">
                <CardHeader className={`pb-2 ${cardStyle}`}>
                  <div className="flex items-center space-x-3">
                    {getPoiIcon()}
                    <div>
                      <CardTitle className="text-base">{poiName}</CardTitle>
                      <CardDescription>{address}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {/* Try to display relevant fields for each type */}
                    {selectedPoiType === 'school' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Students:</span>
                        <span>
                          {getFieldValue(record, ['student_count', 'students', 'oppilasmäärä'], 'N/A')}
                        </span>
                      </div>
                    )}
                    
                    {selectedPoiType === 'park' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Type:</span>
                        <span>
                          {getFieldValue(record, ['type', 'park_type', 'tyyppi', 'luontotyyppi'], 'Natural area')}
                        </span>
                      </div>
                    )}
                    
                    {selectedPoiType === 'hospital' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Services:</span>
                        <span>
                          {getFieldValue(record, ['services', 'service_type', 'palvelut', 'palvelutyyppi'], 'Healthcare')}
                        </span>
                      </div>
                    )}
                    
                    {/* Common fields for all POI types */}
                    {record.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Phone:</span>
                        <span>{record.phone}</span>
                      </div>
                    )}
                    
                    {record.website && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Website:</span>
                        <a href={record.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          Visit site
                        </a>
                      </div>
                    )}
                    
                    {(record.coordinates || record.lat) && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Coordinates:</span>
                        <span className="text-sm">
                          {record.lat ? `${record.lat}, ${record.lng}` : record.coordinates}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-6 text-center">
          <Button variant="outline" size="sm" asChild className="mr-2">
            <a href="https://data.ouka.fi/data/fi/dataset/" target="_blank" rel="noopener noreferrer">
              View All Datasets <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <a href="https://oulu.fi" target="_blank" rel="noopener noreferrer">
              About Oulu <Info className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Oulu Open Data</h1>
          <p className="text-muted-foreground">Explore real estate and location data from the Oulu Open Data Portal</p>
        </div>
        
        <div className="flex items-center">
          <Button variant="outline" size="sm" asChild className="flex items-center gap-2">
            <a href="https://data.ouka.fi/data/fi/dataset/" target="_blank" rel="noopener noreferrer">
              <Home className="h-4 w-4" />
              <span>Oulu Data Portal</span>
            </a>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="datasets" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="property-prices">Property Prices</TabsTrigger>
          <TabsTrigger value="points-of-interest">Points of Interest</TabsTrigger>
        </TabsList>
        
        <TabsContent value="datasets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Datasets</h2>
            <p className="text-sm text-muted-foreground">
              {datasets?.length || 0} datasets available
            </p>
          </div>
          <Separator />
          {renderDatasetList()}
        </TabsContent>
        
        <TabsContent value="search" className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for datasets (e.g., 'real estate', 'school')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
          
          <div className="mt-6">
            {renderSearchResults()}
          </div>
        </TabsContent>
        
        <TabsContent value="property-prices" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Property Prices in Oulu</h2>
          </div>
          <Separator />
          {renderPropertyPrices()}
        </TabsContent>
        
        <TabsContent value="points-of-interest" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Points of Interest</h2>
          </div>
          <Separator />
          {renderPointsOfInterest()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OuluDataViewer;