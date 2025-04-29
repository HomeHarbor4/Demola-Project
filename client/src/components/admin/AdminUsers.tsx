// src/components/admin/AdminUsers.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Edit, Trash2, Plus, UserCheck, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { UserForm } from "@/components/admin/UserForm";
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface UserData {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  phone: string | null;
  createdAt: string;
}

export function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast(); // Initialize toast
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users using apiRequest
  const { data: users, isLoading, isError, error } = useQuery<UserData[], Error>({
    queryKey: ['/admin/users'], // Add searchQuery if backend supports it
    queryFn: async () => {
      // Add search query param if backend supports it
      // const url = searchQuery ? `/admin/users?search=${encodeURIComponent(searchQuery)}` : '/admin/users';
      // return await apiRequest<UserData[]>(url);

      // Assuming backend doesn't support search yet, fetch all and filter client-side
      return await apiRequest<UserData[]>('GET', '/admin/users');
    }
  });

  // Delete user mutation using apiRequest
  const deleteUserMutation = useMutation<unknown, Error, number>({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/admin/users/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ['/admin/users'] });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to delete user: ${error.message}`, variant: "destructive" });
    },
  });

  // Update user role mutation using apiRequest
  const updateUserRoleMutation = useMutation<unknown, Error, { id: number; role: string }>({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      // Only send the role field for update
      return await apiRequest('PUT', `/admin/users/${id}`, { role });
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success", description: `User role updated to ${variables.role}.` });
      queryClient.invalidateQueries({ queryKey: ['/admin/users'] });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to update user role: ${error.message}`, variant: "destructive" });
    },
  });

  // Handle search (client-side filtering for now)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // No action needed if filtering client-side
  };

  // Filter users based on search query (client-side)
  const filteredUsers = users?.filter(user => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>Error loading users: {error.message}. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Users Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          {/* Ensure UserForm uses apiRequest internally */}
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. Fill out the details below.
              </DialogDescription>
            </DialogHeader>
            <UserForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search users by name, email, username, role..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Users table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.role === "admin" ? "destructive" :
                      user.role === "agent" ? "default" : "secondary"
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        {/* SVG for more options */}
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <Dialog>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                        </DialogTrigger>
                        {/* Ensure UserForm uses apiRequest internally */}
                        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                              Update user details below.
                            </DialogDescription>
                          </DialogHeader>
                          <UserForm userId={user.id} />
                        </DialogContent>
                      </Dialog>

                      {user.role !== "agent" && (
                        <DropdownMenuItem
                          onClick={() => updateUserRoleMutation.mutate({
                            id: user.id,
                            role: "agent"
                          })}
                          disabled={updateUserRoleMutation.isLoading}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          <span>Make Agent</span>
                        </DropdownMenuItem>
                      )}

                      {user.role === "agent" && (
                        <DropdownMenuItem
                          onClick={() => updateUserRoleMutation.mutate({
                            id: user.id,
                            role: "user" // Assuming 'user' is the default role
                          })}
                          disabled={updateUserRoleMutation.isLoading}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          <span>Remove Agent Status</span>
                        </DropdownMenuItem>
                      )}

                      {user.role !== "admin" && (
                        <DropdownMenuItem
                          onClick={() => updateUserRoleMutation.mutate({
                            id: user.id,
                            role: "admin"
                          })}
                          disabled={updateUserRoleMutation.isLoading}
                          className="text-red-600"
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          <span>Make Admin</span>
                        </DropdownMenuItem>
                      )}

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
                              This action cannot be undone. This will permanently delete the user account for "{user.name}" ({user.email}).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              disabled={deleteUserMutation.isLoading}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleteUserMutation.isLoading ? 'Deleting...' : 'Delete User'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {(!filteredUsers || filteredUsers.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
