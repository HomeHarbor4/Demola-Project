import { Link } from "wouter";
import { useState, useEffect } from "react"; // Import useState and useEffect
import type { Location } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { MapPin } from 'lucide-react'; // Import an icon for fallback
import { useLanguage } from '@/contexts/LanguageContext';

type LocationCardProps = {
  location: Location;
};

export default function LocationCard({ location }: LocationCardProps) {
  const { t } = useLanguage();
  // --- Image Loading State ---
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  // --- End Image Loading State ---

  const fallbackImages = [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500&q=80",
    "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500&q=80",
    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500&q=80",
    "https://images.unsplash.com/photo-1515263487990-61b07816b324?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500&q=80"
  ];

  // Select a consistent fallback image based on location id
  const fallbackImage = fallbackImages[location.id % fallbackImages.length];
  const locationImage = location.image || fallbackImage; // Use fallback if location.image is null/undefined

  // --- Reset image state when location changes ---
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [location.id, locationImage]); // Depend on location ID and the specific image URL
  // --- End Reset ---

  return (
    <Link href={`/properties?city=${encodeURIComponent(location.city)}&location=${encodeURIComponent(location.name)}`}>
      {/* Updated Link to include location name */}
      <div className="bg-white rounded-lg overflow-hidden shadow-md relative group cursor-pointer h-full"> {/* Added h-full */}
        {/* Image Container */}
        <div className="relative w-full h-56"> {/* Fixed height container */}
          {imageLoading && (
            <Skeleton className="absolute inset-0 w-full h-full" /> // Skeleton takes full space
          )}
          {imageError && !imageLoading && (
            // Fallback UI when image fails to load
            <div className="absolute inset-0 w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
              <MapPin size={48} />
            </div>
          )}
          <img
            src={locationImage} // Use the determined image source
            alt={location.name}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imageLoading || imageError ? 'opacity-0' : 'opacity-100'}`} // Fade in image
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
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-70 transition-opacity duration-300 ${imageLoading || imageError ? 'opacity-0' : 'opacity-70'}`}></div>
        </div>

        {/* Text Content */}
        <div className={`absolute bottom-0 left-0 p-5 text-white transition-opacity duration-300 ${imageLoading || imageError ? 'opacity-0' : 'opacity-100'}`}>
          <h3 className="text-xl font-semibold mb-2">{location.name}</h3>
          <p className="flex items-center text-sm">
            <i className="ri-home-4-line mr-2"></i>
            <span>{t('locationCard.properties', { count: location.propertyCount ?? 0 })}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
