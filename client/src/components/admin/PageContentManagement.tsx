import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Edit, RefreshCw, MoveUp, MoveDown } from 'lucide-react';

// Define the page content schema for the form validation
const pageContentSchema = z.object({
  pageType: z.string().min(1, 'Page type is required'),
  section: z.string().min(1, 'Section is required'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  image: z.string().optional(),
  link: z.string().optional(),
  linkText: z.string().optional(),
  buttonText: z.string().optional(),
  position: z.number().int().min(0, 'Position must be a non-negative integer'),
  active: z.boolean().default(true),
});

type PageContent = z.infer<typeof pageContentSchema> & {
  id: number;
  createdAt: string;
  updatedAt: string | null;
};

// Possible page types for the dynamic content
const PAGE_TYPES = [
  { value: 'agents', label: 'Find Agents' },
  { value: 'neighborhoods', label: 'Neighborhoods' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'about', label: 'About Us' },
  { value: 'contact', label: 'Contact Us' },
];

// Possible section types for the dynamic content
const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Section' },
  { value: 'features', label: 'Features Section' },
  { value: 'team', label: 'Team Members Section' },
  { value: 'faq', label: 'FAQ Section' },
  { value: 'testimonials', label: 'Testimonials Section' },
  { value: 'cta', label: 'Call to Action Section' },
  { value: 'stats', label: 'Statistics Section' },
  { value: 'benefits', label: 'Benefits Section' },
  { value: 'services', label: 'Services Section' },
  { value: 'contact', label: 'Contact Information Section' },
];

