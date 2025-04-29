// src/components/admin/SettingsManagement.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, RefreshCw, Save, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FooterContentManagement from "./FooterContentManagement";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { countries } from "../../lib/countries";
import { apiRequest } from "@/lib/queryClient";

// Zod schema for data generation form
const dataGenerationSchema = z.object({
  clearExisting: z.boolean().default(false),
});

// --- Zod schema for site settings - UPDATED ---
const siteSettingsSchema = z.object({
  siteName: z.string().min(1, { message: "Site name is required" }),
  brandName: z.string().min(1, { message: "Brand name is required" }),
  footerCopyright: z.string().min(1, { message: "Footer copyright text is required" }),
  contactPhone: z.string().min(1, { message: "Contact phone is required" }),
  contactEmail: z.string().email({ message: "Please enter a valid email address" }),
  defaultLanguage: z.string().default("en"),
  showAdminLink: z.boolean().default(true),
  // --- ADDED heroImageUrl ---
  heroImageUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')).nullable(), // Optional, allows empty string or null
});

// Zod schema for currency settings
const currencySettingsSchema = z.object({
  currency: z.string({ required_error: "Please select a currency" }),
  symbol: z.string().min(1, { message: "Currency symbol is required" }),
  position: z.enum(["before", "after"], { required_error: "Please select symbol position" }),
});

type DataGenerationValues = z.infer<typeof dataGenerationSchema>;
type SiteSettingsValues = z.infer<typeof siteSettingsSchema>; // Type now includes heroImageUrl
type CurrencySettingsValues = z.infer<typeof currencySettingsSchema>;

// Define currency settings type
interface CurrencySettingsResponse {
  currency: string;
  symbol: string;
  position: 'before' | 'after';
}

// --- Define site settings type - UPDATED ---
interface SiteSettingsResponse {
  siteName: string;
  brandName: string;
  footerCopyright: string;
  contactPhone: string;
  contactEmail: string;
  defaultLanguage: string;
  showAdminLink: boolean;
  // --- ADDED heroImageUrl ---
  heroImageUrl?: string | null; // Make it optional and nullable
}

