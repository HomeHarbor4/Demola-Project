// src/components/Hero.tsx

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Home, DollarSign, BedDouble, Bath, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext'; // Import useSiteSettings
import type { Location } from '@shared/schema';

// --- Updated Property Types ---
const propertyTypes = [
  { value: 'house', label: 'house' },
  { value: 'villa', label: 'villa' },
  { value: 'townhouse', label: 'townhouse' },
  { value: 'penthouse', label: 'penthouse' },
  { value: 'condo', label: 'condo' },
  { value: 'apartment', label: 'apartment' },
  { value: 'studio', label: 'studio' },
  { value: 'commercial', label: 'commercial' },
  { value: 'land', label: 'land' },
  { value: 'cottage', label: 'cottage' },
  { value: 'office', label: 'office' }
];

// --- Function to fetch locations ---
const fetchLocations = async (): Promise<Location[]> => {
  return apiRequest<Location[]>('GET', '/locations');
};

const Hero: React.FC = () => {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const { settings } = useSiteSettings(); // Get site settings

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  // Store the selected location NAME (or 'all')
  const [selectedLocationName, setSelectedLocationName] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [beds, setBeds] = useState('all');
  const [baths, setBaths] = useState('all');

  // Fetch locations
  const { data: locationsData, isLoading: isLoadingLocations, error: locationsError } = useQuery<Location[], Error>({
    queryKey: ['locations'],
    queryFn: fetchLocations,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const handleSearch = () => {
    const queryParams = new URLSearchParams();
    if (searchTerm.trim()) queryParams.set('search', searchTerm.trim());

    // --- FIX: Find the selected location object to get the city ---
    if (selectedLocationName && selectedLocationName !== 'all' && locationsData) {
      const selectedLoc = locationsData.find(loc => loc.name === selectedLocationName);
      if (selectedLoc) {
        queryParams.set('city', selectedLoc.city);
        queryParams.set('location', selectedLoc.name);
      } else {
        console.warn(`Selected location name "${selectedLocationName}" not found in fetched data.`);
      }
    }

    // --- FIX: Properly handle property type filter ---
    if (propertyType && propertyType !== 'all') {
      queryParams.set('propertyType', propertyType);
    }

    if (minPrice) queryParams.set('minPrice', minPrice);
    if (maxPrice) queryParams.set('maxPrice', maxPrice);
    if (beds && beds !== 'all') queryParams.set('bedrooms', beds);
    if (baths && baths !== 'all') queryParams.set('bathrooms', baths);

    console.log("Navigating with params:", queryParams.toString());
    navigate(`/properties?${queryParams.toString()}`);
  };

  const handleNumericInput = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    // Allow only digits
    if (/^\d*$/.test(value)) setter(value);
  };

  // --- Get background image URL from settings or use fallback ---
  const fallbackHeroImageUrl = "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80";
  // Assuming the setting key is 'heroImageUrl' in your SiteSettings schema
  const heroImageUrl = settings.heroImageUrl || fallbackHeroImageUrl;
  // --- End background image logic ---

  return (
    // --- Updated div with background image from settings or fallback ---
    <div
      className="relative bg-cover bg-center text-white py-20 md:py-32 px-4"
      style={{ backgroundImage: `url(${heroImageUrl})` }} // Apply the dynamic URL
    >
      {/* --- Adjusted overlay for better readability over image --- */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>

      <div className="container mx-auto relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-heading animate-fade-in-up drop-shadow-md">
          {/* Use translation if siteTitle is missing, empty, or a translation key */}
          {(!settings.siteTitle || settings.siteTitle === 'hero.title') ? t('hero.title') : settings.siteTitle}
        </h1>
        <p className="text-lg md:text-xl text-slate-100 mb-10 max-w-3xl mx-auto animate-fade-in-up animation-delay-200 drop-shadow">
          {/* Use translation if siteDescription is missing, empty, or a translation key */}
          {(!settings.siteDescription || settings.siteDescription === 'hero.subtitle') ? t('hero.subtitle') : settings.siteDescription}
        </p>

        <Card className="max-w-5xl mx-auto shadow-xl animate-fade-in-up animation-delay-400">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Search Term */}
              <div className="lg:col-span-2">
                <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  {t('hero.searchTermLabel')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="search-term"
                    type="text"
                    placeholder={t('hero.searchTermPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 text-base"
                  />
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  {t('hero.locationLabel')}
                </label>
                {/* Use selectedLocationName for the Select value */}
                <Select value={selectedLocationName} onValueChange={setSelectedLocationName} disabled={isLoadingLocations || !!locationsError}>
                  <SelectTrigger className="h-11 text-base">
                    <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                    <SelectValue placeholder={isLoadingLocations ? t('hero.loadingLocations') : t('hero.allLocations')} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingLocations ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('hero.loadingLocations')}
                      </div>
                    ) : locationsError ? (
                       <SelectItem value="all" disabled>{t('hero.errorLoadingLocations')}</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="all">{t('hero.allLocations')}</SelectItem>
                        {/* Set the value to loc.name */}
                        {locationsData?.map((loc) => (
                          <SelectItem key={loc.id} value={loc.name}>
                            {loc.name} ({loc.city})
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                 {locationsError && <p className="text-xs text-red-600 mt-1 text-left">{t('hero.couldNotLoadLocations')}</p>}
              </div>

              {/* Property Type Filter */}
              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  {t('hero.propertyTypeLabel')}
                </label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="h-11 text-base">
                    <Home className="h-5 w-5 text-gray-400 mr-2" />
                    <SelectValue placeholder={t('hero.allTypes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('hero.allTypes')}</SelectItem>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {t(`propertyType.${type.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Optional Additional Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mt-4 items-end">
              {/* Min Price */}
              <div>
                <label htmlFor="min-price" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  {t('hero.minPriceLabel')}
                </label>
                 <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <Input
                    id="min-price"
                    type="text" // Use text to allow empty input
                    inputMode="numeric" // Hint for mobile keyboards
                    placeholder={t('any')}
                    value={minPrice}
                    onChange={(e) => handleNumericInput(setMinPrice, e.target.value)}
                    className="pl-8 h-10 text-sm"
                  />
                 </div>
              </div>

              {/* Max Price */}
              <div>
                <label htmlFor="max-price" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  {t('hero.maxPriceLabel')}
                </label>
                 <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <Input
                    id="max-price"
                    type="text" // Use text to allow empty input
                    inputMode="numeric" // Hint for mobile keyboards
                    placeholder={t('any')}
                    value={maxPrice}
                    onChange={(e) => handleNumericInput(setMaxPrice, e.target.value)}
                    className="pl-8 h-10 text-sm"
                  />
                 </div>
              </div>

              {/* Beds */}
              <div>
                <label htmlFor="beds-filter" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  {t('hero.bedsLabel')}
                </label>
                <Select value={beds} onValueChange={setBeds}>
                  <SelectTrigger className="h-10 text-sm">
                    <BedDouble className="h-4 w-4 text-gray-400 mr-2" />
                    <SelectValue placeholder={t('any')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('any')}</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Baths */}
              <div>
                <label htmlFor="baths-filter" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  {t('hero.bathsLabel')}
                </label>
                <Select value={baths} onValueChange={setBaths}>
                  <SelectTrigger className="h-10 text-sm">
                    <Bath className="h-4 w-4 text-gray-400 mr-2" />
                    <SelectValue placeholder={t('any')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('any')}</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <div className="lg:col-start-5">
                <Button
                  onClick={handleSearch}
                  className="w-full h-10 text-base bg-primary hover:bg-primary/90"
                  size="lg" // Use size prop for consistency
                >
                  <Search className="h-5 w-5 mr-2" />
                  {t('hero.search')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Hero;
