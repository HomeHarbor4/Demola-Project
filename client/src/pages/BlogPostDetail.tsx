// src/pages/BlogPostDetail.tsx
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader"; // Optional: Use if you want a header
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import type { Post } from "@shared/schema";
import { format } from 'date-fns';
import { Spinner } from "@/components/Spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Calendar, Clock, User as UserIcon } from "lucide-react"; // Icons
// Optional: Import a Markdown renderer if your content is Markdown
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown

export default function BlogPostDetail() {
  const params = useParams();
  const slug = params.slug; // Get slug from URL

  // Fetch the specific blog post using its slug
  const { data: post, isLoading, error } = useQuery<Post>({
    queryKey: ['/posts/slug', slug], // Use slug in the query key
    queryFn: async () => {
      if (!slug) throw new Error("No slug provided");
      // Ensure GET method is specified
      return apiRequest<Post>('GET', `/posts/slug/${slug}`);
    },
    enabled: !!slug, // Only run query if slug exists
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto p-8 flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
           <Alert variant="destructive" className="max-w-lg mx-auto mb-8">
             <AlertDescription>
               {error instanceof Error ? error.message : 'Could not load blog post or post not found.'}
             </AlertDescription>
           </Alert>
          <Link href="/blog">
             <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
             </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const defaultImage = "/blog/default-blog.jpg"; // Default image if none provided

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl"> {/* Limit width for readability */}
        {/* Post Header */}
        <header className="mb-8 md:mb-12">
          {/* Back Link */}
          <Link href="/blog">
            <Button variant="ghost" className="mb-4 text-primary hover:text-primary/90 px-0">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
            </Button>
          </Link>

          {/* Category */}
          {post.category && (
            <Badge variant="outline" className="mb-2">{post.category}</Badge>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4">{post.title}</h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            {/* Author */}
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-1.5" />
              <span>{post.authorName || post.author?.name || 'Staff Writer'}</span>
            </div>
            {/* Published Date */}
            {post.publishedAt && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1.5" />
                <span>{format(new Date(post.publishedAt), 'PPP')}</span> {/* e.g., Jun 10, 2024 */}
              </div>
            )}
            {/* Read Time */}
            {post.readTimeMinutes && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1.5" />
                <span>{post.readTimeMinutes} min read</span>
              </div>
            )}
          </div>
        </header>

        {/* Featured Image */}
        {post.imageUrl && (
          <div className="mb-8 md:mb-12 rounded-lg overflow-hidden shadow-md">
            <img
              src={post.imageUrl || defaultImage}
              alt={post.title}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Post Content */}
        <Card>
          <CardContent className="pt-6">
            {/* Use a prose class for nice typography defaults */}
            {/* If using Markdown: */}
            {/* <div className="prose prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            </div> */}

            {/* If content is plain text (add line breaks): */}
            <div className="prose prose-lg max-w-none text-slate-800 whitespace-pre-wrap">
              {post.content}
            </div>
          </CardContent>
        </Card>

        {/* Optional: Tags */}
        {post.tags && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-semibold mb-2 text-slate-600">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Optional: Author Bio */}
        {/* Add if you have author bio data */}

        {/* Optional: Related Posts */}
        {/* Add if you implement related posts logic */}

      </div>

      <Footer />
    </div>
  );
}
