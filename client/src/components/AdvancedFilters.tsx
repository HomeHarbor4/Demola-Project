// src/components/AdvancedFilters.tsx

import { useState, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

type AdvancedFiltersProps = {
  initialFilters?: Record<string, any>; // Receive initial state
  onFilterChange?: (filters: Record<string, any>) => void;
  onClose?: () => void; // Prop to signal closing the modal
};

// Define the structure for the internal state of this component
interface AdvancedFiltersState {
  propertyType: string[];
  areaRange: [number, number];
  budgetRange: [number, number];
  minArea: string;
  maxArea: string;
  minBudget: string; // Corresponds to minPrice
  maxBudget: string; // Corresponds to maxPrice
  ownership: string[];
  postedBy: string[];
  facing: string[]; // Corresponds to facingDirection
  onlyWithPhotos: boolean;
  onlyWithVideos: boolean;
  verifiedProperties: boolean; // Corresponds to verified
}

// Define the default state for resetting
const defaultAdvancedFiltersState: AdvancedFiltersState = {
  propertyType: [],
  areaRange: [0, 5000],
  budgetRange: [0, 10000000],
  minArea: '',
  maxArea: '',
  minBudget: '',
  maxBudget: '',
  ownership: [],
  postedBy: [],
  facing: [],
  onlyWithPhotos: false,
  onlyWithVideos: false,
  verifiedProperties: false,
};

// Helper to safely parse int or return undefined
const safeParseInt = (value: any): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
};

// Helper to safely parse float or return undefined
const safeParseFloat = (value: any): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
};

// --- Function to derive internal state from external filters ---
const deriveInternalState = (externalFilters: Record<string, any>): AdvancedFiltersState => {
  console.log("[AdvancedFilters] Deriving internal state from externalFilters:", externalFilters);

  // --- Helper to safely check for truthy boolean values (handles true, 'true') ---
  const isTruthy = (value: any): boolean => {
    // Check for boolean true or string 'true' (case-insensitive)
    return value === true || String(value).toLowerCase() === 'true';
  };

  // --- Property Type ---
  let initialPropertyType: string[] = [];
  if (externalFilters.propertyType) {
      initialPropertyType = Array.isArray(externalFilters.propertyType)
          ? externalFilters.propertyType.map(String) // Ensure all elements are strings
          : [String(externalFilters.propertyType)];
  }

  // --- Area ---
  const initialMinAreaNum = safeParseInt(externalFilters.minArea);
  const initialMaxAreaNum = safeParseInt(externalFilters.maxArea);
  const minAreaStr = String(externalFilters.minArea ?? '');
  const maxAreaStr = String(externalFilters.maxArea ?? '');

  // --- Price/Budget ---
  const initialMinPriceNum = safeParseInt(externalFilters.minPrice); // Use minPrice
  const initialMaxPriceNum = safeParseInt(externalFilters.maxPrice); // Use maxPrice
  const minBudgetStr = String(externalFilters.minPrice ?? ''); // Map from minPrice
  const maxBudgetStr = String(externalFilters.maxPrice ?? ''); // Map from maxPrice

  // --- Ownership ---
  let initialOwnership: string[] = [];
  if (externalFilters.ownership) {
      initialOwnership = Array.isArray(externalFilters.ownership)
          ? externalFilters.ownership.map(String)
          : [String(externalFilters.ownership)];
  }

  // --- Posted By ---
  let initialPostedBy: string[] = [];
  if (externalFilters.postedBy) {
      initialPostedBy = Array.isArray(externalFilters.postedBy)
          ? externalFilters.postedBy.map(String)
          : [String(externalFilters.postedBy)];
  }

  // --- Facing Direction ---
  let initialFacing: string[] = [];
  if (externalFilters.facingDirection) { // Map from facingDirection
      initialFacing = Array.isArray(externalFilters.facingDirection)
          ? externalFilters.facingDirection.map(String)
          : [String(externalFilters.facingDirection)];
  }

  // --- Booleans (Using the isTruthy helper) ---
  const onlyWithPhotosBool = isTruthy(externalFilters.onlyWithPhotos);
  const onlyWithVideosBool = isTruthy(externalFilters.onlyWithVideos);
  // Explicitly check the 'verified' key from the parent filters
  const verifiedBool = isTruthy(externalFilters.verified);

  const derived: AdvancedFiltersState = {
    propertyType: initialPropertyType,
    areaRange: [
      initialMinAreaNum !== undefined ? initialMinAreaNum : defaultAdvancedFiltersState.areaRange[0],
      initialMaxAreaNum !== undefined ? initialMaxAreaNum : defaultAdvancedFiltersState.areaRange[1]
    ],
    budgetRange: [
      initialMinPriceNum !== undefined ? initialMinPriceNum : defaultAdvancedFiltersState.budgetRange[0],
      initialMaxPriceNum !== undefined ? initialMaxPriceNum : defaultAdvancedFiltersState.budgetRange[1]
    ],
    minArea: minAreaStr,
    maxArea: maxAreaStr,
    minBudget: minBudgetStr,
    maxBudget: maxBudgetStr,
    ownership: initialOwnership,
    postedBy: initialPostedBy,
    facing: initialFacing,
    onlyWithPhotos: onlyWithPhotosBool,
    onlyWithVideos: onlyWithVideosBool,
    verifiedProperties: verifiedBool, // Assign the correctly derived boolean value
  };
  console.log("[AdvancedFilters] Derived internal state:", derived);
  return derived;
};


