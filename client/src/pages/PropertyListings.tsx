// src/pages/PropertyListings.tsx

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter"; // Use wouter's location hook
import Navbar from "@/components/Navbar";
import QuickFilters from "@/components/QuickFilters";
import PropertyCard from "@/components/PropertyCard";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import MapView from "@/components/MapView";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Property } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Spinner } from "@/components/Spinner";
import { queryClient } from "@/lib/queryClient";
import { debounce } from "lodash";
import { useLanguage } from '@/contexts/LanguageContext';

interface PropertiesApiResponse {
  properties: Property[];
  total: number;
}

// Helper to parse filters from URLSearchParams, aligning keys
const parseFiltersFromParams = (params: URLSearchParams): Record<string, any> => {
  const initialFilters: Record<string, any> = {};

  params.forEach((value, key) => {
    // Skip pagination params here
    if (key === 'page' || key === 'limit') return;

    // --- Key Alignment Mappings ---
    let targetKey = key;
    let processedValue = value;

    // Map UI keys to backend keys
    if (key === 'minBudget') targetKey = 'minPrice';
    if (key === 'maxBudget') targetKey = 'maxPrice';
    if (key === 'withPhotos') targetKey = 'onlyWithPhotos';
    if (key === 'withVideos') targetKey = 'onlyWithVideos';
    if (key === 'verifiedProperties') targetKey = 'verified';
    if (key === 'facing') targetKey = 'facingDirection';
    if (key === 'ownershipType') targetKey = 'ownership';

    // --- Type Conversions ---
    if (['onlyWithPhotos', 'onlyWithVideos', 'verified', 'featured', 'heatingAvailable'].includes(targetKey)) {
      processedValue = value === 'true';
    } else if (['bedrooms', 'bathrooms', 'minPrice', 'maxPrice', 'minArea', 'maxArea'].includes(targetKey)) {
      const numVal = targetKey.includes('Price') || targetKey.includes('Area') ? parseFloat(value) : parseInt(value, 10);
      processedValue = isNaN(numVal) ? undefined : numVal;
    }

    // --- Handle Property Type Filter ---
    if (targetKey === 'propertyType') {
      // Convert to capitalized format for backend
      processedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      if (!initialFilters[targetKey]) {
        initialFilters[targetKey] = [];
      }
      if (!Array.isArray(initialFilters[targetKey])) {
        initialFilters[targetKey] = [initialFilters[targetKey]];
      }
      if (!initialFilters[targetKey].includes(processedValue)) {
        initialFilters[targetKey].push(processedValue);
      }
    } else {
      initialFilters[targetKey] = processedValue;
    }
  });

  return initialFilters;
};


