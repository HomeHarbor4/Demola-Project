// src/components/admin/UserForm.tsx
import React, { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient"; // Ensure apiRequest is imported

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(4, "Username must be at least 4 characters long"),
  // Make password optional for editing
  password: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  phone: z.string().optional(),
}).refine(data => {
  // Require password only if not editing
  return !!data.userId || (data.password && data.password.length >= 6);
}, {
  message: "Password must be at least 6 characters long",
  path: ["password"],
});


type FormValues = z.infer<typeof formSchema> & { userId?: number }; // Add userId for refine check

interface UserData {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  phone: string | null;
}

export function UserForm({ userId }: { userId?: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!userId;

  // Set default form values
  const defaultValues: Partial<FormValues> = {
    name: "",
    email: "",
    username: "",
    password: "",
    role: "user",
    phone: "",
    userId: userId // Include userId for refine check
  };

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // If editing, fetch user data using apiRequest
  const { data: user, isLoading: isLoadingUser } = useQuery<UserData, Error>({
    queryKey: [`/admin/users/${userId}`],
    enabled: isEditing, // Only run if userId is provided
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required for editing.");
      // Use apiRequest for fetching
      return await apiRequest<UserData>('GET', `/admin/users/${userId}`);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fill form with user data when available
  useEffect(() => {
    if (user && isEditing) {
      form.reset({
        name: user.name,
        email: user.email,
        username: user.username,
        password: "", // Don't fill password for security
        role: user.role,
        phone: user.phone || "",
        userId: user.id // Include userId for refine check
      });
    }
  }, [user, isEditing, form]);

  // Create user mutation (already uses apiRequest)
  const createUserMutation = useMutation<UserData, Error, Omit<FormValues, 'userId'>>({
    mutationFn: async (data) => {
      return await apiRequest<UserData>('POST', '/admin/users', data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/admin/users'] });
      form.reset(defaultValues);
      setIsSubmitting(false);
      // Consider closing dialog here if applicable
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to create user: ${error.message}`, variant: "destructive" });
      setIsSubmitting(false);
    },
  });

  // Update user mutation (already uses apiRequest)
  const updateUserMutation = useMutation<UserData, Error, { id: number; data: Partial<FormValues> }>({
    mutationFn: async ({ id, data }) => {
      return await apiRequest<UserData>('PUT', `/admin/users/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/admin/users'] });
      queryClient.invalidateQueries({ queryKey: [`/admin/users/${userId}`] }); // Invalidate specific user query
      setIsSubmitting(false);
      // Consider closing dialog here if applicable
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to update user: ${error.message}`, variant: "destructive" });
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    // Prepare data for submission
    let data: Partial<FormValues> = { ...values };

    // If editing and password field is empty, remove it from the data
    if (isEditing && (!values.password || !values.password.trim())) {
      delete data.password;
    }

    // Remove empty optional fields like phone
    if (!values.phone || !values.phone.trim()) {
      delete data.phone;
    }

    // Remove userId before sending to API
    delete data.userId;

    try {
      if (isEditing && userId) {
        await updateUserMutation.mutateAsync({ id: userId, data }); // Use mutateAsync if you need to wait
      } else {
        await createUserMutation.mutateAsync(data as Omit<FormValues, 'userId'>); // Use mutateAsync if you need to wait
      }
    } catch (error) {
      // Errors are handled by onError callbacks, but catch prevents unhandled rejections
      console.error("Error submitting form:", error);
      setIsSubmitting(false); // Ensure submitting state is reset on unexpected errors
    }
  };

  // Define role options
  const roleOptions = [
    { label: "User", value: "user" },
    { label: "Agent", value: "agent" },
    { label: "Admin", value: "admin" },
  ];

  if (isEditing && isLoadingUser) {
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
          {/* Basic User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">User Information</h3>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email*</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter phone number"
                      {...field}
                      value={field.value || ""} // Ensure value is controlled
                    />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Information</h3>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditing ? "New Password" : "Password*"}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                      {...field}
                    />
                  </FormControl>
                  {isEditing && (
                    <FormDescription>Leave blank to keep current password</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    // Use value prop for controlled component
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    User: Regular user, Agent: Can list properties, Admin: Full access
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
