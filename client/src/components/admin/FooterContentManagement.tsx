// src/components/admin/FooterContentManagement.tsx
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Added DialogClose
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, ArrowUp, ArrowDown, ExternalLink, Loader2 } from 'lucide-react'; // Added Loader2
import { apiRequest } from "@/lib/queryClient"; // Ensure apiRequest is imported
import { cn } from "@/lib/utils";

// Types
interface FooterContent {
  id: number;
  section: string;
  title: string;
  content: string;
  link: string | null;
  icon: string | null;
  position: number;
  active: boolean;
  openInNewTab: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface FooterFormData {
  section: string;
  title: string;
  content: string;
  link: string | null;
  icon: string | null;
  position: number; // Position might be handled by backend on create/reorder
  active: boolean;
  openInNewTab: boolean;
}

// Default form data
const defaultFormData: FooterFormData = {
  section: "company",
  title: "",
  content: "",
  link: null,
  icon: null,
  position: 0, // Default position, backend might assign final value
  active: true,
  openInNewTab: false
};

// Section options
const sectionOptions = [
  { value: "company", label: "Company" },
  { value: "resources", label: "Resources" },
  { value: "legal", label: "Legal" },
  { value: "contact", label: "Contact" },
  { value: "social", label: "Social Media" }
];

export default function FooterContentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [formData, setFormData] = useState<FooterFormData>(defaultFormData);
  const [selectedContent, setSelectedContent] = useState<FooterContent | null>(null);

  // Query all footer contents using apiRequest
  const { data: footerContents = [], isLoading, isError, error } = useQuery<FooterContent[], Error>({
    queryKey: ['footer-contents'],
    queryFn: async () => {
      // Use apiRequest for fetching
      return await apiRequest<FooterContent[]>('GET', '/footer');
    },
    // Sort data client-side after fetching if backend doesn't sort by position
    select: (data) => data.sort((a, b) => a.position - b.position),
  });

  // Get footer contents for the active tab
  const filteredContents = footerContents.filter(content => content.section === activeTab);

