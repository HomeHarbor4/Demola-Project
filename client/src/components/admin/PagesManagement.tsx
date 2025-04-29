// src/components/admin/PagesManagement.tsx (Refactored)
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// List of static pages you want to manage
const STATIC_PAGES = [
  { slug: 'about', label: 'About Us' },
  { slug: 'contact', label: 'Contact' },
  { slug: 'privacy-policy', label: 'Privacy Policy' },
  { slug: 'terms-of-service', label: 'Terms of Service' },
];

export function PagesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState(STATIC_PAGES[0].slug);
  const [htmlContent, setHtmlContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Fetch the HTML content for the selected page
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-page-content', selectedPage],
    queryFn: async () => {
      const res = await apiRequest('GET', `/admin/page-content/${selectedPage}`);
      return res.content || '';
    },
    enabled: !!selectedPage,
  });

  // Sync htmlContent and isDirty when data changes
  useEffect(() => {
    if (typeof data === 'string') {
      setHtmlContent(data);
      setIsDirty(false);
    }
  }, [data]);

  // Mutation to update the HTML content
  const updateMutation = useMutation({
    mutationFn: async ({ newContent }: { newContent: string }) => {
      await apiRequest('POST', `/admin/page-content/${selectedPage}`, { content: newContent });
    },
    onSuccess: () => {
      toast({ title: 'Page updated', description: 'The page content was saved successfully.' });
      setIsDirty(false);
      refetch();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update page.', variant: 'destructive' });
    }
  });

  // Handle page selection change
  const handlePageChange = (slug: string) => {
    setSelectedPage(slug);
    setHtmlContent('');
    setIsDirty(false);
    refetch();
  };

  // Handle HTML content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(e.target.value);
    setIsDirty(true);
  };

  // Handle save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ newContent: htmlContent });
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Static Page</CardTitle>
          <CardDescription>
            Select a page and edit its HTML content. Changes are saved immediately for the selected page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block mb-2 font-medium">Page</label>
              <Select value={selectedPage} onValueChange={handlePageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  {STATIC_PAGES.map((page) => (
                    <SelectItem key={page.slug} value={page.slug}>{page.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-2 font-medium">HTML Content</label>
              <Textarea
                value={htmlContent}
                onChange={handleContentChange}
                rows={16}
                className="font-mono"
                placeholder="<h1>About Us</h1>\n<p>Welcome to our site...</p>"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={!isDirty || updateMutation.isPending} className="w-full">
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
          {/* Live HTML Preview */}
          <div className="mt-8">
            <label className="block mb-2 font-medium">Live Preview</label>
            <div className="border rounded p-4 bg-white min-h-[100px]" style={{overflowX: 'auto'}}
              dangerouslySetInnerHTML={{ __html: htmlContent || '<em>No content</em>' }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
