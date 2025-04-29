// src/components/admin/PropertyForm.tsx
import React, { useState, useEffect } from "react"; // Added useEffect
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label"; // Keep Label import
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient"; // Ensure apiRequest is imported

// Define the form schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().min(20, "Description must be at least 20 characters long"),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Price must be a valid non-negative number",
  }),
  area: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Area must be a valid positive number",
  }),
  bedrooms: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
    message: "Bedrooms must be a valid non-negative number",
  }),
  bathrooms: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
    message: "Bathrooms must be a valid non-negative number",
  }),
  propertyType: z.string().min(1, "Property type is required"),
  listingType: z.string().min(1, "Listing type is required"),
  status: z.string().min(1, "Status is required"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  city: z.string().min(2, "City must be at least 2 characters long"),
  postalCode: z.string().min(4, "Postal code must be at least 4 characters long"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  images: z.string().optional(), // Make images optional initially
  userId: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: "User ID must be a valid number",
  }),
  isFeatured: z.boolean().default(false),
  isVerified: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

// Define types for fetched data
interface User {
  id: number;
  name: string;
  role: string;
}

interface Location {
  id: number;
  name: string;
  city: string;
}

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  listingType: string;
  status: string;
  address: string;
  city: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  userId: number;
  featured: boolean;
  verified: boolean;
  features?: string[];
}