export function PageContentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPageType, setSelectedPageType] = useState<string>('agents');
  const [currentContent, setCurrentContent] = useState<PageContent | null>(null);

  // Create a form instance for creating/editing page content
  const form = useForm<z.infer<typeof pageContentSchema>>({
    resolver: zodResolver(pageContentSchema),
    defaultValues: {
      pageType: 'agents',
      section: 'hero',
      title: '',
      subtitle: '',
      content: '',
      image: '',
      link: '',
      linkText: '',
      buttonText: '',
      position: 0,
      active: true,
    },
  });

  // Query to fetch all page contents
  const { data: pageContents, isLoading: isLoadingContents } = useQuery({
    queryKey: ['/page-content'],
    queryFn: async () => {
      const response = await apiRequest<PageContent[]>('/page-content');
      return response;
    },
  });

  // Mutation to create a new page content
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof pageContentSchema>) => {
      const response = await apiRequest<PageContent>('/page-content', {
        method: 'POST',
        data,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Page content created successfully.',
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/page-content'] });
    },
    onError: (error) => {
      console.error('Error creating page content:', error);
      toast({
        title: 'Error',
        description: 'Failed to create page content. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to update an existing page content
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof pageContentSchema>> }) => {
      const response = await apiRequest<PageContent>(`/page-content/${id}`, {
        method: 'PATCH',
        data,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Page content updated successfully.',
      });
      setIsEditDialogOpen(false);
      setCurrentContent(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/page-content'] });
    },
    onError: (error) => {
      console.error('Error updating page content:', error);
      toast({
        title: 'Error',
        description: 'Failed to update page content. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete a page content
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/page-content/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Page content deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/page-content'] });
    },
    onError: (error) => {
      console.error('Error deleting page content:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete page content. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to reorder a page content
  const reorderMutation = useMutation({
    mutationFn: async ({ id, newPosition }: { id: number; newPosition: number }) => {
      const response = await apiRequest(`/page-content/${id}/reorder`, {
        method: 'PATCH',
        data: { newPosition },
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Page content reordered successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/page-content'] });
    },
    onError: (error) => {
      console.error('Error reordering page content:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder page content. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Function to handle creating a new page content
  const onSubmitCreate = (data: z.infer<typeof pageContentSchema>) => {
    createMutation.mutate(data);
  };

  // Function to handle updating an existing page content
  const onSubmitUpdate = (data: z.infer<typeof pageContentSchema>) => {
    if (currentContent) {
      updateMutation.mutate({ id: currentContent.id, data });
    }
  };

  // Function to handle opening the edit dialog
  const handleEditContent = (content: PageContent) => {
    setCurrentContent(content);
    form.reset({
      pageType: content.pageType,
      section: content.section,
      title: content.title || '',
      subtitle: content.subtitle || '',
      content: content.content || '',
      image: content.image || '',
      link: content.link || '',
      linkText: content.linkText || '',
      buttonText: content.buttonText || '',
      position: content.position,
      active: content.active,
    });
    setIsEditDialogOpen(true);
  };

  // Function to handle toggling the active state of a page content
  const handleToggleActive = (content: PageContent) => {
    updateMutation.mutate({
      id: content.id,
      data: { active: !content.active },
    });
  };

  // Function to handle reordering a page content
  const handleReorder = (content: PageContent, direction: 'up' | 'down') => {
    const newPosition = direction === 'up' ? content.position - 1 : content.position + 1;
    if (newPosition < 0) return; // Prevent negative positions
    
    reorderMutation.mutate({ id: content.id, newPosition });
  };

  // Filter contents by selected page type
  const filteredContents = pageContents?.filter(
    (content) => content.pageType === selectedPageType
  ) || [];

  // Group contents by section
  const contentsBySection = filteredContents.reduce<Record<string, PageContent[]>>(
    (acc, content) => {
      if (!acc[content.section]) {
        acc[content.section] = [];
      }
      acc[content.section].push(content);
      return acc;
    },
    {}
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dynamic Page Content Management</CardTitle>
        <CardDescription>
          Create, edit, and manage content for dynamic pages like Find Agents, Neighborhoods, and Mortgage pages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tabs for different page types */}
        <Tabs defaultValue={selectedPageType} onValueChange={setSelectedPageType}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              {PAGE_TYPES.map((type) => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Content
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Page Content</DialogTitle>
                  <DialogDescription>
                    Create new content for your dynamic pages. Fill out the form below to add content.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pageType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Page Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select page type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PAGE_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The page where this content will appear.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="section"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SECTION_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The section of the page for this content.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter title" {...field} />
                            </FormControl>
                            <FormDescription>
                              The main title of the content.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subtitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subtitle</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter subtitle" {...field} />
                            </FormControl>
                            <FormDescription>
                              A subtitle or tagline for the content.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter content text"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The main content text. You can use simple formatting.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter image URL" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL to an image for this content. Leave empty if no image is needed.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter link URL" {...field} />
                            </FormControl>
                            <FormDescription>
                              A link URL for this content.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="linkText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link Text</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter link text" {...field} />
                            </FormControl>
                            <FormDescription>
                              Text to display for the link.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="buttonText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Button Text</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter button text" {...field} />
                            </FormControl>
                            <FormDescription>
                              Text for a call-to-action button.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter position"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Order position within the section (0 is first).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Active</FormLabel>
                              <FormDescription>
                                Enable or disable this content on the page.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Content
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Content for each page type */}
          {PAGE_TYPES.map((type) => (
            <TabsContent key={type.value} value={type.value} className="space-y-4">
              {isLoadingContents ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : Object.keys(contentsBySection).length === 0 ? (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-muted-foreground">
                    No content found for this page. Click "Add Content" to create some.
                  </p>
                </div>
              ) : (
                Object.entries(contentsBySection).map(([section, contents]) => (
                  <Card key={section} className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {SECTION_TYPES.find((t) => t.value === section)?.label || section}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">Position</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="text-right w-[150px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contents.sort((a, b) => a.position - b.position).map((content) => (
                            <TableRow key={content.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-1">
                                  {content.position}
                                  <div className="flex flex-col ml-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleReorder(content, 'up')}
                                      disabled={content.position === 0}
                                      className="h-5 w-5"
                                    >
                                      <MoveUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleReorder(content, 'down')}
                                      className="h-5 w-5"
                                    >
                                      <MoveDown className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{content.title || '-'}</TableCell>
                              <TableCell className="max-w-[300px] truncate">
                                {content.content || '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={content.active}
                                    onCheckedChange={() => handleToggleActive(content)}
                                  />
                                  <Label className={content.active ? 'text-green-600' : 'text-muted-foreground'}>
                                    {content.active ? 'Active' : 'Inactive'}
                                  </Label>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditContent(content)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to delete this content?')) {
                                        deleteMutation.mutate(content.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Page Content</DialogTitle>
            <DialogDescription>
              Update the content for your dynamic pages.
            </DialogDescription>
          </DialogHeader>
          {currentContent && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitUpdate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select page type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAGE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SECTION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtitle</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter subtitle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter content text"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter image URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter link URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter link text" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="buttonText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter button text" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter position"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Enable or disable this content on the page.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Content
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}