// src/components/NeighborhoodCard.tsx
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Home, TrendingUp, Users, Footprints, TramFront } from "lucide-react";
import type { Neighborhood } from "@shared/schema";
import { useCurrency } from "@/lib/formatters"; // Import currency formatter

interface NeighborhoodCardProps {
  neighborhood: Neighborhood;
}

export default function NeighborhoodCard({ neighborhood }: NeighborhoodCardProps) {
  const defaultImage = "https://images.unsplash.com/photo-1549877452-9c3e87a491a1?auto=format&fit=crop&q=80&w=800&h=500"; // Generic city image
  const { formatPrice } = useCurrency(); // Use currency hook

  return (
    <Card className="overflow-hidden group h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-48 overflow-hidden">
        <img
          src={neighborhood.image || defaultImage}
          alt={neighborhood.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-4 left-4 text-white">
           <h3 className="text-xl font-bold">{neighborhood.name}</h3>
           <p className="text-sm flex items-center"><MapPin className="w-3 h-3 mr-1"/> {neighborhood.city}</p>
        </div>
      </div>
      <CardContent className="pt-4 flex-grow">
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {neighborhood.description || `Explore the vibrant neighborhood of ${neighborhood.name} in ${neighborhood.city}.`}
        </p>
        {/* Display some stats if available */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {neighborhood.averagePrice && (
            <div className="flex items-center" title="Average Property Price">
              <TrendingUp className="w-4 h-4 mr-1.5 text-green-600 flex-shrink-0" />
              <span className="truncate">~{formatPrice(Number(neighborhood.averagePrice), { maximumFractionDigits: 0 })}</span>
            </div>
          )}
           {neighborhood.populationDensity && (
            <div className="flex items-center" title="Population Density (per km²)">
              <Users className="w-4 h-4 mr-1.5 text-blue-600 flex-shrink-0" />
              <span className="truncate">{neighborhood.populationDensity.toLocaleString()} / km²</span>
            </div>
          )}
           {neighborhood.walkScore && (
            <div className="flex items-center" title="Walk Score">
              <Footprints className="w-4 h-4 mr-1.5 text-orange-600 flex-shrink-0" />
              <span className="truncate">{neighborhood.walkScore}/100</span>
            </div>
          )}
           {neighborhood.transitScore && (
            <div className="flex items-center" title="Transit Score">
              <TramFront className="w-4 h-4 mr-1.5 text-purple-600 flex-shrink-0" />
              <span className="truncate">{neighborhood.transitScore}/100</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardContent className="pt-0">
         {/* Link to properties filtered by this neighborhood */}
         <Link href={`/properties?city=${encodeURIComponent(neighborhood.city)}&neighborhood=${encodeURIComponent(neighborhood.name)}`}>
            <Button variant="outline" className="w-full">
               View Properties in {neighborhood.name}
            </Button>
         </Link>
      </CardContent>
    </Card>
  );
}
