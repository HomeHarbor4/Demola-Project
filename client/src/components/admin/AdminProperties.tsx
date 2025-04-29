// src/components/admin/AdminProperties.tsx
import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Edit, Trash2, CheckCircle, Star, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest
import { PropertyForm } from "@/components/admin/PropertyForm";
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

interface PropertyData {
  id: number;
  title: string;
  price: number;
  city: string;
  propertyType: string;
  listingType: string;
  status: string;
  featured: boolean;
  verified: boolean;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PropertiesResponse {
  properties: PropertyData[];
  pagination: PaginationData;
}

export function AdminProperties() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { settings: siteSettings } = useSiteSettings();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [limit] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      // Only update and reset page if the debounced value is actually changing
      if (searchInput !== debouncedSearchQuery) {
        setDebouncedSearchQuery(searchInput);
        setPage(1); // Reset page only when the actual search term changes
      }
    }, 500); // 500ms delay

    // Cleanup function: clear the timer if searchInput changes before the delay is up
    return () => clearTimeout(handler);
    // Keep dependencies: trigger effect on input change, compare against current debounced value
  }, [searchInput, debouncedSearchQuery]);

  // Get properties with pagination using apiRequest
  const { data, isLoading, isError, error, isFetching } = useQuery<PropertiesResponse, Error>({
    queryKey: ['/admin/properties', page, limit, debouncedSearchQuery], // Use debounced value
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      // Use debounced value for the API call
      if (debouncedSearchQuery) {
        queryParams.append('search', debouncedSearchQuery);
      }
      return await apiRequest<PropertiesResponse>('GET', `/admin/properties?${queryParams.toString()}`);
    },
    keepPreviousData: true,
  });

  // Delete property mutation using apiRequest
  const deletePropertyMutation = useMutation<unknown, Error, number>({
    mutationFn: async (id: number) => {
      // Use apiRequest for deleting
      return await apiRequest('DELETE', `/admin/properties/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Property deleted successfully." });
      // Invalidate queries to refetch data for the current page and potentially others
      queryClient.invalidateQueries({ queryKey: ['/admin/properties'] });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to delete property: ${error.message}`, variant: "destructive" });
    },
  });

  // Feature/unfeature property mutations using apiRequest
  const featurePropertyMutation = useMutation<unknown, Error, { id: number; feature: boolean }>({
    mutationFn: async (payload: { id: number; feature: boolean }) => {
      const endpoint = payload.feature
        ? `/admin/properties/${payload.id}/feature`
        : `/admin/properties/${payload.id}/unfeature`;

      // Use apiRequest for updating
      return await apiRequest('PUT', endpoint);
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success", description: `Property ${variables.feature ? 'featured' : 'unfeatured'} successfully.` });
      queryClient.invalidateQueries({ queryKey: ['/admin/properties'] });
    },
    onError: (error, variables) => {
      toast({ title: "Error", description: `Failed to ${variables.feature ? 'feature' : 'unfeature'} property: ${error.message}`, variant: "destructive" });
    },
  });

  // Verify/unverify property mutations using apiRequest
  const verifyPropertyMutation = useMutation<unknown, Error, { id: number; verify: boolean }>({
    mutationFn: async (payload: { id: number; verify: boolean }) => {
      const endpoint = payload.verify
        ? `/admin/properties/${payload.id}/verify`
        : `/admin/properties/${payload.id}/unverify`;

      // Use apiRequest for updating
      return await apiRequest('PUT', endpoint);
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success", description: `Property ${variables.verify ? 'verified' : 'unverified'} successfully.` });
      queryClient.invalidateQueries({ queryKey: ['/admin/properties'] });
    },
    onError: (error, variables) => {
      toast({ title: "Error", description: `Failed to ${variables.verify ? 'verify' : 'unverify'} property: ${error.message}`, variant: "destructive" });
    },
  });

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (!data || newPage <= data.pagination.pages)) {
      setPage(newPage);
    }
  };

  const handleOpenEditDialog = (propertyId: number) => {
    setEditingPropertyId(propertyId);
    setIsEditDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: siteSettings.currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading && !data) { // Show loader only on initial load
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) { // Handle error state
    return (
      <div className="text-center py-10 text-red-500">
        <p>Error loading properties: {error.message}. Please try again.</p>
      </div>
    );
  }

  // Handle case where data might be undefined even if not loading/error (shouldn't happen with react-query usually)
  if (!data) {
    return <div className="text-center py-10">No property data available.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Properties Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </DialogTrigger>
          {/* Ensure PropertyForm uses apiRequest internally */}
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Create a new property listing. Fill out the details below.
              </DialogDescription>
            </DialogHeader>
            <PropertyForm onSuccessCallback={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form className="flex-1" onSubmit={(e) => e.preventDefault()}> {/* Prevent default form submission */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search properties by title, city..."
              className="pl-8"
              value={searchInput} // Bind to the immediate input state
              onChange={(e) => setSearchInput(e.target.value)} // Update the immediate input state
            />
          </div>
        </form>
      </div>

      {/* Properties table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">City</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Featured</TableHead>
              <TableHead className="hidden md:table-cell">Verified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && ( // Show subtle loading state during refetch
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data.properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium">{property.id}</TableCell>
                <TableCell>{property.title}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR', // TODO: Use currency settings from context/config
                    maximumFractionDigits: 0,
                  }).format(property.price)}
                </TableCell>
                <TableCell>
                  {formatPropertyType(property.propertyType)}
                  <span className="text-xs ml-1 text-gray-500">
                    ({formatListingType(property.listingType)})
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">{property.city}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs ${property.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                    }`}>
                    {property.status}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {property.featured ?
                    <CheckCircle className="h-5 w-5 text-green-500" /> :
                    <X className="h-5 w-5 text-gray-300" />
                  }
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {property.verified ?
                    <CheckCircle className="h-5 w-5 text-green-500" /> :
                    <X className="h-5 w-5 text-gray-300" />
                  }
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        {/* SVG for more options */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                        </DialogTrigger>
                        {/* Ensure PropertyForm uses apiRequest internally */}
                        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Property</DialogTitle>
                            <DialogDescription>
                              Update the property details below.
                            </DialogDescription>
                          </DialogHeader>
                          <PropertyForm propertyId={property.id} onSuccessCallback={() => setIsEditDialogOpen(false)} />
                        </DialogContent>
                      </Dialog>
                      <DropdownMenuItem
                        onClick={() => featurePropertyMutation.mutate({
                          id: property.id,
                          feature: !property.featured
                        })}
                        disabled={featurePropertyMutation.isLoading}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        <span>{property.featured ? "Unfeature" : "Feature"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => verifyPropertyMutation.mutate({
                          id: property.id,
                          verify: !property.verified
                        })}
                        disabled={verifyPropertyMutation.isLoading}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span>{property.verified ? "Unverify" : "Verify"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the property "{property.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deletePropertyMutation.mutate(property.id)}
                              disabled={deletePropertyMutation.isLoading}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletePropertyMutation.isLoading ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && data.properties.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No properties found. Try adjusting your search or adding new properties.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data.pagination.pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem className="flex items-center mx-2">
              <span className="text-sm">
                Page {page} of {data.pagination.pages}
              </span>
            </PaginationItem>
            {/* Consider adding page number links here for better UX */}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                className={page === data.pagination.pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

// Helper function to format property types (Keep as is or move to utils)
function formatPropertyType(type: string): string {
  const mappings: Record<string, string> = {
    'Kerrostalo': 'Apartment', 'Omakotitalo': 'House', 'Rivitalo': 'Townhouse',
    'Paritalo': 'Duplex', 'Erillistalo': 'Detached', 'Luhtitalo': 'Gallery',
    'apartment': 'Apartment', 'house': 'House', 'townhouse': 'Townhouse',
    'villa': 'Villa', 'penthouse': 'Penthouse', 'cottage': 'Cottage',
    'studio': 'Studio', 'commercial': 'Commercial'
  };
  return mappings[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// Helper function to format listing types (Keep as is or move to utils)
function formatListingType(type: string): string {
  const mappings: Record<string, string> = {
    'Myynti': 'For Sale', 'Vuokraus': 'For Rent', 'Liike': 'Commercial',
    'buy': 'For Sale', 'rent': 'For Rent', 'commercial': 'Commercial'
  };
  return mappings[type] || type.charAt(0).toUpperCase() + type.slice(1);
}
