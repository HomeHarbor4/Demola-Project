import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, Search } from "lucide-react";
import { Location } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LocationCard from "@/components/LocationCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LocationsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all locations
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['/locations'],
    queryFn: async () => {
      const response = await fetch('/locations');
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      return response.json();
    }
  });

  // Filter locations based on search query
  const filteredLocations = React.useMemo(() => {
    if (!locations) return [];
    if (!searchQuery.trim()) return locations;
    
    return locations.filter((location: Location) => 
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [locations, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Explore All Locations</h1>
            <p className="text-xl md:max-w-2xl mb-8">
              Discover properties in the most sought-after neighborhoods and find your perfect home.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Input
                type="text"
                placeholder="Search locations..."
                className="pl-10 bg-white/90 text-slate-900 border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
            </div>
          </div>
        </section>
        
        {/* Locations Grid */}
        <section className="py-12 bg-slate-50">
          <div className="container mx-auto px-4">
            {locationsLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLocations?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredLocations.map((location: Location) => (
                  <LocationCard key={location.id} location={location} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-slate-700 mb-4">No locations found</h3>
                <p className="text-slate-600 mb-6">Try adjusting your search criteria</p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
        
        {/* Back to Home */}
        <section className="py-10">
          <div className="container mx-auto px-4 text-center">
            <Link to="/">
              <Button variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}