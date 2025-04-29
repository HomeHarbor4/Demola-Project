// src/components/QuickFilters.tsx

import { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Map as MapIcon, List } from "lucide-react";
import AdvancedFilters from "./AdvancedFilters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from '@/contexts/LanguageContext';

// Helper to safely parse float
const safeParseFloat = (value: any): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
};

// Helper to safely parse int
const safeParseInt = (value: any): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
};

// --- Helper to safely check for truthy boolean values (handles true, 'true') ---
const isTruthy = (value: any): boolean => {
  return value === true || String(value).toLowerCase() === 'true';
};

// Define the structure for the filters state (matching backend keys)
interface FiltersState {
  listingType?: string;
  propertyType?: string | string[];
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  ownership?: string | string[];
  postedBy?: string | string[];
  facingDirection?: string;
  onlyWithPhotos?: boolean;
  onlyWithVideos?: boolean; // Keep for consistency, even if backend doesn't use it yet
  verified?: boolean;
  featured?: boolean;
  amenities?: string[];
  // Add other backend keys
  city?: string;
  search?: string;
  status?: string;
  transactionType?: string;
  furnishingDetails?: string | string[];
  heatingAvailable?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  [key: string]: any; // Allow other potential keys
}

type QuickFiltersProps = {
  onFilterChange?: (filters: FiltersState) => void;
  onViewChange?: (view: 'map' | 'list') => void;
  activeView?: 'map' | 'list';
  initialFilters?: Record<string, any>;
};

// Helper to convert backend state to UI select value ('all' if undefined/empty)
const getSelectValue = (value: string | number | undefined | null): string => {
  return (value === undefined || value === null || value === '') ? "all" : String(value);
};

// Helper to map price range string back to min/max price for initialization
const getPriceRangeFromState = (min?: number, max?: number): string => {
    if (min === 1000000 && max === 2000000) return "10L-20L";
    if (min === 2000000 && max === 5000000) return "20L-50L";
    if (min === 5000000 && max === 10000000) return "50L-1Cr";
    if (min === 10000000 && max === 100000000) return "1Cr+";
    return "all";
};

// Helper to map bedrooms number back to BHK string for initialization
const getBhkFromState = (bedrooms?: number): string => {
    if (bedrooms === undefined || bedrooms === null) return "all";
    if (bedrooms >= 4) return "4+";
    return String(bedrooms);
};

const propertyTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'House', label: 'House' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Penthouse', label: 'Penthouse' },
  { value: 'Studio', label: 'Studio' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Land', label: 'Land' },
  { value: 'Cottage', label: 'Cottage' },
  { value: 'Office', label: 'Office' }
];