  // Create content mutation (already uses apiRequest)
  const createContentMutation = useMutation<FooterContent, Error, FooterFormData>({
    mutationFn: async (data) => {
      // Position might be set by backend, remove if not needed in POST
      return await apiRequest<FooterContent>('POST', '/footer', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-contents'] });
      toast({ title: "Footer content created", description: "The footer content has been successfully created." });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error creating footer content", description: error.message || "Failed to create footer content.", variant: "destructive" });
    }
  });

  // Update content mutation (already uses apiRequest)
  const updateContentMutation = useMutation<FooterContent, Error, { id: number, data: Partial<FooterFormData> }>({
    mutationFn: async ({ id, data }) => {
      // Position might be handled by reorder, remove if not needed in PATCH/PUT
      return await apiRequest<FooterContent>('PATCH', `/footer/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-contents'] });
      toast({ title: "Footer content updated", description: "The footer content has been successfully updated." });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error updating footer content", description: error.message || "Failed to update footer content.", variant: "destructive" });
    }
  });

  // Delete content mutation (already uses apiRequest)
  const deleteContentMutation = useMutation<unknown, Error, number>({
    mutationFn: async (id) => {
      return await apiRequest('DELETE', `/footer/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-contents'] });
      toast({ title: "Footer content deleted", description: "The footer content has been successfully deleted." });
      setIsDeleteDialogOpen(false);
      setSelectedContent(null);
    },
    onError: (error: any) => {
      toast({ title: "Error deleting footer content", description: error.message || "Failed to delete footer content.", variant: "destructive" });
    }
  });

  // Reorder content mutation (already uses apiRequest)
  const reorderContentMutation = useMutation<unknown, Error, { id: number, direction: 'up' | 'down' }>({
    // Backend should handle calculating new position based on direction
    mutationFn: async ({ id, direction }) => {
      return await apiRequest('PATCH', `/footer/${id}/reorder`, { direction });
    },
    // Optimistic update example (optional but improves UX)
    onMutate: async ({ id, direction }) => {
        await queryClient.cancelQueries({ queryKey: ['footer-contents'] });
        const previousContents = queryClient.getQueryData<FooterContent[]>(['footer-contents']);

        queryClient.setQueryData<FooterContent[]>(['footer-contents'], (old = []) => {
            const index = old.findIndex(item => item.id === id);
            if (index === -1) return old;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= old.length) return old; // Boundary check

            const newContents = [...old];
            // Simple swap for optimistic update (backend should confirm final order)
            [newContents[index], newContents[newIndex]] = [newContents[newIndex], newContents[index]];
            // Update positions optimistically (backend should be source of truth)
            newContents[index].position = index;
            newContents[newIndex].position = newIndex;

            return newContents.sort((a, b) => a.position - b.position); // Ensure sorted
        });

        return { previousContents };
    },
    onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousContents) {
            queryClient.setQueryData(['footer-contents'], context.previousContents);
        }
        toast({ title: "Error reordering", description: "Failed to reorder item.", variant: "destructive" });
    },
    onSettled: () => {
        // Always refetch after mutation settles (success or error)
        queryClient.invalidateQueries({ queryKey: ['footer-contents'] });
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form to defaults
  const resetForm = () => {
    setFormData({ ...defaultFormData, section: activeTab });
  };

  // Set up form for editing
  const setupEditForm = (content: FooterContent) => {
    setSelectedContent(content);
    setFormData({
      section: content.section,
      title: content.title,
      content: content.content || "", // Ensure content is string
      link: content.link,
      icon: content.icon,
      position: content.position,
      active: content.active,
      openInNewTab: content.openInNewTab
    });
    setIsEditDialogOpen(true);
  };

  // Set up form for deletion
  const setupDeleteForm = (content: FooterContent) => {
    setSelectedContent(content);
    setIsDeleteDialogOpen(true);
  };

  // Handle create form submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Position might be handled by backend, remove if not needed
    createContentMutation.mutate(formData);
  };

  // Handle edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContent) {
      // Position might be handled by reorder, remove if not needed
      const { position, ...updateData } = formData;
      updateContentMutation.mutate({ id: selectedContent.id, data: updateData });
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedContent) {
      deleteContentMutation.mutate(selectedContent.id);
    }
  };

  // Handle reordering (move up/down)
  const handleReorder = (content: FooterContent, direction: 'up' | 'down') => {
    reorderContentMutation.mutate({ id: content.id, direction });
  };

  // Reset form when active tab changes
  useEffect(() => {
    resetForm();
  }, [activeTab]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Footer Content Management</CardTitle>
        <CardDescription>
          Manage footer links and content across different sections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              {sectionOptions.map(section => (
                <TabsTrigger key={section.value} value={section.value}>
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm();
                    setFormData(prev => ({ ...prev, section: activeTab }));
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add Footer Content</DialogTitle>
                  <DialogDescription>
                    Create a new footer link or content item.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
                  {/* Form Fields */}
                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Select
                      value={formData.section}
                      onValueChange={(value) => handleSelectChange('section', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea id="content" name="content" value={formData.content} onChange={handleInputChange} rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link">Link URL (optional)</Label>
                    <Input id="link" name="link" value={formData.link || ''} onChange={handleInputChange} placeholder="https://example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon (optional)</Label>
                    <Input id="icon" name="icon" value={formData.icon || ''} onChange={handleInputChange} placeholder={formData.section === 'social' ? "ri-facebook-fill" : "icon-name"} />
                    {formData.section === 'social' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Use format "ri-[icon-name]" (e.g., ri-facebook-fill)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="active" checked={formData.active} onCheckedChange={(checked) => handleSwitchChange('active', checked)} />
                    <Label htmlFor="active">Active</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="openInNewTab" checked={formData.openInNewTab} onCheckedChange={(checked) => handleSwitchChange('openInNewTab', checked)} />
                    <Label htmlFor="openInNewTab">Open in new tab</Label>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createContentMutation.isPending}>
                      {createContentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {sectionOptions.map(section => (
            <TabsContent key={section.value} value={section.value} className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isError ? (
                 <div className="text-center py-8 text-red-500">Error loading content: {error.message}</div>
              ) : (
                <>
                  {activeTab === 'social'}

                  {filteredContents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Content</TableHead>
                          <TableHead>Link</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContents.map(content => (
                          <TableRow key={content.id}>
                            <TableCell className="font-medium">{content.title}</TableCell>
                            <TableCell>{content.content?.substring(0, 50)}{content.content?.length > 50 ? '...' : ''}</TableCell>
                            <TableCell>
                              {content.link ? (
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs truncate max-w-[120px]">{content.link}</span>
                                  {content.openInNewTab && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                content.active
                                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              )}>
                                {content.active ? 'Active' : 'Inactive'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1"> {/* Reduced gap */}
                                <Button variant="ghost" size="icon" onClick={() => handleReorder(content, 'up')} disabled={reorderContentMutation.isLoading || filteredContents.indexOf(content) === 0} className="h-8 w-8"> {/* Smaller buttons */}
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleReorder(content, 'down')} disabled={reorderContentMutation.isLoading || filteredContents.indexOf(content) === filteredContents.length - 1} className="h-8 w-8">
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setupEditForm(content)} className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setupDeleteForm(content)} className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No items in this section. Click "Add Item" to create one.
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Footer Content</DialogTitle>
            <DialogDescription>
              Update an existing footer link or content item.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            {/* Form Fields (similar to create form) */}
             <div className="space-y-2">
              <Label htmlFor="edit-section">Section</Label>
              <Select value={formData.section} onValueChange={(value) => handleSelectChange('section', value)}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>{sectionOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" name="title" value={formData.title} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea id="edit-content" name="content" value={formData.content} onChange={handleInputChange} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-link">Link URL (optional)</Label>
              <Input id="edit-link" name="link" value={formData.link || ''} onChange={handleInputChange} placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Icon (optional)</Label>
              <Input id="edit-icon" name="icon" value={formData.icon || ''} onChange={handleInputChange} placeholder={formData.section === 'social' ? "ri-facebook-fill" : "icon-name"} />
              {formData.section === 'social' && (<p className="text-sm text-muted-foreground mt-1">Use format "ri-[icon-name]"</p>)}
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="edit-active" checked={formData.active} onCheckedChange={(checked) => handleSwitchChange('active', checked)} />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="edit-openInNewTab" checked={formData.openInNewTab} onCheckedChange={(checked) => handleSwitchChange('openInNewTab', checked)} />
              <Label htmlFor="edit-openInNewTab">Open in new tab</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateContentMutation.isPending}>
                {updateContentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedContent?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} disabled={deleteContentMutation.isPending}>
              {deleteContentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
