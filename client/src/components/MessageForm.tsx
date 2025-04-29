// src/components/MessageForm.tsx
import { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Property } from "@shared/schema";

// Define the message form schema (can be reused or imported if defined elsewhere)
const messageFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

interface MessageFormProps {
  property: Property; // Property details are needed for context
  onClose?: () => void; // Optional callback to close the form/modal
}

export function MessageForm({ property, onClose }: MessageFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get user from auth context

  // Initialize message form
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      message: "",
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use apiRequest helper for consistent error handling
      return apiRequest('POST', '/messages', data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the property agent.",
      });
      form.reset(); // Reset form fields
      onClose?.(); // Call onClose if provided
    },
    onError: (error: any) => {
      console.error("Error in sendMessageMutation:", error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Handle message form submission
  const onSubmitMessage = async (values: MessageFormValues) => {
    // Construct the message data
    const messageData = {
      ...values,
      subject: `Inquiry about ${property.title}`, // Add required subject field
      propertyId: property.id,
      userId: property.ownerDetails?.userId, // Receiver's ID (agent/owner) - use optional chaining
      senderUserId: user?.id || null, // Sender's ID
    };

    // Check if receiver userId is available
    if (!messageData.userId) {
       toast({
        title: "Cannot Send Message",
        description: "Agent/Owner details not found for this property.",
        variant: "destructive",
      });
      return;
    }

    console.log("Sending message data:", messageData);
    sendMessageMutation.mutate(messageData);
  };

  // Effect to update form defaults if user logs in/out while form is visible
  useEffect(() => {
    // Only reset if the form is not currently being submitted
    if (!sendMessageMutation.isPending) {
       form.reset({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        // Keep existing message if user re-opens form without submitting
        message: form.getValues().message || "",
      });
    }
  }, [user, form, sendMessageMutation.isPending]); // Depend on user

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitMessage)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} disabled={sendMessageMutation.isPending} />
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
                <FormLabel>Your Email*</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} disabled={sendMessageMutation.isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter your phone number" {...field} value={field.value || ""} disabled={sendMessageMutation.isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message*</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your message to the agent"
                  className="min-h-[100px]"
                  {...field}
                  disabled={sendMessageMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          {/* Only show Cancel button if onClose prop is provided */}
          {onClose && (
             <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={sendMessageMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={sendMessageMutation.isPending}>
            {sendMessageMutation.isPending ? (
              <>
                <i className="ri-loader-2-line animate-spin mr-2"></i>
                Sending...
              </>
            ) : (
              <>
                <i className="ri-send-plane-line mr-2"></i>
                Send Message
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