export function PropertyForm({ propertyId, onSuccessCallback }: { propertyId?: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!propertyId;
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState<string>("");

  // Fetch users for user selection using apiRequest
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[], Error>({
    queryKey: ['/admin/users'], // Use admin endpoint if needed
    queryFn: async () => await apiRequest<User[]>('GET', '/admin/users'),
    staleTime: Infinity, // Users list likely doesn't change often
  });

  // Fetch locations for city selection using apiRequest
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery<Location[], Error>({
    queryKey: ['/locations'], // Public endpoint likely okay
    queryFn: async () => await apiRequest<Location[]>('GET', '/locations'),
    staleTime: Infinity, // Locations list likely doesn't change often
  });

  // If editing, fetch property data using apiRequest
  const { data: property, isLoading: isLoadingProperty } = useQuery<Property, Error>({
    queryKey: [`/properties/${propertyId}`], // Use public property endpoint
    enabled: isEditing, // Only run if propertyId exists
    queryFn: async () => {
      if (!propertyId) throw new Error("Property ID required for editing");
      return await apiRequest<Property>('GET', `/properties/${propertyId}`);
    },
    staleTime: 5 * 60 * 1000, // Cache property data for 5 mins
  });

  // Set default form values
  const defaultValues: Partial<FormValues> = {
    title: "", description: "", price: "", area: "", bedrooms: "0", bathrooms: "0",
    propertyType: "", listingType: "", status: "active", address: "", city: "",
    postalCode: "", latitude: "", longitude: "", images: "", userId: "",
    isFeatured: false, isVerified: false,
  };

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Fill the form with existing data if editing
  useEffect(() => {
    if (isEditing && property) {
      form.reset({
        title: property.title,
        description: property.description,
        price: property.price.toString(),
        area: property.area.toString(),
        bedrooms: property.bedrooms.toString(),
        bathrooms: property.bathrooms.toString(),
        propertyType: property.propertyType,
        listingType: property.listingType,
        status: property.status,
        address: property.address,
        city: property.city,
        postalCode: property.postalCode || "",
        latitude: property.latitude?.toString() || "",
        longitude: property.longitude?.toString() || "",
        images: property.images?.join(",") || "",
        userId: property.userId.toString(),
        isFeatured: property.featured,
        isVerified: property.verified,
      });
      setFeatures(property.features || []);
    }
  }, [property, isEditing, form]);

  // Define city options based on fetched locations
  // Use a Set to get unique city names
  const cityOptions = Array.from(new Set(locations.map(loc => loc.city)))
                           .map(city => ({ label: city, value: city }))
                           .sort((a, b) => a.label.localeCompare(b.label));


  // Property type options
  const propertyTypeOptions = [
    { label: "Apartment", value: "apartment" }, { label: "House", value: "house" },
    { label: "Townhouse", value: "townhouse" }, { label: "Villa", value: "villa" },
    { label: "Penthouse", value: "penthouse" }, { label: "Studio", value: "studio" },
    { label: "Commercial", value: "commercial" }, { label: "Land", value: "land" },
    { label: "Cottage", value: "cottage" }, {label: "Office", value: "office"}
  ];

  // Listing type options
  const listingTypeOptions = [
    { label: "For Sale", value: "buy" }, { label: "For Rent", value: "rent" },
    // { label: "Commercial", value: "commercial" }, // Often tied to property type
  ];

  // Status options
  const statusOptions = [
    { label: "Active", value: "active" }, { label: "Pending", value: "pending" },
    { label: "Sold", value: "sold" }, { label: "Rented", value: "rented" },
    { label: "Draft", value: "draft" },
  ];

  // Handle adding/removing features
  const handleAddFeature = () => {
    if (featureInput.trim() && !features.includes(featureInput.trim())) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };
  const handleRemoveFeature = (featureToRemove: string) => {
    setFeatures(features.filter((f) => f !== featureToRemove));
  };

  // Create property mutation (already uses apiRequest)
  const createPropertyMutation = useMutation<Property, Error, any>({ // Use 'any' for preparedData type flexibility
    mutationFn: async (data) => await apiRequest<Property>('POST', '/properties', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Property created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/admin/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/properties'] });
      form.reset(defaultValues);
      setFeatures([]);
      setIsSubmitting(false);
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to create property: ${error.message}`, variant: "destructive" });
      setIsSubmitting(false);
    },
  });

  // Update property mutation (already uses apiRequest)
  const updatePropertyMutation = useMutation<Property, Error, { id: number; data: any }>({ // Use 'any' for data type
    mutationFn: async ({ id, data }) => await apiRequest<Property>('PUT', `/properties/${id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Property updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/admin/properties'] });
      queryClient.invalidateQueries({ queryKey: [`/properties/${propertyId}`] });
      setIsSubmitting(false);
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to update property: ${error.message}`, variant: "destructive" });
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    // Convert string inputs to appropriate types
    const preparedData = {
      ...values, // Spread validated form values
      price: parseFloat(values.price),
      area: parseFloat(values.area),
      bedrooms: parseInt(values.bedrooms),
      bathrooms: parseInt(values.bathrooms),
      features, // Add the features array
      latitude: values.latitude ? parseFloat(values.latitude) : null,
      longitude: values.longitude ? parseFloat(values.longitude) : null,
      images: values.images?.split(",").map(img => img.trim()).filter(img => img) || [], // Handle optional images
      userId: parseInt(values.userId),
      featured: values.isFeatured, // Rename for backend consistency if needed
      verified: values.isVerified, // Rename for backend consistency if needed
    };

    // Remove isFeatured and isVerified if names differ in backend schema
    // delete preparedData.isFeatured;
    // delete preparedData.isVerified;

    try {
      if (isEditing && propertyId) {
        await updatePropertyMutation.mutateAsync({ id: propertyId, data: preparedData });
      } else {
        await createPropertyMutation.mutateAsync(preparedData);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false); // Ensure reset on unexpected error
    }
  };

  // Combined loading state
  const isLoading = isLoadingUsers || isLoadingLocations || (isEditing && isLoadingProperty);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            {/* Title */}
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title*</FormLabel><FormControl><Input placeholder="Enter property title" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            {/* Description */}
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description*</FormLabel><FormControl><Textarea placeholder="Enter property description" className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            {/* Price */}
            <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Enter property price" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            {/* Area */}
            <FormField control={form.control} name="area" render={({ field }) => (<FormItem><FormLabel>Area (sq.m)*</FormLabel><FormControl><Input type="number" step="0.1" placeholder="Enter property area" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            {/* Bedrooms/Bathrooms */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="bedrooms" render={({ field }) => (<FormItem><FormLabel>Bedrooms*</FormLabel><FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="bathrooms" render={({ field }) => (<FormItem><FormLabel>Bathrooms*</FormLabel><FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>)}/>
            </div>
            {/* Property Type */}
            <FormField control={form.control} name="propertyType" render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger></FormControl>
                  <SelectContent>{propertyTypeOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            {/* Listing Type */}
            <FormField control={form.control} name="listingType" render={({ field }) => (
              <FormItem>
                <FormLabel>Listing Type*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select listing type" /></SelectTrigger></FormControl>
                  <SelectContent>{listingTypeOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            {/* Status */}
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                  <SelectContent>{statusOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
          </div>

          {/* Location & Additional Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Location & Additional Info</h3>
            {/* Address */}
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address*</FormLabel><FormControl><Input placeholder="Enter property address" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            {/* City */}
             <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>City*</FormLabel>
                 <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger></FormControl>
                  <SelectContent>{cityOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
                {/* <FormControl><Input placeholder="Enter city name" {...field} /></FormControl> */}
                <FormMessage />
              </FormItem>
            )}/>
            {/* Postal Code */}
            <FormField control={form.control} name="postalCode" render={({ field }) => (<FormItem><FormLabel>Postal Code*</FormLabel><FormControl><Input placeholder="Enter postal code" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            {/* Lat/Lon */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="latitude" render={({ field }) => (<FormItem><FormLabel>Latitude</FormLabel><FormControl><Input placeholder="e.g., 65.0121" {...field} value={field.value || ""} /></FormControl><FormDescription>Optional</FormDescription><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="longitude" render={({ field }) => (<FormItem><FormLabel>Longitude</FormLabel><FormControl><Input placeholder="e.g., 25.4651" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)}/>
            </div>
            {/* Images */}
            <FormField control={form.control} name="images" render={({ field }) => (
              <FormItem>
                <FormLabel>Images</FormLabel>
                <FormControl><Input placeholder="Enter image URLs separated by commas" {...field} value={field.value || ""} /></FormControl>
                <FormDescription>Multiple URLs separated by commas</FormDescription>
                <FormMessage />
              </FormItem>
            )}/>
            {/* Owner/Agent */}
            <FormField control={form.control} name="userId" render={({ field }) => (
              <FormItem>
                <FormLabel>Owner/Agent*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select owner/agent" /></SelectTrigger></FormControl>
                  <SelectContent>{users.map((user) => (<SelectItem key={user.id} value={user.id.toString()}>{user.name} ({user.role})</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            {/* Features */}
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} placeholder="Add a feature (e.g., Sauna)" className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); }}}/>
                <Button type="button" variant="outline" onClick={handleAddFeature}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-sm">
                    <span>{feature}</span>
                    <button type="button" onClick={() => handleRemoveFeature(feature)} className="text-slate-500 hover:text-red-500 text-xs font-bold ml-1">×</button>
                  </div>
                ))}
              </div>
            </div>
            {/* Featured/Verified */}
            <div className="flex flex-col gap-2 pt-2">
              <FormField control={form.control} name="isFeatured" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="cursor-pointer !mt-0">Featured Property</FormLabel></FormItem>)}/>
              <FormField control={form.control} name="isVerified" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="cursor-pointer !mt-0">Verified Property</FormLabel></FormItem>)}/>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Property" : "Create Property"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