export default function AdvancedFilters({ initialFilters = {}, onFilterChange, onClose }: AdvancedFiltersProps) {
  const { t } = useTranslation('advancedFilters');
  // Initialize state using the derivation function
  const [filters, setFilters] = useState<AdvancedFiltersState>(() => deriveInternalState(initialFilters));

  // Sync state if initialFilters prop changes after mount
  useEffect(() => {
    console.log("[AdvancedFilters] useEffect: Syncing with initialFilters prop", initialFilters);
    // When the initialFilters prop changes, re-derive the internal state
    setFilters(deriveInternalState(initialFilters));
  }, [initialFilters]); // Dependency array ensures this runs when the prop changes


  // --- Event Handlers (Remain the same) ---
  const handlePropertyTypeChange = (type: string) => {
    setFilters(prev => {
      const newTypes = prev.propertyType.includes(type)
        ? prev.propertyType.filter(t => t !== type)
        : [...prev.propertyType, type];
      
      return {
        ...prev,
        propertyType: newTypes
      };
    });
  };

  const handleCheckboxChange = (field: keyof AdvancedFiltersState, value: string) => {
    setFilters(prev => {
      const currentValues = prev[field] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const handleToggleChange = (field: keyof AdvancedFiltersState) => {
    setFilters(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleAreaRangeChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      areaRange: [value[0], value[1]] as [number, number],
      minArea: value[0].toString(),
      maxArea: value[1].toString(),
    }));
  };

  const handleBudgetRangeChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      budgetRange: [value[0], value[1]] as [number, number],
      minBudget: value[0].toString(),
      maxBudget: value[1].toString(),
    }));
  };

  const handleInputChange = (field: keyof AdvancedFiltersState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));

    // Sync sliders if input changes
    if (field === 'minArea' || field === 'maxArea') {
      const min = field === 'minArea' ? safeParseInt(value) ?? 0 : filters.areaRange[0];
      const max = field === 'maxArea' ? safeParseInt(value) ?? 5000 : filters.areaRange[1];
      setFilters(prev => ({ ...prev, areaRange: [min, max] as [number, number] }));
    }
    if (field === 'minBudget' || field === 'maxBudget') {
      const min = field === 'minBudget' ? safeParseInt(value) ?? 0 : filters.budgetRange[0];
      const max = field === 'maxBudget' ? safeParseInt(value) ?? 10000000 : filters.budgetRange[1];
      setFilters(prev => ({ ...prev, budgetRange: [min, max] as [number, number] }));
    }
  };


  const applyFilters = () => {
    // Prepare the filter object to be sent back, mapping internal state keys to backend keys.
    const filtersToSend: Record<string, any> = {
      propertyType: filters.propertyType.length > 0 ? filters.propertyType : undefined,
      ownership: filters.ownership.length > 0 ? filters.ownership : undefined,
      postedBy: filters.postedBy.length > 0 ? filters.postedBy : undefined,
      facingDirection: filters.facing.length > 0 ? filters.facing : undefined,
      minArea: safeParseFloat(filters.minArea),
      maxArea: safeParseFloat(filters.maxArea),
      minPrice: safeParseFloat(filters.minBudget),
      maxPrice: safeParseFloat(filters.maxBudget),
      onlyWithPhotos: filters.onlyWithPhotos,
      onlyWithVideos: filters.onlyWithVideos,
      verified: filters.verifiedProperties, // Map verifiedProperties back to verified
    };

    console.log("AdvancedFilters applying (sending to parent):", filtersToSend);
    onFilterChange?.(filtersToSend);
    onClose?.();
  };

  const resetFilters = () => {
    setFilters(defaultAdvancedFiltersState);
    onFilterChange?.({});
  };

  // --- Render Logic ---
  console.log("[AdvancedFilters] Rendering with internal state:", filters); // Add log before render
  console.log("[AdvancedFilters] Verified Checkbox 'checked' value:", filters.verifiedProperties);

  // Arrays for mapping
  const propertyTypes = [
    'Apartment',
    'House',
    'Townhouse',
    'Villa',
    'Penthouse',
    'Studio',
    'Commercial',
    'Land',
    'Cottage',
    'Office'
  ];
  const ownershipTypes = ['freehold', 'leasehold', 'cooperative'];
  const postedByTypes = ['owner', 'agent', 'builder'];
  const facingTypes = ['east', 'west', 'north', 'south'];

  return (
    <div className="bg-white rounded-lg p-5 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Property Type Section */}
        <div>
          <h3 className="font-medium text-lg mb-3">{t('propertyType')}</h3>
          <div className="space-y-2">
            {propertyTypes.map((type) => (
              <div className="flex items-center space-x-2" key={type}>
                <Checkbox
                  id={`adv-${type}`}
                  checked={filters.propertyType.includes(type)}
                  onCheckedChange={() => handlePropertyTypeChange(type)}
                />
                <Label htmlFor={`adv-${type}`}>{type}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Area Range Section */}
        <div>
          <h3 className="font-medium text-lg mb-3">{t('area')}</h3>
          <div>
            <Slider min={0} max={10000} step={100} value={filters.areaRange} onValueChange={handleAreaRangeChange} className="mb-4" />
            <div className="flex items-center space-x-2">
              <Input type="number" placeholder={t('min')} value={filters.minArea} onChange={(e) => handleInputChange('minArea', e.target.value)} className="w-full" />
              <span>{t('common.to', 'to')}</span>
              <Input type="number" placeholder={t('max')} value={filters.maxArea} onChange={(e) => handleInputChange('maxArea', e.target.value)} className="w-full" />
            </div>
          </div>
        </div>

        {/* Budget Range Section */}
        <div>
          <h3 className="font-medium text-lg mb-3">{t('budget')}</h3>
          <div>
            <Slider min={0} max={50000000} step={100000} value={filters.budgetRange} onValueChange={handleBudgetRangeChange} className="mb-4" />
            <div className="flex items-center space-x-2">
              <Input type="number" placeholder={t('min')} value={filters.minBudget} onChange={(e) => handleInputChange('minBudget', e.target.value)} className="w-full" />
              <span>{t('common.to', 'to')}</span>
              <Input type="number" placeholder={t('max')} value={filters.maxBudget} onChange={(e) => handleInputChange('maxBudget', e.target.value)} className="w-full" />
            </div>
          </div>
        </div>

        {/* Ownership Section */}
        <div>
          <h3 className="font-medium text-lg mb-3">{t('ownership')}</h3>
          <div className="space-y-2">
            {ownershipTypes.map((key) => (
              <div className="flex items-center space-x-2" key={key}>
                <Checkbox
                  id={`adv-${key}`}
                  checked={filters.ownership.includes(key)}
                  onCheckedChange={() => handleCheckboxChange('ownership', key)}
                />
                <Label htmlFor={`adv-${key}`}>{t(key)}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Posted By Section */}
        <div>
          <h3 className="font-medium text-lg mb-3">{t('postedBy')}</h3>
          <div className="space-y-2">
            {postedByTypes.map((key) => (
              <div className="flex items-center space-x-2" key={key}>
                <Checkbox
                  id={`adv-${key}`}
                  checked={filters.postedBy.includes(key === 'owner' ? 'user' : key)}
                  onCheckedChange={() => handleCheckboxChange('postedBy', key === 'owner' ? 'user' : key)}
                />
                <Label htmlFor={`adv-${key}`}>{t(key)}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Facing Section */}
        <div>
          <h3 className="font-medium text-lg mb-3">{t('facing')}</h3>
          <div className="space-y-2">
            {facingTypes.map((key) => (
              <div className="flex items-center space-x-2" key={key}>
                <Checkbox
                  id={`adv-${key}`}
                  checked={filters.facing.includes(key.charAt(0).toUpperCase() + key.slice(1))}
                  onCheckedChange={() => handleCheckboxChange('facing', key.charAt(0).toUpperCase() + key.slice(1))}
                />
                <Label htmlFor={`adv-${key}`}>{t(key)}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Media Filters Section */}
        <div>
          <h3 className="font-medium text-lg mb-3">{t('mediaVerification')}</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="adv-with-photos" checked={filters.onlyWithPhotos} onCheckedChange={() => handleToggleChange('onlyWithPhotos')} />
              <Label htmlFor="adv-with-photos">{t('withPhotos')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="adv-with-videos" checked={filters.onlyWithVideos} onCheckedChange={() => handleToggleChange('onlyWithVideos')} />
              <Label htmlFor="adv-with-videos">{t('withVideos')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="adv-verified" checked={filters.verifiedProperties} onCheckedChange={() => handleToggleChange('verifiedProperties')} />
              <Label htmlFor="adv-verified">{t('verified')}</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 mt-6">
        <Button variant="outline" onClick={resetFilters}>{t('resetAll')}</Button>
        <Button onClick={applyFilters}>{t('applyFilters')}</Button>
      </div>
    </div>
  );
}
