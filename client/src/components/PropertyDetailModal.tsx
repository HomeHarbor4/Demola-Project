import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Property } from "@shared/schema";
import L from 'leaflet';
import NearbyPlaces from "./NearbyPlaces";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/lib/formatters";
import FavoriteButton from "./FavoriteButton";
import { useLanguage } from '@/contexts/LanguageContext';

// Fix for leaflet icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type PropertyDetailModalProps = {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
};

// Define the message form schema
const messageFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

// Define a type for NearbyPlace
interface NearbyPlace {
  name: string;
  vicinity: string;
  rating?: number;
  latitude: number;
  longitude: number;
  type: string;
}

export default function PropertyDetailModal({ property, isOpen, onClose }: PropertyDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Use the centralized currency formatter
  const { formatPrice: formatCurrencyPrice } = useCurrency();
  // Get user from auth context
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  
  const formatUnsplashUrl = (url: string) => {
    // Check if the URL is an Unsplash URL and is truncated
    if (url && url.includes('unsplash.com/photo-') && !url.includes('?')) {
      // Add parameters for proper display
      return `${url}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
    }
    return url;
  };
  
  // Format initial main image if it exists
  const initialMainImage = property?.images?.[0] ? formatUnsplashUrl(property.images[0]) : "";
  
  const [mainImage, setMainImage] = useState(initialMainImage);

  // Initialize message form
  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      message: "",
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use apiRequest helper for consistent error handling
      return apiRequest('POST', '/messages', data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the property agent.",
      });
      setShowMessageForm(false);
      messageForm.reset();
    },
    onError: (error: any) => {
      console.error("Error in sendMessageMutation:", error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Handle message form submission
  const onSubmitMessage = async (values: MessageFormValues) => {
    if (!property) return;
    
    // The submit button's disabled state is controlled by mutation.isPending
    
    // Make sure all required fields are present
    if (!values.name || !values.email || !values.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Construct the message data
    const messageData = {
      ...values,
      subject: `Inquiry about ${property.title}`, // Add required subject field
      propertyId: property.id,
      userId: property.userId, // This is the receiver's ID (agent)
      senderUserId: user?.id || null,
    };
    
    console.log("Sending message data:", messageData);
    
    // Let the mutation handle success/error states
    sendMessageMutation.mutate(messageData);
  };

  useEffect(() => {
    // Reset the message form with user data when user or form changes
    if (user) {
      messageForm.reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        message: messageForm.getValues().message,
      });
    }
  }, [user, messageForm]);

  if (!property) return null;

  const handleThumbnailClick = (image: string) => {
    setMainImage(formatUnsplashUrl(image));
  };
  
  const formatPrice = (price: number, listingType: string) => {
    const formattedPrice = formatCurrencyPrice(price);
    if (listingType === "rent") {
      return `${formattedPrice}${t('propertyCard.forRentSuffix')}`;
    }
    return formattedPrice;
  };

  // Custom icons for place types (optional, similar to PropertyDetail)
  const placeTypeIcons: Record<string, L.DivIcon> = {
    restaurant: L.divIcon({
      className: 'custom-div-icon',
      html: '<i class="ri-restaurant-line text-white text-lg"></i>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    }),
    school: L.divIcon({
      className: 'custom-div-icon',
      html: '<i class="ri-school-line text-white text-lg"></i>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    }),
    hospital: L.divIcon({
      className: 'custom-div-icon',
      html: '<i class="ri-hospital-line text-white text-lg"></i>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    }),
    shopping: L.divIcon({
      className: 'custom-div-icon',
      html: '<i class="ri-shopping-cart-line text-white text-lg"></i>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    }),
    park: L.divIcon({
      className: 'custom-div-icon',
      html: '<i class="ri-park-line text-white text-lg"></i>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    }),
    transit: L.divIcon({
      className: 'custom-div-icon',
      html: '<i class="ri-bus-line text-white text-lg"></i>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    }),
    default: L.divIcon({
      className: 'custom-div-icon',
      html: '<i class="ri-map-pin-line text-white text-lg"></i>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    }),
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[80vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex justify-between items-center border-b p-4">
          <DialogTitle className="text-xl font-semibold">{property.title}</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="bg-slate-200 rounded-lg h-80 overflow-hidden">
                <img 
                  src={mainImage || (property.images?.[0] ? formatUnsplashUrl(property.images[0]) : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80")} 
                  alt={property.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              {property.images && property.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {property.images.map((image, index) => (
                    <div 
                      key={index}
                      className="bg-slate-200 rounded-lg overflow-hidden h-20 cursor-pointer"
                      onClick={() => handleThumbnailClick(image)}
                    >
                      <img 
                        src={formatUnsplashUrl(image)} 
                        alt={`${property.title} - Image ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Property Details */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {formatPrice(property.price, property.listingType)}
                  </h3>
                  <p className="text-slate-600 flex items-center">
                    <i className="ri-map-pin-line mr-1"></i>
                    <span>{property.address}, {property.city}</span>
                  </p>
                </div>
                <FavoriteButton
                  propertyId={property.id}
                  size="lg" // Adjust size if needed (lg corresponds roughly to text-xl icon)
                  className="p-2" // Keep padding if desired
                  />
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-100 p-3 rounded-lg">
                  <p className="text-sm text-slate-500">{t('propertyDetailModal.area')}</p>
                  <p className="font-semibold">{property.area} {t('propertyCard.areaUnit')}</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-lg">
                  <p className="text-sm text-slate-500">{t('propertyDetailModal.bedrooms')}</p>
                  <p className="font-semibold">{property.bedrooms} {t(property.bedrooms === 1 ? 'propertyCard.beds' : 'propertyCard.beds_plural', { count: property.bedrooms })}</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-lg">
                  <p className="text-sm text-slate-500">{t('propertyDetailModal.bathrooms')}</p>
                  <p className="font-semibold">{property.bathrooms} {t(property.bathrooms === 1 ? 'propertyCard.baths' : 'propertyCard.baths_plural', { count: property.bathrooms })}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">{t('propertyDetailModal.description')}</h4>
                <p className="text-slate-700">{property.description}</p>
              </div>
              
              {property.features && property.features.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">{t('propertyDetailModal.features')}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <i className="ri-checkbox-circle-line text-green-500 mr-2"></i>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">{t('propertyDetailModal.propertyDetails')}</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <i className="ri-exchange-line text-primary-600 mt-0.5 mr-2"></i>
                    <div>
                      <p className="text-sm font-medium">{t('propertyDetailModal.transactionType')}</p>
                      <p className="text-sm text-slate-600">{property.transactionType || "New"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <i className="ri-building-2-line text-primary-600 mt-0.5 mr-2"></i>
                    <div>
                      <p className="text-sm font-medium">{t('propertyDetailModal.propertyOwnership')}</p>
                      <p className="text-sm text-slate-600">{property.propertyOwnership || "Freehold"}</p>
                    </div>
                  </div>
                  
                  {property.flooringDetails && (
                    <div className="flex items-start">
                      <i className="ri-layout-grid-line text-primary-600 mt-0.5 mr-2"></i>
                      <div>
                        <p className="text-sm font-medium">{t('propertyDetailModal.flooring')}</p>
                        <p className="text-sm text-slate-600">{property.flooringDetails}</p>
                      </div>
                    </div>
                  )}
                  
                  {property.furnishingDetails && (
                    <div className="flex items-start">
                      <i className="ri-sofa-line text-primary-600 mt-0.5 mr-2"></i>
                      <div>
                        <p className="text-sm font-medium">{t('propertyDetailModal.furnishing')}</p>
                        <p className="text-sm text-slate-600">{property.furnishingDetails}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start">
                    <i className="ri-fire-line text-primary-600 mt-0.5 mr-2"></i>
                    <div>
                      <p className="text-sm font-medium">{t('propertyDetailModal.heating')}</p>
                      <p className="text-sm text-slate-600">{property.heatingAvailable ? "Available" : "Not Available"}</p>
                    </div>
                  </div>
                  
                  {property.waterDetails && (
                    <div className="flex items-start">
                      <i className="ri-drop-line text-primary-600 mt-0.5 mr-2"></i>
                      <div>
                        <p className="text-sm font-medium">{t('propertyDetailModal.waterSupply')}</p>
                        <p className="text-sm text-slate-600">{property.waterDetails}</p>
                      </div>
                    </div>
                  )}
                  
                  {property.gasDetails && (
                    <div className="flex items-start">
                      <i className="ri-gas-station-line text-primary-600 mt-0.5 mr-2"></i>
                      <div>
                        <p className="text-sm font-medium">{t('propertyDetailModal.gasConnection')}</p>
                        <p className="text-sm text-slate-600">{property.gasDetails}</p>
                      </div>
                    </div>
                  )}
                  
                  {property.registrationDetails && (
                    <div className="flex items-start">
                      <i className="ri-file-list-3-line text-primary-600 mt-0.5 mr-2"></i>
                      <div>
                        <p className="text-sm font-medium">{t('propertyDetailModal.registration')}</p>
                        <p className="text-sm text-slate-600">{property.registrationDetails}</p>
                      </div>
                    </div>
                  )}
                  
                  {property.averageNearbyPrices && (
                    <div className="flex items-start">
                      <i className="ri-money-dollar-circle-line text-primary-600 mt-0.5 mr-2"></i>
                      <div>
                        <p className="text-sm font-medium">{t('propertyDetailModal.avgNearbyPrice')}</p>
                        <p className="text-sm text-slate-600">{formatCurrencyPrice(property.averageNearbyPrices)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">{t('propertyDetailModal.contact')}</h4>
                <div className="flex items-center space-x-4">
                  {/* --- MODIFIED CALL AGENT BUTTON --- */}
                  {typeof property.ownerDetails === 'object' && property.ownerDetails && 'phone' in property.ownerDetails && property.ownerDetails.phone ? (
                    <a href={`tel:${property.ownerDetails.phone}`} className="flex-1">
                      <Button className="w-full">
                        <i className="ri-phone-line mr-2"></i> {t('propertyDetailModal.callAgent')}
                      </Button>
                    </a>
                  ) : (
                    <Button className="flex-1" disabled>
                      <i className="ri-phone-line mr-2"></i> {t('propertyDetailModal.callAgentNA')}
                    </Button>
                  )}
                  {/* --- END MODIFIED CALL AGENT BUTTON --- */}
                  <Button 
                    variant="outline" 
                    className="flex-1 border-primary-600 text-primary-600 hover:bg-primary-50"
                    onClick={() => setShowMessageForm(!showMessageForm)}
                  >
                    <i className="ri-message-2-line mr-2"></i> {t('propertyDetailModal.messageAgent')}
                  </Button>
                </div>
                
                {showMessageForm && (
                  <div className="mt-4 p-4 border rounded-lg bg-slate-50">
                    <h5 className="text-md font-semibold mb-3">{t('propertyDetailModal.sendMessageTitle')}</h5>
                    <Form {...messageForm}>
                      <form onSubmit={messageForm.handleSubmit(onSubmitMessage)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={messageForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('propertyDetailModal.form.nameLabel')}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t('propertyDetailModal.form.namePlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={messageForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('propertyDetailModal.form.emailLabel')}</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder={t('propertyDetailModal.form.emailPlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={messageForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('propertyDetailModal.form.phoneLabel')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('propertyDetailModal.form.phonePlaceholder')} {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={messageForm.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('propertyDetailModal.form.messageLabel')}</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder={t('propertyDetailModal.form.messagePlaceholder')} 
                                  className="min-h-[100px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowMessageForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={sendMessageMutation.isPending}>
                            {sendMessageMutation.isPending ? (
                              <>
                                <i className="ri-loader-2-line animate-spin mr-2"></i>
                                Sending...
                              </>
                            ) : (
                              <>
                                <i className="ri-send-plane-line mr-2"></i>
                                Send Message
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Map Section */}
          <div className="px-6 pb-6">
            <h4 className="text-lg font-semibold mb-4">Location</h4>
            {property.latitude && property.longitude ? (
              <>
                <div className="h-64 rounded-lg overflow-hidden mb-6">
                  <MapContainer 
                    center={[property.latitude, property.longitude]} 
                    zoom={14} 
                    minZoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      noWrap={true}
                    />
                    <Marker position={[property.latitude, property.longitude]}>
                      <Popup>
                        {property.title}<br />
                        {property.address}
                      </Popup>
                    </Marker>
                    {/* Nearby Places Markers */}
                    {nearbyPlaces
                      .filter(place => Number(place.latitude) && Number(place.longitude))
                      .map((place, index) => (
                        <Marker
                          key={index}
                          position={[Number(place.latitude), Number(place.longitude)]}
                          icon={placeTypeIcons[String(place.type).replace(/s$/, '')] || placeTypeIcons.default}
                        >
                          <Popup>
                            <div>
                              <strong>{place.name}</strong><br />
                              <span>{place.vicinity}</span>
                              {place.rating && <div>⭐ {place.rating}</div>}
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                </div>
                
                {/* Nearby Places Section */}
                <NearbyPlaces latitude={property.latitude} longitude={property.longitude} onPlacesLoaded={setNearbyPlaces} />
              </>
            ) : (
              <div className="h-64 bg-slate-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <i className="ri-map-pin-2-line text-4xl text-slate-500 mb-2"></i>
                  <p className="text-slate-600">Location coordinates not available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
