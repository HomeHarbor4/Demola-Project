// src/pages/MyProperties.tsx
import React, { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Property } from '@shared/schema';
import PropertyCard from '@/components/PropertyCard'; // Assuming this component exists
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Spinner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, PlusCircle } from 'lucide-react';

// Function to fetch user's properties
const fetchUserProperties = async (userId: number): Promise<Property[]> => {
  // Adjust endpoint if needed
  return apiRequest<Property[]>('GET', `/properties/user/${userId}`);
};

export default function MyProperties() {
  const { t } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      console.log('MyProperties Page: Redirecting to /signin');
      setLocation('/signin?redirect=/my-properties'); // Redirect back after login
    }
  }, [user, isAuthLoading, setLocation]);

  // Fetch properties only if user is logged in
  const {
    data: properties,
    isLoading: isPropertiesLoading,
    error,
    refetch
  } = useQuery<Property[], Error>({
    queryKey: ['userProperties', user?.id], // Query key includes user ID
    queryFn: () => fetchUserProperties(user!.id), // Use non-null assertion as enabled checks user
    enabled: !!user && !isAuthLoading, // Only run query if user exists and auth loading is done
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });

  const isLoading = isAuthLoading || (isPropertiesLoading && !!user); // Loading if auth or properties are loading

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

  // If loading is done and still no user (should have been redirected, but safeguard)
  if (!user) {
     return (
       <div className="min-h-screen bg-slate-50">
        <Navbar />
         <div className="container mx-auto px-4 py-10 text-center">
           <p>{t('myProperties.signInPrompt')}</p>
           <Button onClick={() => setLocation('/signin?redirect=/my-properties')} className="mt-4">{t('navbar.signIn')}</Button>
         </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <PageHeader title={t('myProperties.title')} description={t('myProperties.description')}>
        <Link href="/add-property">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> {t('myProperties.listNewProperty')}
          </Button>
        </Link>
      </PageHeader>

      <div className="container mx-auto px-4 py-10">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('myProperties.errorTitle')}</AlertTitle>
            <AlertDescription>
              {error.message || t('myProperties.errorDescription')}
              <Button variant="link" onClick={() => refetch()} className="p-0 h-auto ml-2">{t('myProperties.retry')}</Button>
            </AlertDescription>
          </Alert>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              // Assuming PropertyCard doesn't need onOpenModal here, or pass a relevant function
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">{t('myProperties.noPropertiesTitle')}</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{t('myProperties.noPropertiesDescription')}</p>
            <Link href="/add-property">
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> {t('myProperties.listProperty')}
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
