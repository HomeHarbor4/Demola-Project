// src/components/admin/LocationsManagement.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { Link } from "wouter"; // Link not used, can be removed
import {
  Table,
  TableBody,
  // TableCaption, // Not used
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  // CardFooter, // Not used
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MoreVertical, Map, Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest

interface Location {
  id: number;
  name: string;
  city: string;
  image: string;
  propertyCount: number;
}

interface LocationFormData {
  name: string;
  city: string;
  image: string;
}

export function LocationsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newLocation, setNewLocation] = useState<LocationFormData>({
    name: "",
    city: "",
    image: "",
  });

  // Fetch locations using apiRequest
  const { data: locations, isLoading, isError, error } = useQuery<Location[], Error>({
    queryKey: ['/admin/locations'], // Use a more specific key if needed
    queryFn: async () => {
      // Use apiRequest for fetching
      return await apiRequest<Location[]>('GET', '/admin/locations');
    },
  });

  // Create location mutation using apiRequest
  const createLocation = useMutation<Location, Error, LocationFormData>({
    mutationFn: async (data: LocationFormData) => {
      // Use apiRequest for creating
      return await apiRequest<Location>('POST', '/admin/locations', data);
    },
    onSuccess: (newLoc) => {
      queryClient.invalidateQueries({ queryKey: ['/admin/locations'] });
      setIsCreateDialogOpen(false);
      setNewLocation({ name: "", city: "", image: "" });
      toast({
        title: "Success",
        description: `Location "${newLoc.name}" created successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create location",
        variant: "destructive",
      });
    },
  });

  // Update location mutation using apiRequest
  const updateLocation = useMutation<Location, Error, Location>({
    mutationFn: async (data: Location) => {
      const { id, name, city, image } = data;
      // Use apiRequest for updating
      return await apiRequest<Location>('PUT', `/admin/locations/${id}`, { name, city, image });
    },
    onSuccess: (updatedLoc) => {
      queryClient.invalidateQueries({ queryKey: ['/admin/locations'] });
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      toast({
        title: "Success",
        description: `Location "${updatedLoc.name}" updated successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update location",
        variant: "destructive",
      });
    },
  });

  // Delete location mutation using apiRequest
  const deleteLocation = useMutation<unknown, Error, number>({
    mutationFn: async (id: number) => {
      // Use apiRequest for deleting
      return await apiRequest('DELETE', `/admin/locations/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/admin/locations'] });
      setIsDeleteDialogOpen(false);
      setSelectedLocation(null);
      toast({
        title: "Success",
        description: `Location deleted successfully`, // Consider adding name if needed before deletion
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete location",
        variant: "destructive",
      });
    },
  });

  // Filter locations based on search query
  const filteredLocations = locations?.filter((location: Location) => {
    const query = searchQuery.toLowerCase();
    return (
      location.name.toLowerCase().includes(query) ||
      location.city.toLowerCase().includes(query)
    );
  });

  // Handle create location
  const handleCreateLocation = () => {
    createLocation.mutate(newLocation);
  };

  // Handle edit location
  const handleEditLocation = () => {
    if (selectedLocation) {
      updateLocation.mutate(selectedLocation);
    }
  };

  // Handle delete location
  const handleDeleteLocation = () => {
    if (selectedLocation) {
      deleteLocation.mutate(selectedLocation.id);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>Error loading locations: {error.message}. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Locations</h2>
          <p className="text-muted-foreground">
            Manage city districts and locations
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Locations</CardTitle>
            <Input
              className="max-w-sm"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-center">Properties</TableHead>
                <TableHead>Image</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations && filteredLocations.length > 0 ? (
                filteredLocations.map((location: Location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>{location.city}</TableCell>
                    <TableCell className="text-center">{location.propertyCount || 0}</TableCell>
                    <TableCell>
                      {location.image ? (
                        <div className="h-10 w-10 rounded-md overflow-hidden">
                          <img
                            src={location.image}
                            alt={location.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center">
                          <Map className="h-5 w-5 text-slate-500" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLocation(location);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLocation(location);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    {searchQuery
                      ? "No locations found matching your search"
                      : "No locations have been added yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Location Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Add a new district or location to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input
                id="name"
                placeholder="e.g. Keskusta"
                value={newLocation.name}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g. Oulu"
                value={newLocation.city}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, city: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL (optional)</Label>
              <Input
                id="image"
                placeholder="https://example.com/image.jpg"
                value={newLocation.image}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, image: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLocation}
              disabled={!newLocation.name || !newLocation.city || createLocation.isPending}
            >
              {createLocation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the details of this location
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Location Name</Label>
                <Input
                  id="edit-name"
                  value={selectedLocation.name}
                  onChange={(e) =>
                    setSelectedLocation(prev => prev ? { ...prev, name: e.target.value } : null)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={selectedLocation.city}
                  onChange={(e) =>
                    setSelectedLocation(prev => prev ? { ...prev, city: e.target.value } : null)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Image URL (optional)</Label>
                <Input
                  id="edit-image"
                  value={selectedLocation.image || ""}
                  onChange={(e) =>
                    setSelectedLocation(prev => prev ? { ...prev, image: e.target.value } : null)
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditLocation}
              disabled={
                !selectedLocation?.name ||
                !selectedLocation?.city ||
                updateLocation.isPending
              }
            >
              {updateLocation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Location Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this location? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <div className="py-4">
              <p>
                You are about to delete <strong>{selectedLocation.name}</strong>, {selectedLocation.city}.
              </p>
              {selectedLocation.propertyCount > 0 && (
                <p className="text-destructive mt-2">
                  Warning: This location has {selectedLocation.propertyCount} properties associated with it. Deleting it may impact these properties.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteLocation}
              disabled={deleteLocation.isPending}
            >
              {deleteLocation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
