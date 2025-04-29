// src/pages/Blog.tsx
import { useState, useMemo } from "react"; // Added useMemo
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { apiRequest } from "@/lib/queryClient";
import type { Post } from "@shared/schema";
import { format } from 'date-fns';
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

// --- Define interface for the API response ---
interface BlogApiResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
}

// Blog post card component (using data from API)
interface BlogPostCardProps {
  post: Post;
}

const BlogPostCard = ({ post }: BlogPostCardProps) => {
  const defaultImage = "/blog/default-blog.jpg"; // Add a default image path
  const postUrl = `/blog/${post.slug}`; // Assuming you'll have a detail page at /blog/:slug

  return (
    <Card className="overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <Link href={postUrl}>
        <div className="relative h-48 overflow-hidden bg-slate-200 group">
          <img
            src={post.imageUrl || defaultImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      <CardHeader className="flex-grow pb-2">
        <div className="flex justify-between items-center mb-2">
          {post.category && <Badge variant="outline">{post.category}</Badge>}
          {post.readTimeMinutes && <span className="text-xs text-slate-500">{post.readTimeMinutes} min read</span>}
        </div>
        <Link href={postUrl}>
          <CardTitle className="text-xl hover:text-primary transition-colors">{post.title}</CardTitle>
        </Link>
        {post.excerpt && <CardDescription className="line-clamp-3 mt-1">{post.excerpt}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center">
          {/* Add author image if available */}
          {post.author?.photoURL && (
             <img src={post.author.photoURL} alt={post.author.name || ''} className="w-8 h-8 rounded-full mr-2 object-cover"/>
          )}
          {/* Fallback or if no image */}
          {!post.author?.photoURL && post.authorName && (
             <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center mr-2 text-xs font-medium">
                {post.authorName.split(' ').map(n => n[0]).join('').toUpperCase()}
             </div>
          )}
          <div>
            <p className="text-sm font-medium">{post.authorName || post.author?.name || 'Staff Writer'}</p>
            {post.publishedAt && <p className="text-xs text-slate-500">{format(new Date(post.publishedAt), 'PP')}</p>}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={postUrl} className="w-full">
          <Button variant="outline" className="w-full">Read More</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

// Featured Post Component (using data from API)
const FeaturedPost = ({ post }: { post: Post | undefined }) => {
  if (!post) return null; // Don't render if no featured post

  const defaultImage = "/blog/default-blog.jpg";
  const postUrl = `/blog/${post.slug}`;

  return (
    <div className="grid md:grid-cols-2 gap-8 mb-12 bg-white rounded-2xl overflow-hidden shadow-md border">
      <Link href={postUrl}>
        <div className="relative h-64 md:h-full overflow-hidden bg-slate-200 group">
          <img
            src={post.imageUrl || defaultImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      <div className="p-6 md:p-8 flex flex-col justify-center">
        {post.category && <Badge className="mb-3 w-fit" variant="outline">{post.category}</Badge>}
        <Link href={postUrl}>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 hover:text-primary transition-colors">{post.title}</h2>
        </Link>
        {post.excerpt && <p className="text-slate-600 mb-4 line-clamp-4">{post.excerpt}</p>}
        <div className="flex items-center mb-5">
          {/* Author Info */}
          {post.author?.photoURL && (
             <img src={post.author.photoURL} alt={post.author.name || ''} className="w-10 h-10 rounded-full mr-3 object-cover"/>
          )}
          {!post.author?.photoURL && post.authorName && (
             <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center mr-3 text-sm font-medium">
                {post.authorName.split(' ').map(n => n[0]).join('').toUpperCase()}
             </div>
          )}
          <div>
            <p className="font-medium">{post.authorName || post.author?.name || 'Staff Writer'}</p>
            {post.publishedAt && <p className="text-xs text-slate-500">{format(new Date(post.publishedAt), 'PP')} {post.readTimeMinutes ? `· ${post.readTimeMinutes} min read` : ''}</p>}
          </div>
        </div>
        <Link href={postUrl}>
          <Button>Read Article</Button>
        </Link>
      </div>
    </div>
  );
};


export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch published blog posts from the API
  // --- Update the type here ---
  const { data: postsData, isLoading, error } = useQuery<BlogApiResponse>({
    queryKey: ['/posts', selectedCategory], // Include category in key for filtering
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      // Add pagination params if needed: params.append('limit', '10');
      const queryString = params.toString();
      // --- Make sure the API request uses 'GET' ---
      const response = await apiRequest<BlogApiResponse>('GET', `/posts${queryString ? `?${queryString}` : ''}`);
      return response;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // --- Access the posts array from the data object ---
  const actualPosts = postsData?.posts || [];

  // Extract featured post (e.g., the latest one)
  const featuredPost = actualPosts.length > 0 ? actualPosts[0] : undefined;
  // Other posts (excluding the featured one if it exists)
  const otherPosts = actualPosts.length > 1 ? actualPosts.slice(1) : [];

  // Get unique categories from posts for TabsList
  const categories = useMemo(() => {
    // --- Use actualPosts here ---
    if (!actualPosts || actualPosts.length === 0) return ["all"];
    const unique = new Set(actualPosts.map(p => p.category).filter(Boolean));
    return ["all", ...Array.from(unique)] as string[];
  }, [actualPosts]); // Depend on the actual array


  const renderPostGrid = () => {
     if (isLoading) {
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-slate-200"></div>
              <CardHeader className="pb-2">
                <div className="h-4 w-1/4 bg-slate-200 rounded mb-2"></div>
                <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 w-full bg-slate-200 rounded"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return <div className="text-center py-10 text-red-600">Error loading posts: {error instanceof Error ? error.message : 'Unknown error'}</div>;
    }

    // --- Use actualPosts here ---
    const postsToDisplay = selectedCategory === 'all' ? otherPosts : actualPosts;

    if (postsToDisplay.length === 0 && selectedCategory !== 'all') {
       return (
          <div className="text-center py-16 bg-slate-50 rounded-lg">
            <h3 className="text-xl font-medium mb-2">No Posts Yet</h3>
            <p className="text-slate-500 mb-4">There are no posts in the "{selectedCategory}" category.</p>
            <Button variant="outline" onClick={() => setSelectedCategory("all")}>
              View All Posts
            </Button>
          </div>
       );
    }
     if (postsToDisplay.length === 0 && selectedCategory === 'all' && !featuredPost) {
       return (
          <div className="text-center py-16 bg-slate-50 rounded-lg">
            <h3 className="text-xl font-medium mb-2">Blog Coming Soon</h3>
            <p className="text-slate-500 mb-4">Check back later for articles and insights.</p>
          </div>
       );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {postsToDisplay.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />
      <PageHeader
        title="HomeHarbor Blog"
        description="Expert insights, market trends, and helpful guides for your real estate journey."
      />

      <div className="container mx-auto px-4 py-8 md:py-12">

        {/* Featured Post */}
        {!isLoading && <FeaturedPost post={featuredPost} />}

        {/* Blog Categories & Posts */}
        <div className="mb-10">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="mb-6 flex-wrap h-auto justify-start">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category === 'all' ? 'All Posts' : category}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Render content based on selected category */}
            <TabsContent value={selectedCategory} className="mt-0">
               {renderPostGrid()}
            </TabsContent>
          </Tabs>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-white rounded-2xl p-8 mb-12 shadow-sm border">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">Stay Updated</h2>
            <p className="text-slate-600 mb-6">
              Subscribe for the latest real estate news and expert advice.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-grow"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Related Resources */}
         <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
            <div className="grid md:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Mortgage Calculators</CardTitle>
                <CardDescription>Estimate your monthly payments with our simple tools.</CardDescription>
                </CardHeader>
                <CardFooter>
                <Link href="/mortgage">
                    <Button variant="outline" className="w-full">
                    View Calculators
                    </Button>
                </Link>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Neighborhood Guides</CardTitle>
                <CardDescription>Explore detailed information about popular neighborhoods.</CardDescription>
                </CardHeader>
                <CardFooter>
                <Link href="/neighborhoods">
                    <Button variant="outline" className="w-full">
                    View Guides
                    </Button>
                </Link>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Connect with Agents</CardTitle>
                <CardDescription>Find experienced real estate professionals in your area.</CardDescription>
                </CardHeader>
                <CardFooter>
                <Link href="/agents">
                    <Button variant="outline" className="w-full">
                    Find Agents
                    </Button>
                </Link>
                </CardFooter>
            </Card>
            </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
