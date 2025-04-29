import { useEffect, useState } from "react"; // Import useState
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter"; // Import Link
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyRecommendations from "@/components/PropertyRecommendations";
import NearbyPlaces from "@/components/NearbyPlaces";
import { Button } from "@/components/ui/button";
import type { Property } from "@shared/schema";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest
import { Spinner } from "@/components/Spinner"; // Import Spinner
import { Alert, AlertDescription } from "@/components/ui/alert"; // Import Alert
import FavoriteButton from "@/components/FavoriteButton"; // Import FavoriteButton
import { useCurrency } from "@/lib/formatters"; // Import useCurrency
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { MessageForm } from "@/components/MessageForm"; // Assuming MessageForm exists
import { useLanguage } from '@/contexts/LanguageContext';
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import { X } from "lucide-react";
import CrimeRateSection from '@/components/CrimeRateSection';
import { getMunicipalityCode } from '@shared/municipalityCodes';

// Fix for default marker icons not showing in Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Add DetailItem component
const DetailItem = ({ label, value, icon }: { label: string; value: string | number; icon: string }) => (
  <div className="flex items-center gap-2">
    <i className={`${icon} text-primary`}></i>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

// Add type for owner details
interface OwnerDetails {
  name: string;
  email: string;
  phone: string;
  userId: string;
}

// Extend Property type to include ownerDetails
interface PropertyWithOwner extends Property {
  ownerDetails: OwnerDetails;
  location: {
    municipalityCode: string;
  };
}

// Add custom icons for different place types
const createCustomIcon = (iconName: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<i class="${iconName} text-white text-lg"></i>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const placeTypeIcons = {
  restaurant: createCustomIcon('ri-restaurant-line'),
  school: createCustomIcon('ri-school-line'),
  hospital: createCustomIcon('ri-hospital-line'),
  shopping: createCustomIcon('ri-shopping-cart-line'),
  park: createCustomIcon('ri-park-line'),
  transit: createCustomIcon('ri-bus-line'),
  default: createCustomIcon('ri-map-pin-line'),
};

// Simple Modal component (if you don't have one already)
function SimpleModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-0 relative overflow-hidden" style={{ maxHeight: "90vh" }}>
        <button
          className="absolute top-3 right-3 text-slate-400 hover:text-primary-600 text-2xl transition"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={28} />
        </button>
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "80vh" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function CulturalAttractionsSection({ lat, lng }: { lat: number; lng: number }) {
  const [radius, setRadius] = useState(3); // default 3km
  const [attractions, setAttractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    slides: { perView: 1, spacing: 1 },
    loop: true
  });
  const [selectedAttraction, setSelectedAttraction] = useState<any | null>(null);

  const radiusOptions = [1, 3, 5, 7, 10];

  useEffect(() => {
    if (!lat || !lng) return;
    setLoading(true);
    apiRequest("GET", `/attractions/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
      .then(setAttractions)
      .finally(() => setLoading(false));
  }, [lat, lng, radius]);

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Cultural & Natural Attractions Nearby</h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        {radiusOptions.map((r) => (
          <button
            key={r}
            className={`px-4 py-2 rounded-full border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400
              ${radius === r
                ? "bg-primary text-white border-primary-600 shadow"
                : "bg-white text-primary-700 border-slate-300 hover:bg-primary-50 hover:border-primary-400"}
            `}
            style={{ minWidth: 60 }}
            onClick={() => setRadius(r)}
            aria-pressed={radius === r}
          >
            {r} km
          </button>
        ))}
      </div>
      {!loading && attractions.length > 0 && (
        <div className="mb-2 text-sm text-slate-600">{attractions.length} attraction{attractions.length !== 1 ? 's' : ''} found within {radius}km</div>
      )}
      {loading ? (
        <div className="py-8 text-center">Loading nearby cultural and natural attractions...</div>
      ) : attractions.length === 0 ? (
        <div className="py-8 text-center text-slate-500">No attractions found within {radius}km.</div>
      ) : (
        <div className="relative">
          {/* Carousel navigation buttons */}
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-primary-100 border border-slate-300 rounded-full w-8 h-8 flex items-center justify-center shadow transition disabled:opacity-50"
            style={{ marginLeft: -20 }}
            onClick={() => slider.current?.prev()}
            aria-label="Scroll left"
            disabled={attractions.length <= 1}
          >
            <span className="sr-only">Previous</span>
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M13 15l-5-5 5-5" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div
            ref={sliderRef}
            className="keen-slider"
            style={{ height: 200, minHeight: 180, maxHeight: 220, display: 'flex', alignItems: 'center' }}
          >
            {attractions.map((attr) => (
              <div
                key={attr.id}
                className="keen-slider__slide bg-white rounded-xl shadow p-4 flex gap-4 items-center transition hover:shadow-lg"
                style={{ height: '180px', minHeight: '180px', maxHeight: '200px' }}
              >
                {attr.image && (
                  <img src={attr.image} alt={attr.title} className="w-20 h-20 object-cover rounded-lg border" />
                )}
                <div className="flex-1 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate">{attr.title}</h3>
                    {attr.type && (
                      <span className="ml-2 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">{attr.type}</span>
                    )}
                  </div>
                  <div
                    className="prose text-xs text-slate-700 line-clamp-2 flex-1"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    dangerouslySetInnerHTML={{ __html: attr.content || "" }}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      className="text-primary-600 underline text-xs font-medium"
                      onClick={() => setSelectedAttraction(attr)}
                    >
                      Read more
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-primary-100 border border-slate-300 rounded-full w-8 h-8 flex items-center justify-center shadow transition disabled:opacity-50"
            style={{ marginRight: -20 }}
            onClick={() => slider.current?.next()}
            aria-label="Scroll right"
            disabled={attractions.length <= 1}
          >
            <span className="sr-only">Next</span>
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M7 5l5 5-5 5" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}
      {/* Modal for full details */}
      <SimpleModal open={!!selectedAttraction} onClose={() => setSelectedAttraction(null)}>
        {selectedAttraction && (
          <div>
            <h2 className="text-2xl font-bold mb-3">{selectedAttraction.title}</h2>
            {selectedAttraction.image && (
              <img src={selectedAttraction.image} alt={selectedAttraction.title} className="w-full h-56 object-cover rounded-lg mb-4" />
            )}
            <hr className="my-3" />
            <div
              className="prose text-sm mb-2"
              dangerouslySetInnerHTML={{ __html: selectedAttraction.content || "" }}
            />
            <div className="flex items-center justify-between mt-4 gap-2">
              {selectedAttraction.url ? (
                <a href={selectedAttraction.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                  More info
                </a>
              ) : <span />}
              <button className="px-4 py-2 bg-primary text-white rounded" onClick={() => setSelectedAttraction(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </SimpleModal>
    </section>
  );
}

export default function PropertyDetail() {
  const params = useParams(); // Use wouter's useParams
  const propertyId = params.id ? parseInt(params.id, 10) : null; // Extract and parse ID
  const [mainImage, setMainImage] = useState("");
  const [showContactForm, setShowContactForm] = useState(false); // State for message form
  const { formatPrice: formatCurrencyPrice } = useCurrency(); // Use currency formatter
  const { user } = useAuth(); // Get user from context
  const { t } = useLanguage();

  // Fetch property details using React Query
  const { data: property, isLoading, error } = useQuery<PropertyWithOwner>({
    queryKey: ['/properties', propertyId], // Use array key with ID
    queryFn: () => apiRequest<PropertyWithOwner>('GET', `/properties/${propertyId}`), // Use apiRequest
    enabled: !!propertyId, // Only fetch if propertyId is valid
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  // Add state for nearby places
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);

  useEffect(() => {
    if (property?.images && property.images.length > 0) {
      setMainImage(formatUnsplashUrl(property.images[0])); // Format URL
    } else {
      setMainImage(""); // Reset if no images
    }
  }, [property]);

  const handleThumbnailClick = (image: string) => {
    setMainImage(formatUnsplashUrl(image)); // Format URL on click
  };

  // --- Moved formatters outside conditional rendering ---
  const formatUnsplashUrl = (url: string | null | undefined): string => {
    if (url && url.includes('unsplash.com/photo-') && !url.includes('?')) {
      return `${url}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80`;
    }
    return url || "";
  };

  const formatPrice = (price: number | undefined, listingType: string | undefined) => {
    if (price === undefined || price === null) return "Price not available";

    const formattedPrice = formatCurrencyPrice(price); // Use the hook

    if (listingType === "rent") {
      return `${formattedPrice}/mo`;
    }
    return formattedPrice;
  };
  // --- End formatters ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto p-8 flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" /> {/* Use Spinner component */}
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
           <Alert variant="destructive" className="max-w-lg mx-auto mb-8">
             <AlertDescription>
               {error instanceof Error ? error.message : 'Could not load property details or property not found.'}
             </AlertDescription>
           </Alert>
          <Link href="/properties">
             <Button variant="outline">Back to Listings</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // --- Main Render ---
  const defaultImageUrl = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80";
  const displayImage = mainImage || formatUnsplashUrl(property.images?.[0]) || defaultImageUrl;
  const agentPhoneNumber = property?.ownerDetails?.phone || '';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header Section (Remains the same) */}
        <div className="mb-8">
          {/* ... Header content ... */}
           <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h1>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
             <p className="text-slate-600 flex items-center text-lg mb-2 md:mb-0">
                <i className="ri-map-pin-line mr-1"></i>
                <span>{property.address}, {property.city}</span>
             </p>
             <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-primary-600">
                   {formatPrice(property.price, property.listingType)}
                </span>
                <FavoriteButton propertyId={property.id} size="lg" />
             </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Details, Map, etc.) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            {/* ... Image Gallery content ... */}
             <div className="bg-white rounded-lg overflow-hidden shadow-md">
              <img
                src={displayImage}
                alt={property.title}
                className="w-full h-[400px] object-cover"
              />
              {/* Thumbnails */}
              {property.images && property.images.length > 1 && (
                <div className="p-4 grid grid-cols-6 gap-2">
                  {property.images.map((image, index) => (
                    <div
                      key={index}
                      className={`rounded-md overflow-hidden cursor-pointer border-2 ${
                        formatUnsplashUrl(image) === mainImage ? 'border-primary-500' : 'border-transparent'
                      }`}
                      onClick={() => handleThumbnailClick(image)}
                    >
                      <img
                        src={formatUnsplashUrl(image)}
                        alt={`${property.title} - Image ${index + 1}`}
                        className="w-full h-16 object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Details Row */}
            {/* ... Key Details content ... */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-4 rounded-lg shadow text-center">
                  <p className="text-sm text-slate-500">Area</p>
                  <p className="font-semibold text-lg">{property.area} sq.ft</p>
               </div>
               <div className="bg-white p-4 rounded-lg shadow text-center">
                  <p className="text-sm text-slate-500">Bedrooms</p>
                  <p className="font-semibold text-lg">{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</p>
               </div>
               <div className="bg-white p-4 rounded-lg shadow text-center">
                  <p className="text-sm text-slate-500">Bathrooms</p>
                  <p className="font-semibold text-lg">{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</p>
               </div>
               <div className="bg-white p-4 rounded-lg shadow text-center">
                  <p className="text-sm text-slate-500">Type</p>
                  <p className="font-semibold text-lg capitalize">{property.propertyType.replace(/_/g, ' ')}</p>
               </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">{t('propertyDetailModal.description')}</h2>
              <p className="text-slate-600">{property.description}</p>
            </div>

            {/* Features */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">{t('propertyDetailModal.features')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property?.features?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-primary"></i>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Details Table */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">{t('propertyDetailModal.propertyDetails')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                 <DetailItem label={t('propertyDetailModal.transactionType')} value={property?.transactionType || "N/A"} icon="ri-exchange-line" />
                 <DetailItem label={t('propertyDetailModal.propertyOwnership')} value={property?.propertyOwnership || "N/A"} icon="ri-building-2-line" />
                 {property?.flooringDetails && <DetailItem label={t('propertyDetailModal.flooring')} value={property.flooringDetails} icon="ri-layout-grid-line" />}
                 {property?.furnishingDetails && <DetailItem label={t('propertyDetailModal.furnishing')} value={property.furnishingDetails} icon="ri-home-gear-line" />}
                 <DetailItem label={t('propertyDetailModal.heating')} value={property?.heatingAvailable ? t('propertyDetailModal.available') : t('propertyDetailModal.notAvailable')} icon="ri-fire-line" />
                 {property?.waterDetails && <DetailItem label={t('propertyDetailModal.waterSupply')} value={property.waterDetails} icon="ri-drop-line" />}
              </div>
            </div>

            {/* Map Section */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              {property.latitude && property.longitude ? (
                <>
                  <div className="h-80 rounded-lg overflow-hidden mb-6">
                    <MapContainer
                      center={[Number(property.latitude), Number(property.longitude)]}
                      zoom={14}
                      style={{ height: '100%', width: '100%', zIndex: 0 }}
                      minZoom={3}
                      maxZoom={18}
                      maxBounds={[[-90, -180], [90, 180]]}
                      maxBoundsViscosity={1.0}
                      bounds={nearbyPlaces.length > 0 ? 
                        L.latLngBounds(
                          nearbyPlaces.map(place => [Number(place.latitude), Number(place.longitude)] as L.LatLngTuple)
                            .concat([[Number(property.latitude), Number(property.longitude)] as L.LatLngTuple])
                        ).pad(0.1) : undefined
                      }
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        noWrap={true}
                      />
                      {/* Property Marker */}
                      <Marker 
                        position={[Number(property.latitude), Number(property.longitude)]}
                        icon={L.divIcon({
                          className: 'property-div-icon',
                          html: '<i class="ri-home-5-line text-white text-lg"></i>',
                          iconSize: [30, 30],
                          iconAnchor: [15, 15],
                          popupAnchor: [0, -15],
                        })}
                      >
                        <Popup>
                          <div className="text-center">
                            <strong>{property.title}</strong><br />
                            {property.address}
                          </div>
                        </Popup>
                      </Marker>

                      {/* Nearby Places Markers */}
                      {nearbyPlaces.map((place, index) => (
                        <Marker
                          key={index}
                          position={[Number(place.latitude), Number(place.longitude)]}
                          icon={placeTypeIcons[place.type as keyof typeof placeTypeIcons] || placeTypeIcons.default}
                        >
                          <Popup>
                            <div className="text-center">
                              <strong>{place.name}</strong><br />
                              <span className="text-sm text-slate-600">{place.address}</span><br />
                              {place.distance && (
                                <span className="text-xs text-slate-500">
                                  {place.distance.toFixed(1)} km away
                                </span>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                  {/* Nearby Places */}
                  <NearbyPlaces 
                    latitude={Number(property.latitude)} 
                    longitude={Number(property.longitude)}
                    onPlacesLoaded={(places) => setNearbyPlaces(places)}
                  />
                </>
              ) : (
                <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center text-center">
                  <div>
                    <i className="ri-map-pin-off-line text-4xl text-slate-400 mb-2"></i>
                    <p className="text-slate-500">Map location not available.</p>
                  </div>
                </div>
              )}
            </div>

            {property.latitude && property.longitude && (
              <CulturalAttractionsSection lat={Number(property.latitude)} lng={Number(property.longitude)} />
            )}

            {/* Crime Rate Section */}
            <CrimeRateSection city={property.city} />
          </div>

          {/* Right Column (Agent Info ONLY) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Agent/Owner Info Card */}
            <div className="bg-white p-6 rounded-lg shadow sticky top-24">
              <h2 className="text-xl font-semibold mb-4">{t('propertyDetailModal.contact')}</h2>
              {property?.ownerDetails ? (
                <div className="flex items-center space-x-4 mb-4">
                  {/* Agent Avatar */}
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-primary-600">
                    {property.ownerDetails.name ? property.ownerDetails.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <p className="font-semibold">{property.ownerDetails.name || 'Agent/Owner'}</p>
                    <p className="text-sm text-slate-500">{property.ownerDetails.email || 'Email not available'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mb-4">Contact details not provided.</p>
              )}

              {/* Contact Buttons */}
              <div className="space-y-3">
                {agentPhoneNumber ? (
                  <a href={`tel:${agentPhoneNumber}`} className="block">
                    <Button className="w-full">
                      <i className="ri-phone-line mr-2"></i> {t('propertyDetailModal.callAgent')}
                    </Button>
                  </a>
                ) : (
                  <Button className="w-full" disabled>
                    <i className="ri-phone-line mr-2"></i> {t('propertyDetailModal.callAgentNA')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!user || !property?.ownerDetails?.userId}
                  title={!user ? "Please log in to send a message" : !property?.ownerDetails?.userId ? "Agent details unavailable" : ""}
                  onClick={() => setShowContactForm(true)}
                >
                  <i className="ri-message-2-line mr-2"></i> {t('propertyDetailModal.messageAgent')}
                </Button>
              </div>

              {/* Conditionally render the message form */}
              {showContactForm && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-3">Send Inquiry</h3>
                  <MessageForm
                    property={property}
                    onClose={() => setShowContactForm(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">{t('propertyDetail.similarProperties')}</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <PropertyRecommendations propertyId={property.id} limit={4} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Add CSS for custom icons
const styles = `
  .custom-div-icon {
    background-color: #3b82f6;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .property-div-icon {
    background-color: #ef4444;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

// Add styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);