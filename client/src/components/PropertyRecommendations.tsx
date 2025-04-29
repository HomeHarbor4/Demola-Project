import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/lib/formatters';

interface PropertyRecommendationsProps {
  propertyId: number;
  limit?: number;
}

export default function PropertyRecommendations({ propertyId, limit = 4 }: PropertyRecommendationsProps) {
  const { t } = useLanguage();
  const { formatPrice: formatCurrencyPrice } = useCurrency();

  const { data: recommendations, isLoading, error } = useQuery<Property[]>({
    queryKey: [`/properties/${propertyId}/recommendations`, { limit }],
    enabled: !!propertyId,
  });

  const formatPrice = (price: number, listingType: string) => {
    const formattedPrice = formatCurrencyPrice(price);
    if (listingType === "rent") {
      return `${formattedPrice}${t('propertyCard.forRentSuffix')}`;
    }
    return formattedPrice;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(limit)].map((_, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
            <Skeleton className="h-32 w-full mb-3 rounded-md" />
            <Skeleton className="h-4 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !recommendations || recommendations.length === 0) {
    return (
      <div className="bg-slate-50 p-4 rounded-lg text-center">
        <p className="text-slate-600">{t('propertyRecommendations.noProperties')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((property) => (
        <Link key={property.id} href={`/property/${property.id}`}>
            <Card className="overflow-hidden h-full cursor-pointer hover:border-primary-300 hover:shadow-md mb-4">
              <div className="relative h-32">
                <img
                  src={property.images?.[0] || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80"}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant={property.listingType === "rent" ? "secondary" : "default"} className="text-xs">
                    {property.listingType === "rent" ? t('propertyCard.forRent') : t('propertyCard.forSale')}
                  </Badge>
                </div>
                {property.verified && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-white/80 text-green-600 border-green-300 text-xs">
                      <i className="ri-shield-check-line mr-1"></i> {t('propertyCard.verified')}
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-base line-clamp-1">{property.title}</h3>
                </div>
                <p className="text-primary-700 font-bold text-sm mb-1">
                  {formatPrice(property.price, property.listingType)}
                </p>
                <p className="text-slate-500 text-xs line-clamp-1 mb-2">
                  <i className="ri-map-pin-line mr-1"></i>
                  {property.address}, {property.city}
                </p>
                <div className="flex text-xs text-slate-600 space-x-3">
                  <span className="flex items-center">
                    <i className="ri-hotel-bed-line mr-1"></i> {t('propertyCard.beds', { count: property.bedrooms })}
                  </span>
                  <span className="flex items-center">
                    <i className="ri-home-8-line mr-1"></i> {property.area} {t('propertyCard.areaUnit')}
                  </span>
                </div>
              </CardContent>
            </Card>
        </Link>
      ))}
    </div>
  );
}