// src/components/admin/BlogPostForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { insertPostSchema, type Post } from "@shared/schema";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import slugify from 'slugify'; // Install: npm install slugify

// Use the Zod schema for form validation
const formSchema = insertPostSchema;
type FormValues = z.infer<typeof formSchema>;

interface BlogPostFormProps {
  onSubmit: (values: FormValues) => Promise<void>;
  initialData?: Post | null;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function BlogPostForm({ onSubmit, initialData = null, isLoading = false, onCancel }: BlogPostFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      excerpt: initialData?.excerpt || "",
      content: initialData?.content || "",
      authorName: initialData?.authorName || "", // Or fetch author based on authorId
      category: initialData?.category || "",
      tags: initialData?.tags || "",
      imageUrl: initialData?.imageUrl || "",
      readTimeMinutes: initialData?.readTimeMinutes || undefined,
      isPublished: initialData?.isPublished ?? false,
      publishedAt: initialData?.publishedAt ? new Date(initialData.publishedAt) : undefined,
    },
  });

  // Auto-generate slug from title if slug field is empty
  const titleValue = form.watch("title");
  useEffect(() => {
    if (titleValue && !form.getValues("slug")) {
      form.setValue("slug", slugify(titleValue, { lower: true, strict: true }), { shouldValidate: true });
    }
    // Optionally, you could auto-update slug if title changes AND it's a new post
    // else if (titleValue && !initialData) { ... }
  }, [titleValue, form, initialData]);


  // Reset form if initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || "",
        slug: initialData.slug || "",
        excerpt: initialData.excerpt || "",
        content: initialData.content || "",
        authorName: initialData.authorName || "",
        category: initialData.category || "",
        tags: initialData.tags || "",
        imageUrl: initialData.imageUrl || "",
        readTimeMinutes: initialData.readTimeMinutes || undefined,
        isPublished: initialData.isPublished ?? false,
        publishedAt: initialData.publishedAt ? new Date(initialData.publishedAt) : undefined,
      });
    } else {
       form.reset({ // Reset to defaults for creation
          title: "", slug: "", excerpt: "", content: "", authorName: "",
          category: "", tags: "", imageUrl: "", readTimeMinutes: undefined,
          isPublished: false, publishedAt: undefined
       });
    }
  }, [initialData, form]);

  const handleFormSubmit = (values: FormValues) => {
    // Process values before submitting if needed (e.g., ensure numbers are numbers)
    const processedValues = {
        ...values,
        readTimeMinutes: values.readTimeMinutes || undefined,
        // Ensure publishedAt is set if isPublished is true and date isn't already set
        publishedAt: values.isPublished && !values.publishedAt ? new Date() : values.publishedAt,
    };
    onSubmit(processedValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Title & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title*</FormLabel>
                <FormControl>
                  <Input placeholder="Blog Post Title" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug*</FormLabel>
                <FormControl>
                  <Input placeholder="blog-post-title" {...field} disabled={isLoading} />
                </FormControl>
                <FormDescription>URL-friendly identifier (auto-generated from title if empty).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Excerpt */}
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt</FormLabel>
              <FormControl>
                <Textarea placeholder="Short summary of the post..." {...field} value={field.value ?? ''} disabled={isLoading} rows={3} />
              </FormControl>
              <FormDescription>A brief preview shown in listings.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content*</FormLabel>
              <FormControl>
                {/* Consider using a Rich Text Editor component here (e.g., TipTap, Quill) */}
                <Textarea placeholder="Write your blog post content here (Markdown supported)..." {...field} disabled={isLoading} rows={15} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Metadata */}
        <h3 className="text-lg font-medium pt-4 border-t">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="authorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., John Doe" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Buying, Trends" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., first-time, investment, tips" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                 <FormDescription>Comma-separated list.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://example.com/image.jpg" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="readTimeMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Read Time (Minutes)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 8" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

         {/* Publishing Status */}
         <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-slate-50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    id="published-checkbox"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <Label htmlFor="published-checkbox">
                    Published
                  </Label>
                  <FormDescription>
                    Make this post visible on the public blog.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

        {/* Submit/Cancel Buttons */}
        <div className="flex justify-end gap-4 pt-4">
           {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                 Cancel
              </Button>
           )}
           <Button type="submit" disabled={isLoading}>
             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             {initialData ? "Update Post" : "Create Post"}
           </Button>
        </div>
      </form>
    </Form>
  );
}