export default function PropertyListings() {
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [filters, setFilters] = useState<Record<string, any>>(() => {
    return parseFiltersFromParams(new URLSearchParams(window.location.search));
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const initialParams = new URLSearchParams(window.location.search);
    return Number(initialParams.get('page')) || 1;
  });
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'map' | 'list'>('list');
  const itemsPerPage = 12;

  // Separate effect for filter changes
  useEffect(() => {
    const queryString = buildApiQueryString();
    queryClient.invalidateQueries(['/properties', queryString]);
  }, [filters, currentPage]);

  // Force remount when property type changes
  const propertyTypeKey = filters.listingType || 'all';

  // --- Update URL when filters or page change (using backend keys) ---
  const updateUrl = useCallback((currentFilters: Record<string, any>, page: number) => {
    const queryParams = new URLSearchParams();
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
         if (typeof value === 'boolean') {
             queryParams.set(key, value ? 'true' : 'false');
         } else if (Array.isArray(value)) {
             if (value.length > 0) queryParams.set(key, value.join(','));
         } else {
             queryParams.set(key, String(value));
         }
      }
    });
    queryParams.set("page", page.toString());
    queryParams.set("limit", itemsPerPage.toString());

    // Always use replace: false to ensure URL changes are detected
    setLocation(`${window.location.pathname}?${queryParams.toString()}`, { replace: false });
  }, [setLocation, itemsPerPage]);

  // --- Build query parameters string FOR THE API CALL (using backend keys) ---
  const buildApiQueryString = useCallback(() => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      // Use the keys directly from the filters state (should match backend)
      if (value !== null && value !== undefined && value !== '') {
         if (typeof value === 'boolean') {
             queryParams.append(key, value ? 'true' : 'false');
         } else if (Array.isArray(value)) {
             if (value.length > 0) queryParams.append(key, value.join(','));
         } else {
             queryParams.append(key, String(value));
         }
      }
    });
    queryParams.append("page", currentPage.toString());
    queryParams.append("limit", itemsPerPage.toString());
    return queryParams.toString();
  }, [filters, currentPage, itemsPerPage]);

  const apiQueryString = buildApiQueryString();

  // --- Fetch properties using useQuery ---
  // The queryKey now directly uses the state variables that define the query
  const { data: propertiesData, isLoading, isFetching, error } = useQuery<PropertiesApiResponse>({
    queryKey: ['/properties', filters, currentPage, itemsPerPage],
    queryFn: () => apiRequest<PropertiesApiResponse>('GET', `/properties?${apiQueryString}`),
    keepPreviousData: true,
    staleTime: 1000 * 30,
    retry: 3,
    onError: (error) => {
      console.error('Error fetching properties:', error);
      // Show error toast or notification
    }
  });

  // --- Handle Filter Changes from QuickFilters ---
  const handleFilterChange = useCallback((newFiltersFromQuickFilters: Record<string, any>) => {
    console.log("Received filters from QuickFilters (should use backend keys):", newFiltersFromQuickFilters);
    // Set the new filters state (already using backend keys)
    setFilters(newFiltersFromQuickFilters);
    // Reset to page 1 when filters change
    setCurrentPage(1);
    // Update the URL using the new filters
    updateUrl(newFiltersFromQuickFilters, 1);
  }, [updateUrl]);

  // --- Handle Page Changes ---
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Update the URL using the current filters state
    updateUrl(filters, page);
    window.scrollTo(0, 0);
  }, [filters, updateUrl]);

  // --- Other handlers ---
  const handleOpenModal = (property: Property) => {
    setSelectedPropertyId(property.id);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPropertyId(null);
  };

  const handleViewChange = (view: 'map' | 'list') => {
    setActiveView(view);
  };

  // --- Calculate total pages ---
  const totalPages = propertiesData?.total ? Math.ceil(propertiesData.total / itemsPerPage) : 1;
  const dataToDisplay = propertiesData?.properties || [];
  const totalFound = propertiesData?.total ?? 0;
  const isDataLoading = isLoading || isFetching;

  // --- Dynamic Page Title ---
  const getPageTitle = () => {
    const city = filters.city || "";
    const listingType = filters.listingType || "";
    const searchQuery = filters.search || "";

    if (searchQuery) return t('propertyListings.searchResults', { query: searchQuery });
    if (city && city !== 'all') return t('propertyListings.propertiesInCity', { city });

    if(listingType) return t(`propertyListings.title.${listingType.toLowerCase()}`);
    else return t('propertyListings.title.default');
  };

  const syncFiltersWithUrl = useCallback((newFilters: Record<string, any>) => {
    const queryParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.set(key, String(value));
      }
    });
    setLocation(`${window.location.pathname}?${queryParams.toString()}`, { replace: true });
  }, [setLocation]);

  const debouncedFilterChange = useCallback(
    debounce((newFilters: Record<string, any>) => {
      syncFiltersWithUrl(newFilters);
    }, 300),
    [syncFiltersWithUrl]
  );

  return (
    <div className="min-h-screen bg-slate-50" key={propertyTypeKey}>
      <Navbar />
      {/* Pass the current filters state (using backend keys) to QuickFilters */}
      <QuickFilters
        onFilterChange={handleFilterChange}
        onViewChange={handleViewChange}
        activeView={activeView}
        initialFilters={filters} // Pass the current filters state
      />

      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-heading mb-2">{getPageTitle()}</h1>
            <p className="text-slate-600">
              {t('propertyListings.propertiesFound', { count: totalFound })}
              {isDataLoading && <span className="ml-2">({t('propertyListings.updating')})</span>}
            </p>
          </div>

          {isDataLoading && dataToDisplay.length === 0 ? (
            // Skeleton Loader
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(itemsPerPage)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md animate-pulse">
                  <div className="h-48 bg-slate-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-10 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : dataToDisplay.length > 0 ? (
            <>
              {activeView === 'list' ? (
                // List View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {dataToDisplay.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onOpenModal={handleOpenModal}
                    />
                  ))}
                </div>
              ) : (
                // Map View
                <div className="bg-white rounded-lg shadow-md p-4 h-[600px]">
                  {dataToDisplay.some(property => property.latitude && property.longitude) ? (
                    <MapView properties={dataToDisplay} onPropertyClick={handleOpenModal} />
                  ) : (
                    <div className="flex items-center justify-center bg-slate-100 rounded-lg h-full">
                      <div className="text-center">
                        <i className="ri-map-pin-line text-5xl text-primary-500 mb-3"></i>
                        <h3 className="text-xl font-semibold mb-2">{t('propertyDetailModal.locationNotAvailable')}</h3>
                        <p className="text-slate-500 max-w-md">
                          {t('propertyListings.noProperties')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center items-center">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || isDataLoading}
                      aria-label={t('common.back')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page Numbers Logic */}
                    <div className="flex items-center">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        const showPage =
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                        const showEllipsisBefore = pageNumber === currentPage - 2 && currentPage > 3;
                        const showEllipsisAfter = pageNumber === currentPage + 2 && currentPage < totalPages - 2;

                        if (showPage) {
                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              className="mx-1 min-w-[40px]"
                              onClick={() => handlePageChange(pageNumber)}
                              disabled={isDataLoading}
                              aria-label={t('common.page', { number: pageNumber })}
                              aria-current={currentPage === pageNumber ? "page" : undefined}
                            >
                              {pageNumber}
                            </Button>
                          );
                        } else if (showEllipsisBefore || showEllipsisAfter) {
                          return <span key={`ellipsis-${pageNumber}`} className="mx-1 px-2">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages || isDataLoading}
                      aria-label={t('common.next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            // No Results View
            !isDataLoading && (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <i className="ri-search-line text-5xl text-slate-300 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">{t('propertyListings.noProperties')}</h3>
                <p className="text-slate-600 mb-6">{t('propertyListings.tryChangingFilters')}</p>
                <Button onClick={() => window.history.back()}>{t('propertyListings.goBack')}</Button>
              </div>
            )
          )}
        </div>
      </section>

      <Footer />

      {/* Property Detail Modal */}
      {selectedPropertyId && (
        <PropertyDetailModal
          property={dataToDisplay.find(p => p.id === selectedPropertyId)}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
