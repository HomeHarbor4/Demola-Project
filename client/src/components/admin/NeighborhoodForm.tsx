// src/components/admin/NeighborhoodForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { insertNeighborhoodSchema, type Neighborhood } from "@shared/schema";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";


// Define the form schema based on the insert schema
const formSchema = insertNeighborhoodSchema; // Use the schema directly
type FormValues = z.infer<typeof formSchema>;

interface NeighborhoodFormProps {
  onSubmit: (values: FormValues) => Promise<void>; // Function to handle form submission
  initialData?: Neighborhood | null; // Optional initial data for editing
  isLoading?: boolean; // Optional loading state from parent
  onCancel?: () => void; // Optional cancel handler
}

export function NeighborhoodForm({ onSubmit, initialData = null, isLoading = false, onCancel }: NeighborhoodFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // Set default values based on initialData or empty strings/defaults
    defaultValues: {
      name: initialData?.name || "",
      city: initialData?.city || "",
      description: initialData?.description || "",
      image: initialData?.image || "",
      averagePrice: initialData?.averagePrice ? Number(initialData.averagePrice) : undefined,
      populationDensity: initialData?.populationDensity || undefined,
      walkScore: initialData?.walkScore || undefined,
      transitScore: initialData?.transitScore || undefined,
      latitude: initialData?.latitude ? Number(initialData.latitude) : undefined,
      longitude: initialData?.longitude ? Number(initialData.longitude) : undefined,
      active: initialData?.active ?? true, // Default to true for new entries
    },
  });

  // Reset form if initialData changes (e.g., when switching between edit forms)
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        city: initialData.city || "",
        description: initialData.description || "",
        image: initialData.image || "",
        averagePrice: initialData.averagePrice ? Number(initialData.averagePrice) : undefined,
        populationDensity: initialData.populationDensity || undefined,
        walkScore: initialData.walkScore || undefined,
        transitScore: initialData.transitScore || undefined,
        latitude: initialData.latitude ? Number(initialData.latitude) : undefined,
        longitude: initialData.longitude ? Number(initialData.longitude) : undefined,
        active: initialData.active ?? true,
      });
    } else {
       form.reset({ // Reset to defaults for creation
          name: "", city: "", description: "", image: "",
          averagePrice: undefined, populationDensity: undefined,
          walkScore: undefined, transitScore: undefined,
          latitude: undefined, longitude: undefined,
          active: true
       });
    }
  }, [initialData, form]);

  const handleFormSubmit = (values: FormValues) => {
    // Convert potentially empty strings for numbers back to undefined if needed by backend/schema
    // Zod's coerce should handle this, but double-checking can be useful
    const processedValues = {
        ...values,
        averagePrice: values.averagePrice || undefined,
        populationDensity: values.populationDensity || undefined,
        walkScore: values.walkScore || undefined,
        transitScore: values.transitScore || undefined,
        latitude: values.latitude || undefined,
        longitude: values.longitude || undefined,
    };
    onSubmit(processedValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Neighborhood Name*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Mitte" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Berlin" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the neighborhood..." {...field} value={field.value ?? ''} disabled={isLoading} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image */}
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/image.jpg" {...field} value={field.value ?? ''} disabled={isLoading} />
              </FormControl>
              <FormDescription>URL of an image representing the neighborhood.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Statistics */}
        <h3 className="text-lg font-medium pt-4 border-t">Statistics (Optional)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="averagePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Average Price (€)</FormLabel>
                <FormControl>
                  {/* Use text input and rely on zod coerce */}
                  <Input type="text" inputMode="decimal" placeholder="e.g., 500000" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="populationDensity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pop. Density (/km²)</FormLabel>
                <FormControl>
                  <Input type="text" inputMode="numeric" placeholder="e.g., 4000" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="walkScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Walk Score (0-100)</FormLabel>
                <FormControl>
                  <Input type="text" inputMode="numeric" placeholder="e.g., 95" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="transitScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transit Score (0-100)</FormLabel>
                <FormControl>
                  <Input type="text" inputMode="numeric" placeholder="e.g., 80" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location */}
         <h3 className="text-lg font-medium pt-4 border-t">Location (Optional)</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="text" inputMode="decimal" placeholder="e.g., 52.5200" {...field} value={field.value ?? ''} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="text" inputMode="decimal" placeholder="e.g., 13.4050" {...field} value={field.value ?? ''} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
         </div>

         {/* Active Status */}
         <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-slate-50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    id="active-checkbox"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <Label htmlFor="active-checkbox">
                    Active
                  </Label>
                  <FormDescription>
                    Make this neighborhood visible on the public site.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

        {/* Submit/Cancel Buttons */}
        <div className="flex justify-end gap-4 pt-4">
           {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                 Cancel
              </Button>
           )}
           <Button type="submit" disabled={isLoading}>
             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             {initialData ? "Update Neighborhood" : "Create Neighborhood"}
           </Button>
        </div>
      </form>
    </Form>
  );
}