export default function QuickFilters({
  onFilterChange,
  onViewChange,
  activeView = 'list',
  initialFilters = {}
}: QuickFiltersProps) {
  const { t } = useLanguage();

  // --- Add state for Dialog open status ---
  const [isAdvancedDialogOpen, setIsAdvancedDialogOpen] = useState(false);

  // --- Single State for Filters (matching backend keys) ---
  const [filters, setFilters] = useState<FiltersState>(() => {
    console.log("[QuickFilters] Initializing state with initialFilters:", initialFilters); // Debug log
    const initial: FiltersState = {};
    for (const key in initialFilters) {
      const value = initialFilters[key];
      // --- Use isTruthy for boolean conversion ---
      if (['onlyWithPhotos', 'onlyWithVideos', 'verified', 'featured', 'heatingAvailable'].includes(key)) {
        initial[key] = isTruthy(value); // Correct boolean check
      } else if (['bedrooms', 'bathrooms', 'minPrice', 'maxPrice', 'minArea', 'maxArea'].includes(key)) {
        const numVal = key.includes('Price') || key.includes('Area') ? safeParseFloat(value) : safeParseInt(value);
        if (numVal !== undefined) initial[key] = numVal;
      } else if (key === 'amenities' && typeof value === 'string') {
         initial[key] = value.split(',');
      }
       else if (value !== null && value !== undefined && value !== '') {
        initial[key] = value;
      }
    }
    console.log("[QuickFilters] Initialized internal state:", initial); // Debug log
    return initial;
  });

  // --- Sync state if initialFilters prop changes ---
  useEffect(() => {
    console.log("[QuickFilters] useEffect: Syncing with initialFilters prop:", initialFilters); // Debug log
    const updatedFilters: FiltersState = {};
     for (const key in initialFilters) {
      const value = initialFilters[key];
      // --- Use isTruthy for boolean conversion ---
      if (['onlyWithPhotos', 'onlyWithVideos', 'verified', 'featured', 'heatingAvailable'].includes(key)) {
        updatedFilters[key] = isTruthy(value); // Correct boolean check
      } else if (['bedrooms', 'bathrooms', 'minPrice', 'maxPrice', 'minArea', 'maxArea'].includes(key)) {
        const numVal = key.includes('Price') || key.includes('Area') ? safeParseFloat(value) : safeParseInt(value);
        if (numVal !== undefined) updatedFilters[key] = numVal;
      } else if (key === 'amenities' && typeof value === 'string') {
         updatedFilters[key] = value.split(',');
      }
       else if (value !== null && value !== undefined && value !== '') {
        updatedFilters[key] = value;
      }
    }
    console.log("[QuickFilters] useEffect: Setting internal state to:", updatedFilters); // Debug log
    setFilters(updatedFilters);
  }, [initialFilters]);

    // --- Consolidate and Clean Filters before sending ---
    const consolidateAndSendFilters = useCallback((currentState: FiltersState) => {
      // Clean the state: only include keys that have a meaningful value
      const finalFilters: FiltersState = {};
      for (const key in currentState) {
        const value = currentState[key];

        // --- Skip keys with undefined, null, or empty string values ---
        if (value === undefined || value === null || value === '') {
          continue;
        }

        // --- Skip empty arrays ---
        if (Array.isArray(value) && value.length === 0) {
          continue;
        }

        // --- Skip UI-specific keys from AdvancedFilters ---
        if (key === 'areaRange' || key === 'budgetRange') {
          continue;
        }

        // --- Skip boolean filters if they are false (DEFAULT BEHAVIOR) ---
        if (typeof value === 'boolean' && value === false) {
          if (!['featured'].includes(key)) { // Only 'featured' is potentially kept if false
             continue;
          }
        }

        // --- Skip numeric filters if they are 0 (DEFAULT BEHAVIOR) ---
        if (typeof value === 'number' && value === 0) {
          if (!['bedrooms', 'bathrooms'].includes(key)) {
             // continue; // Uncomment if minPrice=0 or minArea=0 should NOT be sent
          }
        }


        // --- If the value passes all checks, include it ---
        finalFilters[key] = value;

        // --- Ensure correct types one last time (optional, but safe) ---
        if (['onlyWithPhotos', 'onlyWithVideos', 'verified', 'featured', 'heatingAvailable'].includes(key)) {
            finalFilters[key] = value === true;
        } else if (['bedrooms', 'bathrooms', 'minPrice', 'maxPrice', 'minArea', 'maxArea'].includes(key)) {
            const numVal = key.includes('Price') || key.includes('Area') ? safeParseFloat(value) : safeParseInt(value);
            if (numVal !== undefined) {
               finalFilters[key] = numVal;
            } else {
               delete finalFilters[key];
            }
        }
      }

      console.log("[QuickFilters] Sending cleaned filters to parent:", finalFilters);
      if (onFilterChange) {
        onFilterChange(finalFilters);
      }
    }, [onFilterChange]);


  // --- Handle Changes from UI Elements ---
  const handleUiChange = (filterType: string, value: string) => {
    let backendKey = filterType;
    let processedValue = value;

    // Map UI keys to backend keys
    if (filterType === 'minBudget') backendKey = 'minPrice';
    if (filterType === 'maxBudget') backendKey = 'maxPrice';
    if (filterType === 'withPhotos') backendKey = 'onlyWithPhotos';
    if (filterType === 'withVideos') backendKey = 'onlyWithVideos';
    if (filterType === 'verifiedProperties') backendKey = 'verified';
    if (filterType === 'facing') backendKey = 'facingDirection';
    if (filterType === 'ownershipType') backendKey = 'ownership';

    // Handle property type capitalization
    if (filterType === 'property') {
      backendKey = 'propertyType';
      processedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }

    // Update the filters state
    setFilters(prev => ({
      ...prev,
      [backendKey]: processedValue
    }));

    // Call the parent's onFilterChange with the updated filters
    onFilterChange({
      ...filters,
      [backendKey]: processedValue
    });
  };

  // --- Handle Changes from Advanced Filters Dialog ---
  const handleAdvancedFilterChange = (advFiltersFromModal: Record<string, any>) => {
    // Update the main state using functional update
    setFilters(prevFilters => {
       let newState = { ...prevFilters };

       // --- Handle Reset Case ---
       if (Object.keys(advFiltersFromModal).length === 0) {
           console.log("[QuickFilters] Reset signal received from AdvancedFilters");
           const advancedFilterKeys: (keyof FiltersState)[] = [
               'propertyType', 'minArea', 'maxArea', 'minPrice', 'maxPrice',
               'ownership', 'postedBy', 'facingDirection', 'onlyWithPhotos',
               'onlyWithVideos', 'verified', 'amenities', 'furnishingDetails',
               'heatingAvailable', 'transactionType', 'status'
           ];
           advancedFilterKeys.forEach(key => {
               delete newState[key];
           });
           console.log("[QuickFilters] State after clearing advanced keys:", newState);
       }
       // --- Handle Regular Filter Updates ---
       else {
           console.log("[QuickFilters] Received regular update from AdvancedFilters:", advFiltersFromModal);
           for(const key in advFiltersFromModal) {
               const value = advFiltersFromModal[key];
               let targetKey = key;
               let processedValue = value;

               // --- Key Mappings ---
               if (key === 'ownershipType') targetKey = 'ownership';
               if (key === 'minBudget') targetKey = 'minPrice';
               if (key === 'maxBudget') targetKey = 'maxPrice';
               if (key === 'withPhotos') targetKey = 'onlyWithPhotos';
               if (key === 'withVideos') targetKey = 'onlyWithVideos';
               if (key === 'verifiedProperties') targetKey = 'verified';
               if (key === 'facing') targetKey = 'facingDirection';

               // --- Type Conversions ---
               if (['onlyWithPhotos', 'onlyWithVideos', 'verified', 'featured', 'heatingAvailable'].includes(targetKey)) {
                  processedValue = isTruthy(value); // Use isTruthy here too
               } else if (['bedrooms', 'bathrooms', 'minPrice', 'maxPrice', 'minArea', 'maxArea'].includes(targetKey)) {
                  const numVal = targetKey.includes('Price') || targetKey.includes('Area') ? safeParseFloat(value) : safeParseInt(value);
                  processedValue = numVal;
               } else if (targetKey === 'amenities' && typeof value === 'string') {
                   processedValue = value.split(',');
               }

               // --- Explicitly Handle Clearing vs. Setting ---
               if (processedValue === undefined || (Array.isArray(processedValue) && processedValue.length === 0)) {
                   console.log(`[QuickFilters] Deleting key: ${targetKey}`);
                   delete newState[targetKey];
               } else {
                   console.log(`[QuickFilters] Setting key: ${targetKey} to`, processedValue);
                   newState[targetKey] = processedValue;
               }
           }
           console.log("[QuickFilters] State after merging advanced update:", newState);
       }

       consolidateAndSendFilters(newState);
       return newState;
    });
 };

  // --- Derive UI values from state ---
  const uiPropertyType = getSelectValue(filters.propertyType);
  const uiBhkType = getBhkFromState(filters.bedrooms);
  const uiPriceRange = getPriceRangeFromState(filters.minPrice, filters.maxPrice);

  console.log("[QuickFilters] Rendering with internal state:", filters); // Log before render

  return (
    <section className="bg-white py-4 shadow-sm sticky top-16 z-40">
      <div className="container mx-auto px-4">
        {/* Basic Filters Row */}
        <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center space-x-4">
            {/* --- All Filters Dialog --- */}
            <Dialog open={isAdvancedDialogOpen} onOpenChange={setIsAdvancedDialogOpen}>
              <DialogTrigger asChild>
                <div
                  className="flex items-center cursor-pointer hover:text-primary-600 transition min-w-max bg-slate-100 px-3 py-2 rounded-md"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">{t('quickFilters.advancedFilters') || t('quickFilters.allFilters') || 'All Filters'}</span>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('quickFilters.advancedFilters')}</DialogTitle>
                </DialogHeader>
                {/* Pass current filters state AND the function to close the dialog */}
                <AdvancedFilters
                  initialFilters={filters} // Pass the potentially corrected state
                  onFilterChange={handleAdvancedFilterChange}
                  onClose={() => setIsAdvancedDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>

            {/* --- Listing Type Buttons --- */}
            <div className="flex space-x-2 min-w-max">
              <Button
                variant={filters.listingType === 'buy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleUiChange('listingType', 'buy')}
                className="rounded-full text-xs"
              >
                {t('navbar.buy')}
              </Button>
              <Button
                variant={filters.listingType === 'rent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleUiChange('listingType', 'rent')}
                className="rounded-full text-xs"
              >
                {t('navbar.rent')}
              </Button>
              {/* --- Added Sell Button --- */}
              <Button
                variant={filters.listingType === 'sell' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleUiChange('listingType', 'sell')}
                className="rounded-full text-xs"
              >
                {t('navbar.sell')}
              </Button>
              <Button
                variant={filters.listingType === 'commercial' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleUiChange('listingType', 'commercial')}
                className="rounded-full text-xs"
              >
                {t('navbar.commercial')}
              </Button>
               {/* --- Added PG / Co-Living Button --- */}
               <Button
                variant={filters.listingType === 'pg' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleUiChange('listingType', 'pg')}
                className="rounded-full text-xs whitespace-nowrap" // Added whitespace-nowrap
              >
                {t('navbar.pg')}
              </Button>
            </div>

            {/* --- Quick Filter Selects --- */}
            <div className="min-w-max">
              <Select value={uiPropertyType} onValueChange={(value) => handleUiChange("property", value)}>
                <SelectTrigger className="text-sm border-none focus:ring-0 cursor-pointer py-1 pr-8 pl-2 bg-slate-100 rounded">
                  <SelectValue placeholder={t('quickFilters.propertyType')} />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(`propertyType.${option.value.toLowerCase()}`) || option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-max">
              <Select value={uiBhkType} onValueChange={(value) => handleUiChange("bhk", value)}>
                <SelectTrigger className="text-sm border-none focus:ring-0 cursor-pointer py-1 pr-8 pl-2 bg-slate-100 rounded">
                  <SelectValue placeholder={t('quickFilters.bedrooms')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('quickFilters.any')}</SelectItem>
                  <SelectItem value="1">1 {t('quickFilters.bedrooms')}</SelectItem>
                  <SelectItem value="2">2 {t('quickFilters.bedrooms')}</SelectItem>
                  <SelectItem value="3">3 {t('quickFilters.bedrooms')}</SelectItem>
                  <SelectItem value="4+">4+ {t('quickFilters.bedrooms')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-max">
              <Select value={uiPriceRange} onValueChange={(value) => handleUiChange("price", value)}>
                <SelectTrigger className="text-sm border-none focus:ring-0 cursor-pointer py-1 pr-8 pl-2 bg-slate-100 rounded">
                  <SelectValue placeholder={t('quickFilters.priceRange')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('quickFilters.any')}</SelectItem>
                  <SelectItem value="10L-20L">₹10L - ₹20L</SelectItem>
                  <SelectItem value="20L-50L">₹20L - ₹50L</SelectItem>
                  <SelectItem value="50L-1Cr">₹50L - ₹1Cr</SelectItem>
                  <SelectItem value="1Cr+">₹1Cr+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* --- View Toggle --- */}
          <div className="flex items-center ml-auto pl-4">
            <div className="flex border-2 rounded-lg shadow-md bg-white overflow-hidden">
              <button
                className={`px-4 py-2 text-sm font-medium flex items-center transition-colors ${
                  activeView === 'map'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 hover:bg-slate-100'
                }`}
                onClick={() => onViewChange && onViewChange('map')}
                aria-label="Show map view"
              >
                <MapIcon className="h-4 w-4 mr-1.5" />
                {t('quickFilters.view.map')}
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium flex items-center transition-colors ${
                  activeView === 'list'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 hover:bg-slate-100'
                }`}
                onClick={() => onViewChange && onViewChange('list')}
                aria-label="Show list view"
              >
                <List className="h-4 w-4 mr-1.5" />
                {t('quickFilters.view.list')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
