// src/pages/Neighborhoods.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Neighborhood } from "@shared/schema";
import NeighborhoodCard from "@/components/NeighborhoodCard"; // Import the new card

export default function NeighborhoodsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch active neighborhoods from the backend API
  const { data: neighborhoods, isLoading, error } = useQuery<Neighborhood[]>({
    queryKey: ['/neighborhoods', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      const queryString = params.toString();
      const url = `/neighborhoods${queryString ? `?${queryString}` : ''}`;
      console.log(`[Neighborhoods] Fetching from: ${url}`); // Optional: Add log

      // --- Add 'GET' method ---
      const response = await apiRequest<Neighborhood[]>('GET', url);
      console.log(`[Neighborhoods] Received ${response?.length ?? 0} neighborhoods`); // Optional: Add log

      return response;
    },
    staleTime: 1000 * 60 * 5,
    // enabled: true, // Ensure this is true or removed (default is true)
  });

  // Data to display is directly from the query result
  const neighborhoodsToDisplay = neighborhoods || [];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array(6).fill(0).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="h-48 bg-slate-200"></div>
              <CardContent className="pt-4 space-y-3">
                <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
                <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                <div className="h-10 w-full bg-slate-200 rounded mt-4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg">
          Error loading neighborhoods: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      );
    }

    if (neighborhoodsToDisplay.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <Search className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="mt-2 text-lg font-medium text-slate-900">No neighborhoods found</h3>
          <p className="mt-1 text-slate-500">Try adjusting your search terms or check back later.</p>
          {searchTerm && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSearchTerm("")} // Clear search term triggers refetch via queryKey change
            >
              Clear Search
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {neighborhoodsToDisplay.map((neighborhood) => (
          <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <PageHeader
        title="Explore Neighborhoods"
        description="Discover the perfect neighborhood for your lifestyle, powered by real data."
      />

      <main className="flex-grow container mx-auto px-4 py-12">
        {/* Search Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-10 max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search neighborhood name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            </div>
            {/* Search button is optional if query refetches on searchTerm change */}
            {/* <Button onClick={() => refetch()} disabled={isLoading}>...</Button> */}
          </div>
        </div>

        {/* Neighborhood Grid */}
        {renderContent()}
      </main>

      <Footer />
    </div>
  );
}
