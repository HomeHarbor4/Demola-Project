import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import QuickFilters from "@/components/QuickFilters";
import PropertyCard from "@/components/PropertyCard";
import PropertyCarousel from "@/components/PropertyCarousel";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import LocationCard from "@/components/LocationCard";
import Stats from "@/components/Stats";
import { CallToAction } from "@/components/CallToAction";
import Footer from "@/components/Footer";
import ReseedButton from "@/components/ReseedButton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Property, Location } from "@shared/schema";
import { useLanguage } from '@/contexts/LanguageContext';

// Fix for leaflet icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Home() {
  const { t } = useLanguage();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'map'>("list");
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filterParams, setFilterParams] = useState<Record<string, string>>({});
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]); // Default to Bangalore

  // Fetch featured properties
  const { data: featuredProperties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/properties/featured"],
  });

  // Fetch locations
  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/locations"],
  });
  
  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          
          // Fetch properties near user's location
          // This would typically be a separate API request with lat/lon parameters
          // For now, we'll just update the map center
          console.log(`User location: ${latitude}, ${longitude}`);
        },
        (error) => {
          console.error("Error getting user location:", error);
          // Fall back to default location (Bangalore)
          setMapCenter([12.9716, 77.5946]);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, []);

  // Update filtered properties when the data loads or filters change
  useEffect(() => {
    if (!featuredProperties) return;
    
    // Apply filters here
    let filtered = [...featuredProperties];
    
    if (filterParams.propertyType) {
      filtered = filtered.filter(p => p.propertyType === filterParams.propertyType);
    }
    
    if (filterParams.listingType) {
      filtered = filtered.filter(p => p.listingType === filterParams.listingType);
    }
    
    if (filterParams.minPrice && filterParams.maxPrice) {
      filtered = filtered.filter(p => 
        p.price >= parseInt(filterParams.minPrice) && 
        p.price <= parseInt(filterParams.maxPrice)
      );
    }
    
    if (filterParams.bedrooms) {
      filtered = filtered.filter(p => p.bedrooms >= parseInt(filterParams.bedrooms));
    }
    
    setFilteredProperties(filtered);
    
    // Note: We don't update map center here since we want to keep user's location as center
    // unless they specifically select a property
  }, [featuredProperties, filterParams]);
  
  // Function to calculate distance between two coordinates (haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };
  
  // Sort properties by distance from user's location
  useEffect(() => {
    if (!featuredProperties || !mapCenter) return;
    
    const [userLat, userLng] = mapCenter;
    
    const propertiesWithDistance = featuredProperties
      .filter(p => p.latitude && p.longitude) // Only consider properties with coordinates
      .map(property => {
        const distance = calculateDistance(
          userLat, 
          userLng, 
          property.latitude || 0, 
          property.longitude || 0
        );
        return { ...property, distance };
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Sort by distance
    
    // Take the 16 closest properties
    const nearbyProperties = propertiesWithDistance.slice(0, 16);
    
    // If we have nearby properties, use them as featured
    if (nearbyProperties.length > 0) {
      setFilteredProperties(nearbyProperties);
    }
  }, [featuredProperties, mapCenter]);

  const handleOpenModal = (property: Property) => {
    setSelectedProperty(property);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };
  
  const handleFilterChange = (filters: Record<string, string>) => {
    setFilterParams(filters);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Hero />
      
      {/* Featured Properties Section */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-heading">{t('featuredProperties.sectionTitle')}</h2>
            <div className="flex items-center">
              <Link href="/properties">
                <span className="flex items-center text-sm text-primary-600 font-medium cursor-pointer">
                  <span>{t('featuredProperties.viewAll')}</span>
                  <i className="ri-arrow-right-line ml-1"></i>
                </span>
              </Link>
            </div>
          </div>
          
          {propertiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="col-span-full text-center py-8 text-slate-500">{t('featuredProperties.loading')}</div>
            </div>
          ) : (
            <>
              {/* List View */}
              {activeView === "list" && (
                <div className="px-4 py-2">
                  {(filteredProperties.length > 0 || (featuredProperties && featuredProperties.length > 0)) ? (
                    <PropertyCarousel 
                      properties={filteredProperties.length > 0 ? filteredProperties : (featuredProperties || [])} 
                      onOpenModal={handleOpenModal} 
                    />
                  ) : (
                    <div className="text-center py-8 text-slate-500">{t('featuredProperties.noProperties')}</div>
                  )}
                </div>
              )}
              
              {/* Map View */}
              {activeView === "map" && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: "600px" }}>
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    whenReady={() => {
                      // Map is ready
                    }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* User's current location marker */}
                    {mapCenter && (
                      <Marker 
                        position={mapCenter}
                        icon={L.divIcon({
                          className: "custom-marker-icon",
                          html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);"></div>`,
                          iconSize: [24, 24],
                          iconAnchor: [12, 12]
                        })}
                      >
                        <Popup>
                          <div className="p-1">
                            <h3 className="font-semibold text-sm">Your Location</h3>
                            <p className="text-xs text-slate-600">Properties nearby will be shown first</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* Property markers */}
                    {(filteredProperties.length > 0 ? filteredProperties : (featuredProperties || [])).length > 0 ? (
                      (filteredProperties.length > 0 ? filteredProperties : (featuredProperties || [])).map((property) => (
                        property.latitude && property.longitude ? (
                          <Marker 
                            key={property.id} 
                            position={[property.latitude, property.longitude]}
                          >
                            <Popup>
                              <div className="p-1">
                                <h3 className="font-semibold text-sm">{property.title}</h3>
                                <p className="text-xs text-slate-600">{property.address}</p>
                                <p className="text-sm font-medium mt-1">₹{property.price.toLocaleString()}</p>
                                <button 
                                  className="mt-2 text-xs text-primary-600 hover:underline"
                                  onClick={() => handleOpenModal(property)}
                                >
                                  {t('propertyListings.viewDetails')}
                                </button>
                              </div>
                            </Popup>
                          </Marker>
                        ) : null
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">{t('featuredProperties.noProperties')}</div>
                    )}
                  </MapContainer>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      
      {/* Popular Locations */}
      <section className="py-10 bg-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-3">{t('exploreByLocation.sectionTitle')}</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">{t('exploreByLocation.sectionDescription')}</p>
          </div>
          
          {locationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md animate-pulse">
                  <div className="h-56 bg-slate-200"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {locations?.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link to="/locations">
              <Button variant="outline" className="px-6 py-2.5 bg-white border border-slate-300 rounded-md font-medium text-slate-700 hover:border-primary-600 hover:text-primary-600">
                {t('exploreByLocation.viewAll')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <Stats />
      <CallToAction />
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