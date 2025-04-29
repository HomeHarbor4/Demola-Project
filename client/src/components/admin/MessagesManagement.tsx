import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Eye, Trash2, MoreVertical, Reply, CheckCircle, CircleAlert } from "lucide-react";

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "unread" | "read" | "replied";
  propertyId: number | null;
}



export function MessagesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [viewMessageDialog, setViewMessageDialog] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyDialog, setReplyDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch messages from API
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['/messages', currentTab, searchQuery, page, limit],
    queryFn: () => {
      const filters: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      
      if (currentTab !== "all") {
        filters.status = currentTab;
      }
      
      if (searchQuery) {
        filters.search = searchQuery;
      }
      
      const queryParams = new URLSearchParams(filters).toString();
      return apiRequest<{ messages: Message[], total: number }>('GET', `/messages?${queryParams}`);
    }
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('PUT', `/messages/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/messages'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to mark message as read: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mark message as replied mutation
  const markAsRepliedMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('PUT', `/messages/${id}/replied`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/messages'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to mark message as replied: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/messages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/messages'] });
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete message: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mark message as read when viewing
  useEffect(() => {
    if (viewMessageDialog && selectedMessage && selectedMessage.status === "unread") {
      markAsReadMutation.mutate(selectedMessage.id);
    }
  }, [viewMessageDialog, selectedMessage, markAsReadMutation]);
  
  // Get messages based on current filters
  const messages = messagesData?.messages || [];
  const totalMessages = messagesData?.total || 0;

  // Format date string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle message status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unread":
        return <Badge variant="secondary">Unread</Badge>;
      case "read":
        return <Badge variant="outline">Read</Badge>;
      case "replied":
        return <Badge variant="default">Replied</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
          <p className="text-muted-foreground">
            Manage inquiries and communication
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center">
            <CardTitle>All Messages</CardTitle>
            <Input
              className="max-w-sm"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
              <TabsTrigger value="replied">Replied</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <MessagesTable 
                  messages={messages}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                  setSelectedMessage={setSelectedMessage}
                  setViewMessageDialog={setViewMessageDialog}
                  setReplyDialog={setReplyDialog}
                  setDeleteDialog={setDeleteDialog}
                  markAsRead={(id) => markAsReadMutation.mutate(id)}
                />
              )}
            </TabsContent>
            <TabsContent value="unread">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <MessagesTable 
                  messages={messages}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                  setSelectedMessage={setSelectedMessage}
                  setViewMessageDialog={setViewMessageDialog}
                  setReplyDialog={setReplyDialog}
                  setDeleteDialog={setDeleteDialog}
                  markAsRead={(id) => markAsReadMutation.mutate(id)}
                />
              )}
            </TabsContent>
            <TabsContent value="read">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <MessagesTable 
                  messages={messages}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                  setSelectedMessage={setSelectedMessage}
                  setViewMessageDialog={setViewMessageDialog}
                  setReplyDialog={setReplyDialog}
                  setDeleteDialog={setDeleteDialog}
                  markAsRead={(id) => markAsReadMutation.mutate(id)}
                />
              )}
            </TabsContent>
            <TabsContent value="replied">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <MessagesTable 
                  messages={messages}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                  setSelectedMessage={setSelectedMessage}
                  setViewMessageDialog={setViewMessageDialog}
                  setReplyDialog={setReplyDialog}
                  setDeleteDialog={setDeleteDialog}
                  markAsRead={(id) => markAsReadMutation.mutate(id)}
                />
              )}
            </TabsContent>
          </Tabs>
          
          {/* Pagination */}
          {!isLoading && totalMessages > 0 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {messages.length} of {totalMessages} messages
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page => Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page => page + 1)}
                  disabled={messages.length < limit}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Message Dialog */}
      <Dialog open={viewMessageDialog} onOpenChange={setViewMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription>
              From: {selectedMessage?.name} ({selectedMessage?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Received: {selectedMessage && formatDate(selectedMessage.createdAt)}</span>
              <span>{selectedMessage && getStatusBadge(selectedMessage.status)}</span>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <p className="whitespace-pre-wrap">
                {selectedMessage?.message}
              </p>
            </div>
            
            {selectedMessage?.propertyId && (
              <div className="text-sm">
                <span className="text-muted-foreground">Related Property: </span>
                <Button variant="link" className="p-0 h-auto" asChild>
                  <a href={`/property/${selectedMessage.propertyId}`} target="_blank" rel="noopener noreferrer">
                    View Property #{selectedMessage.propertyId}
                  </a>
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-row justify-between sm:justify-between">
            <div>
              <Button variant="destructive" size="sm" onClick={() => {
                setViewMessageDialog(false);
                setDeleteDialog(true);
              }}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setViewMessageDialog(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setViewMessageDialog(false);
                setReplyDialog(true);
              }}>
                <Reply className="mr-2 h-4 w-4" />
                Reply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialog} onOpenChange={setReplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to {selectedMessage?.name}</DialogTitle>
            <DialogDescription>
              Responding to: {selectedMessage?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reply">Your Reply</Label>
              <Textarea
                id="reply"
                rows={10}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply here..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedMessage) {
                  // In a real app, this would also send an email
                  markAsRepliedMutation.mutate(selectedMessage.id);
                  toast({
                    title: "Reply sent",
                    description: `Reply sent to ${selectedMessage.name}`,
                  });
                  setReplyDialog(false);
                  setReplyContent("");
                }
              }}
              disabled={markAsRepliedMutation.isPending}
            >
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>Subject:</strong> {selectedMessage?.subject}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              From {selectedMessage?.name} ({selectedMessage?.email})
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedMessage) {
                  deleteMessageMutation.mutate(selectedMessage.id);
                  setDeleteDialog(false);
                }
              }}
              disabled={deleteMessageMutation.isPending}
            >
              Delete Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for the messages table
interface MessagesTableProps {
  messages: Message[];
  formatDate: (dateString: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  setSelectedMessage: React.Dispatch<React.SetStateAction<Message | null>>;
  setViewMessageDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setReplyDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteDialog: React.Dispatch<React.SetStateAction<boolean>>;
  markAsRead?: (id: number) => void;
}

function MessagesTable({ 
  messages, 
  formatDate, 
  getStatusBadge,
  setSelectedMessage,
  setViewMessageDialog,
  setReplyDialog,
  setDeleteDialog,
  markAsRead
}: MessagesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Sender</TableHead>
            <TableHead className="w-auto">Subject</TableHead>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.length > 0 ? (
            messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell className="font-medium">
                  {message.name}
                  <div className="text-xs text-muted-foreground">{message.email}</div>
                </TableCell>
                <TableCell>
                  <div 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => {
                      setSelectedMessage(message);
                      setViewMessageDialog(true);
                    }}
                  >
                    {message.subject}
                  </div>
                </TableCell>
                <TableCell>{formatDate(message.createdAt)}</TableCell>
                <TableCell>{getStatusBadge(message.status)}</TableCell>
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
                          setSelectedMessage(message);
                          setViewMessageDialog(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedMessage(message);
                          setReplyDialog(true);
                        }}
                      >
                        <Reply className="mr-2 h-4 w-4" />
                        Reply
                      </DropdownMenuItem>
                      {message.status === "unread" && (
                        <DropdownMenuItem
                          onClick={() => {
                            if (markAsRead) {
                              markAsRead(message.id);
                            }
                          }}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Read
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedMessage(message);
                          setDeleteDialog(true);
                        }}
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
              <TableCell colSpan={5} className="text-center h-24">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Mail className="h-8 w-8 mb-2" />
                  <p>No messages found</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}