import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUserFromStorage } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage, Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Spinner } from "../../components/ui/spinner";
import { CalendarIcon, CheckIcon, MessageSquareIcon, SendIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Define the message form schema
const messageFormSchema = z.object({
  message: z.string().min(1, "Message is required")
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

type Message = {
  id: number;
  userId: number;
  propertyId: number;
  message: string;
  status: string;
  subject: string;
  name: string;
  email: string;
  senderUserId?: number;
  createdAt: string;
  propertyTitle?: string;
  senderName?: string;
};

interface UserMessagesProps {
  userId?: number;
  propertyId?: number;
  recipientId?: number;
  canReply?: boolean;
}

export function UserMessages({ userId, propertyId, recipientId, canReply = false }: UserMessagesProps) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(getCurrentUserFromStorage());
  const [activeTab, setActiveTab] = useState("received");
  const queryClient = useQueryClient();
  
  // Try to use the auth context, but fallback to localStorage if not available
  let authContext: any = null;
  try {
    authContext = useAuth();
    if (authContext && authContext.currentUser) {
      setCurrentUser(authContext.currentUser);
    }
  } catch (error) {
    console.log("UserMessages: Auth context not available yet, using localStorage fallback");
  }
  
  useEffect(() => {
    // Function to update user data from either context or localStorage
    const updateUserData = () => {
      // First try to get user from auth context
      if (authContext && authContext.currentUser) {
        setCurrentUser(authContext.currentUser);
      } 
    };
    
    // Set up listeners for auth state changes
    const handleAuthChange = () => updateUserData();
    
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth-state-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-state-changed', handleAuthChange);
    };
  }, [authContext]);
  
  // Fetch user's messages
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [userId ? `/messages/user/${userId}` : `/messages/property/${propertyId}`],
    enabled: !!(userId || propertyId)
  });
  
  // Form for sending a message
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      message: ""
    }
  });
  
  // Mutation to send a message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormValues & { propertyId?: number; recipientId?: number }) => {
      return fetch('/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: recipientId,
          senderUserId: currentUser?.dbUserId,
          propertyId: propertyId || data.propertyId,
          subject: "Property Inquiry",
          name: currentUser?.displayName || "User",
          email: currentUser?.email || "user@example.com",
          message: data.message,
          status: 'unread'
        })
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully."
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: [userId ? `/messages/user/${userId}` : `/messages/property/${propertyId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Mark a message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return fetch(`/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userId ? `/messages/user/${userId}` : `/messages/property/${propertyId}`] });
    }
  });
  
  // Mark a message as replied
  const markAsRepliedMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return fetch(`/messages/${messageId}/replied`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userId ? `/messages/user/${userId}` : `/messages/property/${propertyId}`] });
    }
  });
  
  // Filter messages based on active tab
  const filteredMessages = messages && Array.isArray(messages) ? messages.filter((message: Message) => {
    if (userId) {
      if (activeTab === "received") {
        return message.userId === userId;
      } else {
        return message.senderUserId === userId;
      }
    }
    return true; // For property messages, show all
  }) : [];
  
  // Sort messages by date (newest first)
  const sortedMessages = filteredMessages.length > 0 ? 
    [...filteredMessages].sort((a: Message, b: Message) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }) : [];
  
  // Function to handle form submission
  function onSubmit(data: MessageFormValues) {
    sendMessageMutation.mutate({
      ...data,
      propertyId,
      recipientId
    });
  }
  
  // Function to handle marking a message as read
  function handleMarkAsRead(messageId: number) {
    markAsReadMutation.mutate(messageId);
  }
  
  // Function to handle marking a message as replied
  function handleMarkAsReplied(messageId: number) {
    markAsRepliedMutation.mutate(messageId);
  }
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-2xl flex items-center gap-2">
          <MessageSquareIcon className="h-5 w-5" />
          Messages
        </CardTitle>
        <CardDescription>
          {userId ? "View your messages and inquiries" : "Messages related to this property"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-6">
        {/* Tabs for sent and received messages */}
        {userId && (
          <Tabs defaultValue="received" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        {/* Messages list */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {messagesLoading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner size="md" />
            </div>
          ) : sortedMessages?.length > 0 ? (
            sortedMessages.map((message: Message) => (
              <Card 
                key={message.id} 
                className={`transition-colors ${message.status === "unread" && message.userId === userId ? "border-primary/50 bg-accent/20" : ""}`}
              >
                <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {message.subject || "Property Inquiry"}
                      {message.status === "unread" && message.userId === userId && (
                        <Badge variant="outline" className="ml-2 bg-accent">New</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-sm">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      {message.status === "read" && <span className="ml-2 flex items-center text-xs text-muted-foreground">
                        <CheckIcon className="h-3 w-3 mr-1" /> Read
                      </span>}
                      {message.status === "replied" && <span className="ml-2 flex items-center text-xs text-muted-foreground">
                        <SendIcon className="h-3 w-3 mr-1" /> Replied
                      </span>}
                    </CardDescription>
                  </div>
                  {message.userId === userId && message.status === "unread" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(message.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap">{message.message}</p>
                </CardContent>
                {canReply && message.userId === userId && message.status === "read" && (
                  <CardFooter className="p-4 pt-0 justify-end">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleMarkAsReplied(message.id)}
                    >
                      Mark as replied
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))
          ) : (
            <div className="text-center p-8 border rounded-lg bg-muted/10">
              <p className="text-muted-foreground">No messages found</p>
            </div>
          )}
        </div>
        
        {/* Message form */}
        {((userId && activeTab === "sent") || propertyId) && (
          <div className="mt-6 border-t pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Send a message</FormLabel>
                      <Textarea 
                        placeholder="Type your message here..." 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <SendIcon className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}