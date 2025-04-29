import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import type { Property } from "@shared/schema";

export default function SearchTest() {
  const [filters, setFilters] = useState({
    city: "",
    propertyType: "",
    listingType: "",
    bedrooms: "",
    bathrooms: "",
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    amenities: [] as string[],
    lat: "",
    lng: "",
    radius: "5"
  });

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const buildQueryString = () => {
    const queryParams = new URLSearchParams();
    
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.propertyType) queryParams.append("propertyType", filters.propertyType);
    if (filters.listingType) queryParams.append("listingType", filters.listingType);
    if (filters.bedrooms) queryParams.append("bedrooms", filters.bedrooms);
    if (filters.bathrooms) queryParams.append("bathrooms", filters.bathrooms);
    if (filters.minPrice) queryParams.append("minPrice", filters.minPrice);
    if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);
    if (filters.minArea) queryParams.append("minArea", filters.minArea);
    if (filters.maxArea) queryParams.append("maxArea", filters.maxArea);
    if (filters.amenities.length > 0) queryParams.append("amenities", filters.amenities.join(','));
    
    // Add geolocation parameters
    if (filters.lat && filters.lng) {
      queryParams.append("lat", filters.lat);
      queryParams.append("lng", filters.lng);
      queryParams.append("radius", filters.radius);
    }
    
    return queryParams.toString();
  };

  const { data: propertiesData, isLoading, refetch } = useQuery<{properties: Property[], total: number}>({
    queryKey: ['/properties', filters],
    queryFn: async () => {
      const queryString = buildQueryString();
      const response = await fetch(`/properties?${queryString}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      // API returns an object with properties and total count
      return data;
    },
    // Don't fetch on mount, wait for manual search
    enabled: false
  });
  
  // Extract the properties array from the response
  const properties = propertiesData?.properties || [];

  const handleInputChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFilters(prev => {
      const amenities = [...prev.amenities];
      if (amenities.includes(amenity)) {
        return { ...prev, amenities: amenities.filter(a => a !== amenity) };
      } else {
        return { ...prev, amenities: [...amenities, amenity] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleOpenModal = (property: Property) => {
    setSelectedProperty(property);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Use Bangalore as default location for testing
  const setBangaloreLocation = () => {
    setFilters(prev => ({
      ...prev,
      lat: "12.9716",
      lng: "77.5946",
      radius: "5"
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Advanced Search Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={filters.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <Select 
                  value={filters.propertyType}
                  onValueChange={(value) => handleInputChange('propertyType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="listingType">Listing Type</Label>
                <Select 
                  value={filters.listingType}
                  onValueChange={(value) => handleInputChange('listingType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Listing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Select 
                    value={filters.bedrooms}
                    onValueChange={(value) => handleInputChange('bedrooms', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Beds" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Select 
                    value={filters.bathrooms}
                    onValueChange={(value) => handleInputChange('bathrooms', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Baths" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minPrice">Min Price</Label>
                  <Input
                    id="minPrice"
                    placeholder="Min"
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleInputChange('minPrice', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxPrice">Max Price</Label>
                  <Input
                    id="maxPrice"
                    placeholder="Max"
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minArea">Min Area (sqft)</Label>
                  <Input
                    id="minArea"
                    placeholder="Min"
                    type="number"
                    value={filters.minArea}
                    onChange={(e) => handleInputChange('minArea', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxArea">Max Area (sqft)</Label>
                  <Input
                    id="maxArea"
                    placeholder="Max"
                    type="number"
                    value={filters.maxArea}
                    onChange={(e) => handleInputChange('maxArea', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Swimming Pool", "Gym", "Parking", "Security", "Balcony", "Garden"].map(amenity => (
                    <div key={amenity} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`amenity-${amenity}`}
                        checked={filters.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="mr-2"
                      />
                      <label htmlFor={`amenity-${amenity}`} className="text-sm">{amenity}</label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <div className="flex justify-between items-center">
                  <Label>Geolocation Search</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={setBangaloreLocation}
                  >
                    Use Bangalore
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      placeholder="Latitude"
                      value={filters.lat}
                      onChange={(e) => handleInputChange('lat', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      placeholder="Longitude"
                      value={filters.lng}
                      onChange={(e) => handleInputChange('lng', e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Label htmlFor="radius">Search Radius: {filters.radius} km</Label>
                  <Slider
                    id="radius"
                    min={1}
                    max={20}
                    step={1}
                    value={[parseInt(filters.radius) || 5]}
                    onValueChange={(values) => handleInputChange('radius', values[0].toString())}
                    className="mt-2"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">Search Properties</Button>
            </form>
          </div>
          
          {/* Results */}
          <div className="lg:col-span-3">
            <div className="mb-4">
              {!isLoading && properties && (
                <h2 className="text-xl font-semibold">{properties.length} Properties Found</h2>
              )}
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md animate-pulse">
                    <div className="h-48 bg-slate-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded w-5/6 mb-4"></div>
                      <div className="h-10 bg-slate-200 rounded mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                    onOpenModal={handleOpenModal}
                  />
                ))}
              </div>
            ) : (
              properties && (
                <div className="text-center py-16 bg-white rounded-lg shadow-md">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No properties found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria to find more properties.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Property Detail Modal */}
      <PropertyDetailModal 
        property={selectedProperty}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}