const currencies = [ /* ... keep currencies array as is ... */
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "GBP", label: "British Pound", symbol: "£" },
  { value: "JPY", label: "Japanese Yen", symbol: "¥" },
  { value: "INR", label: "Indian Rupee", symbol: "₹" },
  { value: "CNY", label: "Chinese Yuan", symbol: "¥" },
  { value: "AUD", label: "Australian Dollar", symbol: "A$" },
  { value: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { value: "CHF", label: "Swiss Franc", symbol: "CHF" },
  { value: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { value: "RUB", label: "Russian Ruble", symbol: "₽" },
  { value: "BRL", label: "Brazilian Real", symbol: "R$" },
  { value: "SEK", label: "Swedish Krona", symbol: "kr" },
  { value: "NOK", label: "Norwegian Krone", symbol: "kr" },
  { value: "MXN", label: "Mexican Peso", symbol: "$" },
  { value: "ZAR", label: "South African Rand", symbol: "R" },
  { value: "AED", label: "UAE Dirham", symbol: "د.إ" },
  { value: "SAR", label: "Saudi Riyal", symbol: "﷼" },
];

export function SettingsManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("data-generation");
  const queryClient = useQueryClient();

  // Fetch current currency settings using apiRequest
  const { data: currencySettings, isLoading: isLoadingCurrency } = useQuery<CurrencySettingsResponse, Error>({
    queryKey: ['/settings/currency'], // Public endpoint
    queryFn: async () => await apiRequest<CurrencySettingsResponse>('GET', '/settings/currency'),
    staleTime: 300000, // 5 minutes
  });

  // Fetch current site settings using apiRequest
  const { data: siteSettings, isLoading: isLoadingSite } = useQuery<SiteSettingsResponse, Error>({
    queryKey: ['/settings/site'], // Public endpoint
    queryFn: async () => await apiRequest<SiteSettingsResponse>('GET', '/settings/site'),
    staleTime: 300000, // 5 minutes
  });

  // Form for data generation
  const dataForm = useForm<{ clearExisting: boolean }>({
    resolver: zodResolver(dataGenerationSchema),
    defaultValues: { clearExisting: false },
  });

  // Form for currency settings
  const currencyForm = useForm<CurrencySettingsValues>({
    resolver: zodResolver(currencySettingsSchema),
    defaultValues: { currency: "USD", symbol: "$", position: "before" },
  });

  // --- Form for site settings - UPDATED defaultValues ---
  const siteForm = useForm<SiteSettingsValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      siteName: "HomeHarbor", brandName: "HomeHarbor",
      footerCopyright: `© ${new Date().getFullYear()} HomeHarbor. All rights reserved.`,
      contactPhone: "+358 123 456 789", contactEmail: "info@homeharbor.com",
      defaultLanguage: "en", showAdminLink: true,
      // --- ADDED default ---
      heroImageUrl: "", // Default to empty string
    },
  });

  // Update currency form when settings are loaded
  useEffect(() => {
    if (currencySettings) {
      currencyForm.reset(currencySettings);
    }
  }, [currencySettings, currencyForm]);

  // --- Update site form when settings are loaded - UPDATED ---
  useEffect(() => {
    if (siteSettings) {
      siteForm.reset({
        ...siteSettings,
        // --- ADDED heroImageUrl reset ---
        // Ensure it's a string for the form, handle null/undefined from API
        heroImageUrl: siteSettings.heroImageUrl || "",
      });
    }
  }, [siteSettings, siteForm]);

  // Set symbol when currency changes
  const onCurrencyChange = (currency: string) => {
    const selectedCurrency = currencies.find((c) => c.value === currency);
    if (selectedCurrency) {
      currencyForm.setValue("symbol", selectedCurrency.symbol);
    }
  };

  // Data generation mutation using apiRequest
  const generateDataMutation = useMutation<any, Error, { clearExisting: boolean }>({
    mutationFn: async (data) => {
      return await apiRequest('POST', '/admin/generate-data', data);
    },
    onSuccess: (data) => {
      toast({
        title: 'Database Reseeded',
        description: data.message || 'Database reseeded using main seed script.',
      });
      dataForm.reset({ clearExisting: false });
    },
    onError: (error) => {
      toast({ title: 'Error Reseeding Database', description: error.message || 'Unknown error', variant: 'destructive' });
    },
  });

  // Currency settings mutation using apiRequest
  const updateCurrencyMutation = useMutation<{ success: boolean }, Error, CurrencySettingsValues>({
    mutationFn: async (data) => {
      return await apiRequest('POST', '/admin/settings/currency', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/settings/currency'] }); // Invalidate public endpoint
      queryClient.invalidateQueries({ queryKey: ['/admin/settings/currency'] }); // Also invalidate admin if different
      toast({ title: "Currency Settings Updated", description: "Currency settings updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Error Updating Currency Settings", description: error.message || "Unknown error", variant: "destructive" });
    },
  });

  // --- Site settings mutation using apiRequest - UPDATED ---
  const updateSiteSettingsMutation = useMutation<{ success: boolean; settings: SiteSettingsResponse }, Error, SiteSettingsValues>({
    mutationFn: async (data) => {
      // Prepare payload, ensuring heroImageUrl is null if empty string
      const payload = {
        ...data,
        heroImageUrl: data.heroImageUrl === "" ? null : data.heroImageUrl,
      };
      // Use the correct admin endpoint for POSTing updates
      return await apiRequest<{ success: boolean; settings: SiteSettingsResponse }>('POST', '/admin/settings/site', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/settings/site'] }); // Invalidate public endpoint
      queryClient.invalidateQueries({ queryKey: ['/admin/settings/site'] }); // Also invalidate admin if different
      toast({ title: "Site Settings Updated", description: "Site settings updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Error Updating Site Settings", description: error.message || "Unknown error", variant: "destructive" });
    },
  });

  // Clear all data mutation using apiRequest
  const clearAllDataMutation = useMutation<any, Error>({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/admin/clear-all-data');
    },
    onSuccess: () => {
      toast({ title: "All Data Cleared", description: "All properties and locations removed." });
      // Optionally invalidate other relevant queries like properties, locations
      queryClient.invalidateQueries({ queryKey: ['/admin/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/admin/locations'] });
    },
    onError: (error) => {
      toast({ title: "Error Clearing Data", description: error.message || "Unknown error", variant: "destructive" });
    },
  });

  // Handle form submissions
  const onGenerateData = (data: { clearExisting: boolean }) => generateDataMutation.mutate(data);
  const onUpdateCurrency = (data: CurrencySettingsValues) => updateCurrencyMutation.mutate(data);
  const onUpdateSiteSettings = (data: SiteSettingsValues) => updateSiteSettingsMutation.mutate(data);
  const onClearAllData = () => {
    if (window.confirm("Are you sure you want to delete all properties and locations? This action cannot be undone.")) {
      clearAllDataMutation.mutate();
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage application settings and configurations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-5">
          <TabsTrigger value="data-generation">Data Generation</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="site">Site</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Data Generation Tab */}
        <TabsContent value="data-generation">
          <Card>
            <CardHeader>
              <CardTitle>Reseed Demo Data</CardTitle>
              <CardDescription>
                This will <b>delete all existing data</b> and replace it with fresh demo data (users, properties, locations, blog, etc).<br />
                <span className="text-red-500">This action cannot be undone.</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...dataForm}>
                <form onSubmit={dataForm.handleSubmit((data) => generateDataMutation.mutate(data))} className="space-y-6">
                  <FormField control={dataForm.control} name="clearExisting" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Reseed Demo Data</FormLabel>
                        <FormDescription>
                          This will remove all existing data and reseed the database with demo/demo-like data for all entities.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />
                  {dataForm.watch('clearExisting') && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>
                        This will permanently delete all existing data and replace it with demo data. This action cannot be undone.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" disabled={!dataForm.watch('clearExisting') || generateDataMutation.isPending} className="w-full">
                    {generateDataMutation.isPending ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Reseeding...</>
                    ) : (
                      'Reseed Demo Data'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Currency Tab */}
        <TabsContent value="currency">
          {/* ... Currency Form ... */}
           <Card>
            <CardHeader>
              <CardTitle>Currency Settings</CardTitle>
              <CardDescription>Configure currency display options</CardDescription>
            </CardHeader>
            {/* Current Settings Display */}
            {isLoadingCurrency ? <Loader2 className="m-4 h-6 w-6 animate-spin" /> : currencySettings && (
              <CardContent className="pb-3">
                <div className="bg-muted p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-medium mb-2">Current Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-sm font-medium text-muted-foreground">Currency</p><p className="text-base">{currencySettings.currency}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Symbol</p><p className="text-base">{currencySettings.symbol}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Position</p><p className="text-base capitalize">{currencySettings.position}</p></div>
                  </div>
                  <div className="mt-4"><p className="text-sm font-medium text-muted-foreground">Example</p><p className="text-base">{currencySettings.position === "before" ? `${currencySettings.symbol}1000` : `1000 ${currencySettings.symbol}`}</p></div>
                </div>
              </CardContent>
            )}
            {/* Currency Form */}
            <CardContent>
              <Form {...currencyForm}>
                <form onSubmit={currencyForm.handleSubmit(onUpdateCurrency)} className="space-y-6">
                  {/* Currency Field */}
                  <FormField control={currencyForm.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); onCurrencyChange(value); }} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a currency" /></SelectTrigger></FormControl>
                        <SelectContent>{currencies.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label} ({c.symbol})</SelectItem>))}</SelectContent>
                      </Select>
                      <FormDescription>Select the currency for property prices</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  {/* Symbol Field */}
                  <FormField control={currencyForm.control} name="symbol" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency Symbol</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormDescription>Symbol for the selected currency</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  {/* Position Field */}
                  <FormField control={currencyForm.control} name="position" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol Position</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="before">Before amount ($100)</SelectItem><SelectItem value="after">After amount (100€)</SelectItem></SelectContent>
                      </Select>
                      <FormDescription>Where to display the currency symbol</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  {/* Submit Button */}
                  <Button type="submit" disabled={updateCurrencyMutation.isPending} className="w-full">
                    {updateCurrencyMutation.isPending ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Updating...</>) : (<><Save className="mr-2 h-4 w-4" /> Save Currency Settings</>)}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Settings Tab - UPDATED */}
        <TabsContent value="site">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>Configure general site information</CardDescription>
            </CardHeader>
             {/* Current Settings Display - UPDATED */}
            {isLoadingSite ? <Loader2 className="m-4 h-6 w-6 animate-spin" /> : siteSettings && (
              <CardContent className="pb-3">
                <div className="bg-muted p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-medium mb-2">Current Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm font-medium text-muted-foreground">Site Name</p><p className="text-base">{siteSettings.siteName}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Brand Name</p><p className="text-base">{siteSettings.brandName}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Contact Phone</p><p className="text-base">{siteSettings.contactPhone}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Contact Email</p><p className="text-base">{siteSettings.contactEmail}</p></div>
                    {/* --- ADDED: Display Hero Image URL --- */}
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Hero Image URL</p>
                      <p className="text-base break-all">
                        {siteSettings.heroImageUrl ? (
                          <a href={siteSettings.heroImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {siteSettings.heroImageUrl}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">(Not Set)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4"><p className="text-sm font-medium text-muted-foreground">Footer Copyright</p><p className="text-base">{siteSettings.footerCopyright}</p></div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div><p className="text-sm font-medium text-muted-foreground">Default Language</p><p className="text-base">{siteSettings.defaultLanguage}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Show Admin Link</p><p className="text-base">{siteSettings.showAdminLink ? "Yes" : "No"}</p></div>
                  </div>
                </div>
              </CardContent>
            )}
            {/* Site Settings Form - UPDATED */}
            <CardContent>
              <Form {...siteForm}>
                <form onSubmit={siteForm.handleSubmit(onUpdateSiteSettings)} className="space-y-6">
                  {/* Site Name Field */}
                  <FormField control={siteForm.control} name="siteName" render={({ field }) => (<FormItem><FormLabel>Site Name</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Displayed in browser title bar</FormDescription><FormMessage /></FormItem>)}/>
                  {/* Brand Name Field */}
                  <FormField control={siteForm.control} name="brandName" render={({ field }) => (<FormItem><FormLabel>Brand Name</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Displayed in navbar</FormDescription><FormMessage /></FormItem>)}/>
                  {/* --- ADDED: Hero Image URL Field --- */}
                  <FormField control={siteForm.control} name="heroImageUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero Image URL</FormLabel>
                      <FormControl><Input type="url" placeholder="https://example.com/hero.jpg" {...field} value={field.value ?? ''} /></FormControl>
                      <FormDescription>URL for the main background image on the homepage hero section. Leave blank to use default.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  {/* Footer Copyright Field */}
                  <FormField control={siteForm.control} name="footerCopyright" render={({ field }) => (<FormItem><FormLabel>Footer Copyright Text</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Displayed in the footer</FormDescription><FormMessage /></FormItem>)}/>
                  {/* Contact Phone Field */}
                  <FormField control={siteForm.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Displayed in the header</FormDescription><FormMessage /></FormItem>)}/>
                  {/* Contact Email Field */}
                  <FormField control={siteForm.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormDescription>Displayed in the header</FormDescription><FormMessage /></FormItem>)}/>
                  {/* Default Language Field */}
                  <FormField control={siteForm.control} name="defaultLanguage" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Language</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a language" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="fi">Finnish</SelectItem><SelectItem value="sv">Swedish</SelectItem></SelectContent>
                      </Select>
                      <FormDescription>Default language for the application</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  {/* Show Admin Link Field */}
                  <FormField control={siteForm.control} name="showAdminLink" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5"><FormLabel className="text-base">Show Admin Link in Footer</FormLabel><FormDescription>Display link to admin panel in footer</FormDescription></div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}/>
                  {/* Submit Button */}
                  <Button type="submit" disabled={updateSiteSettingsMutation.isPending} className="w-full">
                    {updateSiteSettingsMutation.isPending ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Updating...</>) : (<><Save className="mr-2 h-4 w-4" /> Save Site Settings</>)}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer">
          <FooterContentManagement />
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          {/* ... Maintenance Form ... */}
           <Card>
            <CardHeader>
              <CardTitle>Maintenance Tools</CardTitle>
              <CardDescription>Advanced tools for system maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2"><h3 className="text-lg font-medium">Database Operations</h3><p className="text-sm text-muted-foreground">Manage database data</p></div>
              <Separator />
              <div className="rounded-lg border p-4">
                <div className="flex flex-col space-y-2 pb-4"><h4 className="font-medium">Clear All Data</h4><p className="text-sm text-muted-foreground">Remove all properties and locations. Cannot be undone.</p></div>
                <div className="flex justify-end">
                  <Button variant="destructive" onClick={onClearAllData} disabled={clearAllDataMutation.isPending}>
                    {clearAllDataMutation.isPending ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Clearing...</>) : (<><Trash2 className="mr-2 h-4 w-4" /> Clear All Data</>)}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

