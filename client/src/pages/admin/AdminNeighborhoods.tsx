// src/pages/admin/Neighborhoods.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Neighborhood, InsertNeighborhood } from "@shared/schema";
import {AdminLayout} from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NeighborhoodForm } from "@/components/admin/NeighborhoodForm"; // Import the form
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
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
import { useCurrency } from "@/lib/formatters"; // Import currency formatter

export default function AdminNeighborhoods() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { formatPrice } = useCurrency(); // Use currency formatter
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);

  // Fetch all neighborhoods (including inactive for admin view)
  const { data: neighborhoods, isLoading, error } = useQuery<Neighborhood[]>({
    queryKey: ['/neighborhoods/admin'], // Use a distinct key for admin view
    queryFn: () => apiRequest<Neighborhood[]>('GET', '/neighborhoods/all'), // Fetch all (adjust endpoint if needed)
  });

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (newData: InsertNeighborhood) => apiRequest('POST', '/neighborhoods', newData),
    onSuccess: () => {
      toast({ title: "Success", description: "Neighborhood created." });
      queryClient.invalidateQueries({ queryKey: ['/neighborhoods/admin'] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create neighborhood.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<InsertNeighborhood> }) => apiRequest('PUT', `/neighborhoods/${id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Neighborhood updated." });
      queryClient.invalidateQueries({ queryKey: ['/neighborhoods/admin'] });
      setIsEditModalOpen(false);
      setSelectedNeighborhood(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update neighborhood.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/neighborhoods/${id}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Neighborhood deleted." });
      queryClient.invalidateQueries({ queryKey: ['/neighborhoods/admin'] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to delete neighborhood.", variant: "destructive" });
    },
  });

  // --- Handlers ---
  const handleCreateSubmit = async (values: InsertNeighborhood) => {
    await createMutation.mutateAsync(values);
  };

  const handleEditSubmit = async (values: Partial<InsertNeighborhood>) => {
    if (!selectedNeighborhood) return;
    await updateMutation.mutateAsync({ id: selectedNeighborhood.id, data: values });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const openEditModal = (neighborhood: Neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    setIsEditModalOpen(true);
  };

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (error) {
      return <div className="text-red-600 p-4 bg-red-50 rounded-md">Error loading neighborhoods: {error.message}</div>;
    }
    if (!neighborhoods || neighborhoods.length === 0) {
      return <div className="text-center p-10 text-muted-foreground">No neighborhoods found. Add one to get started!</div>;
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Avg Price</TableHead>
              <TableHead>Walk Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {neighborhoods.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="font-medium">{n.name}</TableCell>
                <TableCell>{n.city}</TableCell>
                <TableCell>{n.averagePrice ? formatPrice(Number(n.averagePrice), {maximumFractionDigits: 0}) : '-'}</TableCell>
                <TableCell>{n.walkScore ?? '-'}</TableCell>
                <TableCell>
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                     n.active
                       ? 'bg-green-100 text-green-800'
                       : 'bg-red-100 text-red-800'
                   }`}>
                     {n.active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                     {n.active ? 'Active' : 'Inactive'}
                   </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(n)} title="Edit">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" title="Delete">
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the neighborhood "{n.name}, {n.city}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(n.id)}
                          disabled={deleteMutation.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Manage Neighborhoods</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Neighborhood
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]"> {/* Wider modal */}
            <DialogHeader>
              <DialogTitle>Add New Neighborhood</DialogTitle>
            </DialogHeader>
            {/* Scrollable content area */}
            <div className="py-4 max-h-[75vh] overflow-y-auto px-1 pr-3">
              <NeighborhoodForm
                onSubmit={handleCreateSubmit}
                isLoading={createMutation.isPending}
                onCancel={() => setIsCreateModalOpen(false)}
              />
            </div>
            {/* Footer is handled by the form's submit/cancel buttons */}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neighborhood List</CardTitle>
          <CardDescription>View, edit, or delete neighborhoods.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[700px]"> {/* Wider modal */}
          <DialogHeader>
            <DialogTitle>Edit Neighborhood</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[75vh] overflow-y-auto px-1 pr-3">
            {selectedNeighborhood && (
              <NeighborhoodForm
                initialData={selectedNeighborhood}
                onSubmit={handleEditSubmit}
                isLoading={updateMutation.isPending}
                onCancel={() => setIsEditModalOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}
