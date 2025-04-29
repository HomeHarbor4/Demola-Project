// src/pages/admin/BlogPosts.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Post, InsertPost } from "@shared/schema";
// --- Corrected import path if AdminLayout is in /layout ---
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BlogPostForm } from "@/components/admin/BlogPostForm"; // Import the form
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Edit, Trash2, CheckCircle, XCircle, Eye } from "lucide-react";
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
import { format } from 'date-fns'; // For formatting dates
import { useTranslation } from 'react-i18next';

// --- Define interface for the API response (can reuse from Blog.tsx if same) ---
interface AdminBlogApiResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
}


export default function AdminBlogPosts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { t } = useTranslation();

  // Fetch all posts (including drafts for admin view)
  // --- Update the type here ---
  const { data: postsData, isLoading, error } = useQuery<AdminBlogApiResponse>({
    queryKey: ['/posts/admin'], // Use a distinct key for admin view
    // --- Ensure GET method is specified ---
    queryFn: () => apiRequest<AdminBlogApiResponse>('GET', '/posts/all'), // Fetch all (adjust endpoint if needed)
  });

  // --- Access the posts array from the data object ---
  const actualPosts = postsData?.posts || [];

  // --- Mutations (remain the same) ---
  const createMutation = useMutation({
    mutationFn: (newData: InsertPost) => apiRequest('POST', '/posts', newData),
    onSuccess: () => {
      toast({ 
        title: t('common.success'), 
        description: t('toast.success.blogPostCreated') 
      });
      queryClient.invalidateQueries({ queryKey: ['/posts/admin'] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast({ 
        title: t('common.error'), 
        description: t('toast.error.createBlogPost'), 
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<InsertPost> }) => apiRequest('PUT', `/posts/${id}`, data),
    onSuccess: () => {
      toast({ 
        title: t('common.success'), 
        description: t('toast.success.blogPostUpdated') 
      });
      queryClient.invalidateQueries({ queryKey: ['/posts/admin'] });
      setIsEditModalOpen(false);
      setSelectedPost(null);
    },
    onError: (err: any) => {
      toast({ 
        title: t('common.error'), 
        description: t('toast.error.updateBlogPost'), 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/posts/${id}`),
    onSuccess: () => {
      toast({ 
        title: t('common.success'), 
        description: t('toast.success.blogPostDeleted') 
      });
      queryClient.invalidateQueries({ queryKey: ['/posts/admin'] });
    },
    onError: (err: any) => {
      toast({ 
        title: t('common.error'), 
        description: t('toast.error.deleteBlogPost'), 
        variant: "destructive" 
      });
    },
  });

  // --- Handlers (remain the same) ---
  const handleCreateSubmit = async (values: InsertPost) => {
    await createMutation.mutateAsync(values);
  };

  const handleEditSubmit = async (values: Partial<InsertPost>) => {
    if (!selectedPost) return;
    await updateMutation.mutateAsync({ id: selectedPost.id, data: values });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const openEditModal = (post: Post) => {
    setSelectedPost(post);
    setIsEditModalOpen(true);
  };

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (error) {
      return <div className="text-red-600 p-4 bg-red-50 rounded-md">Error loading posts: {error instanceof Error ? error.message : 'Unknown error'}</div>;
    }
    // --- Use actualPosts here ---
    if (!actualPosts || actualPosts.length === 0) {
      return <div className="text-center p-10 text-muted-foreground">No blog posts found. Create one to get started!</div>;
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published Date</TableHead>
              <TableHead className="text-right w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* --- Use actualPosts here --- */}
            {actualPosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>{post.category || '-'}</TableCell>
                {/* --- Access author name safely --- */}
                <TableCell>{post.authorName || post.author?.name || '-'}</TableCell>
                <TableCell>
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                     post.isPublished
                       ? 'bg-green-100 text-green-800'
                       : 'bg-yellow-100 text-yellow-800'
                   }`}>
                     {post.isPublished ? <CheckCircle className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                     {post.isPublished ? 'Published' : 'Draft'}
                   </span>
                </TableCell>
                 <TableCell>
                    {post.publishedAt ? format(new Date(post.publishedAt), 'PP') : '-'}
                 </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(post)} title="Edit">
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
                          This action cannot be undone. This will permanently delete the blog post "{post.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(post.id)}
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
        <h1 className="text-2xl font-bold">Manage Blog Posts</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" /> Add New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] md:max-w-[1000px]"> {/* Wider modal */}
            <DialogHeader>
              <DialogTitle>Add New Blog Post</DialogTitle>
            </DialogHeader>
            {/* Scrollable content area */}
            <div className="py-4 max-h-[80vh] overflow-y-auto px-1 pr-3">
              <BlogPostForm
                onSubmit={handleCreateSubmit}
                isLoading={createMutation.isPending}
                onCancel={() => setIsCreateModalOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blog Post List</CardTitle>
          <CardDescription>View, edit, or delete blog posts.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[800px] md:max-w-[1000px]"> {/* Wider modal */}
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[80vh] overflow-y-auto px-1 pr-3">
            {selectedPost && (
              <BlogPostForm
                initialData={selectedPost}
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
