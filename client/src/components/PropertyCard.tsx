import { useState, useEffect } from "react"; // Import useEffect
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { Property } from "@shared/schema";
import FavoriteButton from "./FavoriteButton";
import { useCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Image as ImageIcon } from 'lucide-react'; // Import an icon for fallback
import { useLanguage } from '@/contexts/LanguageContext';

type PropertyCardProps = {
  property: Property;
  onOpenModal?: (property: Property) => void;
};

export default function PropertyCard({ property, onOpenModal }: PropertyCardProps) {
  // Removed local isFavorite state, as FavoriteButton handles its own state via useQuery
  // const [isFavorite, setIsFavorite] = useState(false);

  // --- Image Loading State ---
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  // --- End Image Loading State ---

  // Use the centralized currency formatter
  const { formatPrice: formatCurrencyPrice } = useCurrency();
  const { t } = useLanguage();

  const formatUnsplashUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    // Check if the URL is an Unsplash URL and is truncated
    if (url.includes('unsplash.com/photo-') && !url.includes('?')) {
      // Add parameters for proper display
      return `${url}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
    }
    return url;
  };

  const propertyImage = property.images && property.images.length > 0
    ? formatUnsplashUrl(property.images[0])
    : ""; // Use empty string if no image

  const fallbackImage = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Default fallback

  // --- Reset image state when property changes ---
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [property.id, propertyImage]); // Depend on property ID and the specific image URL
  // --- End Reset ---

  const handleCardClick = () => {
    if (onOpenModal) {
      onOpenModal(property);
    }
  };

  const formatPrice = (price: number, listingType: string) => {
    const formattedPrice = formatCurrencyPrice(price);
    if (listingType === "rent") {
      return `${formattedPrice}${t('propertyCard.forRentSuffix')}`;
    }
    return formattedPrice;
  };

  const getListingAge = (date: Date | string) => {
    try {
      const createdAt = new Date(date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return t('propertyCard.listedToday');
      if (diffDays === 1) return t('propertyCard.listedYesterday');
      if (diffDays < 7) return t('propertyCard.listedDaysAgo', { count: diffDays });
      const weeks = Math.floor(diffDays / 7);
      if (weeks < 4) return t(weeks === 1 ? 'propertyCard.listedWeeksAgo' : 'propertyCard.listedWeeksAgo_plural', { count: weeks });
      const months = Math.floor(diffDays / 30);
      return t(months === 1 ? 'propertyCard.listedMonthsAgo' : 'propertyCard.listedMonthsAgo_plural', { count: months });
    } catch (error) {
      console.error("Error formatting date:", error);
      return t('propertyCard.listedRecently');
    }
  };

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col" // Added h-full and flex flex-col
      onClick={handleCardClick}
    >
      <div className="relative h-48 w-full flex-shrink-0"> {/* Set fixed height and prevent shrinking */}
        {imageLoading && (
          <Skeleton className="absolute inset-0 w-full h-full" /> // Skeleton takes full space
        )}
        {imageError && !imageLoading && (
           // Fallback UI when image fails to load
           <div className="absolute inset-0 w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
             <ImageIcon size={48} />
           </div>
        )}
        <img
          src={propertyImage || fallbackImage} // Use fallback if propertyImage is empty initially
          alt={property.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading || imageError ? 'opacity-0' : 'opacity-100'}`} // Fade in image
          onLoad={() => {
            setImageLoading(false);
            setImageError(false);
          }}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
          // Hide broken image icon if error occurs
          style={{ display: imageError ? 'none' : 'block' }}
        />
        {property.featured && (
          <span className="absolute top-3 left-3 bg-primary-600 text-white px-3 py-1 text-xs font-semibold rounded z-10">
            {t('propertyCard.featured')}
          </span>
        )}
        {property.verified && (
          <span className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 text-xs font-semibold rounded z-10">
            {t('propertyCard.verified')}
          </span>
        )}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton
            propertyId={property.id}
            size="md"
            className="bg-white/80 backdrop-blur-sm shadow"
            // Removed onToggle as local state is removed
          />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow"> {/* Added flex-grow */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">
            {formatPrice(property.price, property.listingType)}
          </h3>
          {/* Removed placeholder rating */}
          {/* <div className="flex items-center text-amber-500"> ... </div> */}
        </div>

        <h4 className="font-medium mb-2 truncate">{property.title}</h4>

        <p className="text-sm text-slate-500 mb-3 flex items-center">
          <i className="ri-map-pin-line mr-1"></i>
          <span className="truncate">{property.address}, {property.city}</span>
        </p>

        <div className="flex justify-between text-sm text-slate-700 mb-4">
          <div className="flex items-center">
            <i className="ri-hotel-bed-line mr-1"></i>
            <span>{property.bedrooms} {t(property.bedrooms === 1 ? 'propertyCard.beds' : 'propertyCard.beds_plural', { count: property.bedrooms })}</span>
          </div>
          <div className="flex items-center">
            <i className="ri-shower-line mr-1"></i>
            <span>{property.bathrooms} {t(property.bathrooms === 1 ? 'propertyCard.baths' : 'propertyCard.baths_plural', { count: property.bathrooms })}</span>
          </div>
          <div className="flex items-center">
            <i className="ri-ruler-line mr-1"></i>
            <span>{property.area} {t('propertyCard.areaUnit')}</span>
          </div>
        </div>

        <div className="border-t pt-3 mt-auto flex justify-between items-center"> {/* Added mt-auto to push to bottom */}
          <div className="flex items-center text-xs text-slate-500">
            <i className="ri-time-line mr-1"></i>
            <span>{getListingAge(property.createdAt)}</span>
          </div>
          <Link href={`/property/${property.id}`}>
            <span className="inline-block">
              <Button variant="link" className="text-sm text-primary-600 font-medium hover:text-primary-700">
                {t('propertyCard.viewDetails')}
              </Button>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
