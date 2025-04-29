import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import config from '../config'; // Assuming you have the config file

// Define the shape of our site settings
export interface SiteSettings {
  siteName: string;
  brandName: string;
  footerCopyright: string;
  contactPhone: string;
  contactEmail: string;
  defaultLanguage: string;
  showAdminLink: boolean;
  heroImageUrl: string;
  siteTitle?: string;
  siteDescription?: string;
}

// Default settings used as fallback if API fails or during initial load
const defaultSettings: SiteSettings = {
  siteName: "HomeHarbor",
  brandName: "HomeHarbor",
  footerCopyright: `© ${new Date().getFullYear()} HomeHarbor. All rights reserved.`,
  contactPhone: "+358 123 456 789",
  contactEmail: "info@homeharbor.com",
  defaultLanguage: "en",
  showAdminLink: true,
  heroImageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
  siteTitle: "",
  siteDescription: ""
};

// Create the context with default values
interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean; // Keep loading for consumers if needed
  error: Error | null; // Keep error for consumers if needed
  refreshSettings: () => void;
}

// Define the query key
const siteSettingsQueryKey = ['siteSettings'];

// Define the fetch function for react-query
const fetchSiteSettings = async (): Promise<SiteSettings> => {
  const response = await fetch(`${config.apiBaseUrl}/settings/site`); // Use config
  if (!response.ok) {
    // Try to get error message from response body if possible
    let errorBody = 'Failed to fetch site settings';
    try {
      const body = await response.json();
      errorBody = body.error || errorBody;
    } catch (e) {
      // Ignore if response body is not JSON
    }
    throw new Error(errorBody);
  }
  const data = await response.json();
  // Optional: Add validation here (e.g., with Zod) if needed
  return data as SiteSettings;
};


const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaultSettings,
  loading: true, // Start as loading
  error: null,
  refreshSettings: () => {}
});

// Custom hook for using site settings
export const useSiteSettings = () => useContext(SiteSettingsContext);

// Provider component
export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const {
    data: fetchedSettings,
    isLoading,
    error,
    isError,
  } = useQuery<SiteSettings, Error>({
    queryKey: siteSettingsQueryKey,
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
    // Use defaultSettings as placeholder while loading or if error occurs
    placeholderData: defaultSettings,
    // Or use initialData if you want it treated as fresh data initially
    // initialData: defaultSettings,
  });

  // Determine the settings to provide: fetched data or fallback to default
  // Use placeholderData behavior: if loading or error, use defaultSettings
  const settings = fetchedSettings ?? defaultSettings;

  // Update document title when settings change
  useEffect(() => {
    // Ensure settings.siteName exists before setting title
    if (settings?.siteName) {
       document.title = settings.siteName;
    } else {
       // Optionally set a default title if settings.siteName is missing
       document.title = defaultSettings.siteName;
    }
  }, [settings?.siteName]); // Depend on settings.siteName

  // Function to manually refresh settings by invalidating the query
  const refreshSettings = () => {
    queryClient.invalidateQueries({ queryKey: siteSettingsQueryKey });
  };

  // Log error if fetching failed
  useEffect(() => {
    if (isError && error) {
      console.error('Error fetching site settings:', error);
    }
  }, [isError, error]);

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading: isLoading, // Provide the loading state from useQuery
        error: isError ? error : null, // Provide the error state from useQuery
        refreshSettings
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};
