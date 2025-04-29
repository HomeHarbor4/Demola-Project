// src/pages/Favorites.tsx
import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Property } from '@shared/schema'; // Assuming favorites endpoint returns Property[]
import PropertyCard from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Spinner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, HeartOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Function to fetch user's favorite properties
// IMPORTANT: Assumes backend returns full Property objects for favorites
const fetchUserFavorites = async (userId: number): Promise<Property[]> => {
  // Adjust endpoint if needed
  return apiRequest<Property[]>('GET', `/favorites/user/${userId}`);
};

export default function Favorites() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      console.log('Favorites Page: Redirecting to /signin');
      setLocation('/signin?redirect=/favorites'); // Redirect back after login
    }
  }, [user, isAuthLoading, setLocation]);

  // Fetch favorites only if user is logged in
  const {
    data: favoriteProperties,
    isLoading: isFavoritesLoading,
    error,
    refetch
  } = useQuery<Property[], Error>({
    queryKey: ['userFavorites', user?.id], // Query key includes user ID
    queryFn: () => fetchUserFavorites(user!.id),
    enabled: !!user && !isAuthLoading, // Only run query if user exists and auth loading is done
    staleTime: 1000 * 60 * 1, // Cache for 1 minute (favorites might change often)
  });

  const isLoading = isAuthLoading || (isFavoritesLoading && !!user);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner />
        </div>
        <Footer />
      </div>
    );
  }

  // If loading is done and still no user
  if (!user) {
     return (
       <div className="min-h-screen bg-slate-50">
        <Navbar />
         <div className="container mx-auto px-4 py-10 text-center">
           <p>Please sign in to view your favorite properties.</p>
           <Button onClick={() => setLocation('/signin?redirect=/favorites')} className="mt-4">Sign In</Button>
         </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <PageHeader title={t('myFavorites.title')} description={t('myFavorites.description')} />

      <div className="container mx-auto px-4 py-10">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Favorites</AlertTitle>
            <AlertDescription>
              {error.message || "Could not fetch your favorite properties. Please try again."}
              <Button variant="link" onClick={() => refetch()} className="p-0 h-auto ml-2">Retry</Button>
            </AlertDescription>
          </Alert>
        ) : favoriteProperties && favoriteProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed rounded-lg">
             <HeartOff className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">{t('myFavorites.emptyTitle')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('myFavorites.emptyDescription')}</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
