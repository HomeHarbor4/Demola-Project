// server/routes/posts.ts

import express, { Request, Response } from 'express';
import slugify from 'slugify';
import { db } from '../db'; // Adjust path as needed
import {
  posts,
  users,
  insertPostSchema,
  updatePostSchema,
  type Post,
  type User // Import User type
} from '@shared/schema'; // Adjust path as needed
import { eq, and, or, like, ilike, desc, sql, count, getTableColumns, ne, inArray, isNotNull } from 'drizzle-orm'; // Added inArray, isNotNull
import { log } from 'console';

// --- Middleware Placeholders ---
const isAuthenticated = (req: Request, res: Response, next: Function) => next();
const isAdmin = (req: Request, res: Response, next: Function) => next();
// --- End Middleware Placeholders ---

const router = express.Router();

// --- GET /posts (Public List - Published Only) ---
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category as string;

    const conditions = [eq(posts.isPublished, true)];

    if (category) {
      conditions.push(eq(posts.category, category));
    }

    // --- Step 1: Fetch Posts Only ---
    const postsResults = await db
      .select() // Select all columns from posts table
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(sql`COALESCE(${posts.publishedAt}, ${posts.createdAt})`))
      .limit(limit)
      .offset(offset);

    log(`[GET /posts] Fetched ${postsResults.length} posts from DB.`);

    // --- Step 2: Fetch Authors Separately ---
    // Get unique, non-null author IDs from the fetched posts
    const authorIds = [
      ...new Set(postsResults.map(p => p.authorId).filter(id => id !== null && id !== undefined))
    ] as number[]; // Ensure it's an array of numbers

    let authorsMap: Map<number, Partial<User>> = new Map(); // Use Partial<User> for selected fields

    if (authorIds.length > 0) {
      log(`[GET /posts] Fetching author details for IDs: ${authorIds.join(', ')}`);
      const authorsData = await db
        .select({ // Select only necessary author fields
          id: users.id,
          name: users.name,
          email: users.email,
          photoURL: users.photoURL
        })
        .from(users)
        .where(inArray(users.id, authorIds)); // Use inArray for efficiency

      // Create a map for easy lookup
      authorsData.forEach(author => {
        authorsMap.set(author.id, author);
      });
      log(`[GET /posts] Found ${authorsMap.size} matching authors.`);
    }

    // --- Step 3: Combine Data ---
    const processedResults = postsResults.map(post => {
      const author = post.authorId ? authorsMap.get(post.authorId) || null : null;
      // Explicitly create the final structure expected by the frontend
      return {
        ...post, // Spread all properties from the post
        author: author // Add the fetched author object (or null)
      };
    });

    // Get total count (still needs the original conditions)
    const [totalResult] = await db.select({ value: count() }).from(posts).where(and(...conditions));
    const total = totalResult.value;

    // Log structure of first processed result
    if (processedResults.length > 0) {
        log("[GET /posts] Sample processed post result structure:", JSON.stringify(processedResults[0], null, 2));
    }

    res.json({ posts: processedResults, total, page, limit });

  } catch (error: any) {
    // Log the specific error on the server
    log("Error fetching published posts:", error); // Check this log carefully!
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// --- IMPORTANT ---
// Apply the same "fetch separately and combine" logic to the other GET routes
// that need author information (/posts/all, /posts/slug/:slug, /posts/:id)
// ---

// --- GET /posts/all (Admin List - All Statuses) ---
router.get('/posts/all', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = (page - 1) * limit;

    // 1. Fetch Posts
    const postsResults = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // 2. Fetch Authors
    const authorIds = [...new Set(postsResults.map(p => p.authorId).filter(id => id !== null))] as number[];
    let authorsMap: Map<number, { id: number; name: string | null }> = new Map();
    if (authorIds.length > 0) {
      const authorsData = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, authorIds));
      authorsData.forEach(author => authorsMap.set(author.id, author));
    }

    // 3. Combine
    const processedResults = postsResults.map(post => ({
      ...post,
      author: post.authorId ? authorsMap.get(post.authorId) || null : null
    }));

    const [totalResult] = await db.select({ value: count() }).from(posts);
    const total = totalResult.value;

    res.json({ posts: processedResults, total, page, limit });
  } catch (error: any) {
    console.error("Error fetching all posts (admin):", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// --- GET /posts/slug/:slug (Public Detail - Published Only) ---
router.get('/posts/slug/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    // 1. Fetch Post
    const [postResult] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.isPublished, true)));

    if (!postResult) {
      return res.status(404).json({ error: "Blog post not found or not published" });
    }

    // 2. Fetch Author (if authorId exists)
    let author: Partial<User> | null = null;
    if (postResult.authorId) {
      const [authorData] = await db
        .select({ id: users.id, name: users.name, email: users.email, photoURL: users.photoURL })
        .from(users)
        .where(eq(users.id, postResult.authorId));
      author = authorData || null;
    }

    // 3. Combine
    const processedResult = { ...postResult, author };

    res.json(processedResult);
  } catch (error: any) {
    console.error(`Error fetching post by slug ${req.params.slug}:`, error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// --- GET /posts/:id (Admin/Internal Detail - Any Status) ---
router.get('/posts/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // 1. Fetch Post
    const [postResult] = await db.select().from(posts).where(eq(posts.id, id));

    if (!postResult) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    // 2. Fetch Author
    let author: Partial<User> | null = null;
    if (postResult.authorId) {
      const [authorData] = await db
        .select({ id: users.id, name: users.name, email: users.email, photoURL: users.photoURL })
        .from(users)
        .where(eq(users.id, postResult.authorId));
      author = authorData || null;
    }

    // 3. Combine
    const processedResult = { ...postResult, author };

    res.json(processedResult);
  } catch (error: any) {
    console.error(`Error fetching post ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});


// --- POST, PUT, DELETE routes remain the same ---
// ... (POST /posts) ...
// ... (PUT /posts/:id) ...
// ... (DELETE /posts/:id) ...
router.post('/posts', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  const validationResult = insertPostSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: "Invalid input data", details: validationResult.error.errors });
  }

  const data = validationResult.data;

  // Generate slug if not provided or empty
  if (!data.slug && data.title) {
    data.slug = slugify(data.title, { lower: true, strict: true });
  }

  // Ensure slug is unique before inserting
  if (data.slug) {
    const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, data.slug)).limit(1);
    if (existing) {
       return res.status(409).json({ error: "Slug already exists. Please provide a unique slug." });
    }
  } else {
     return res.status(400).json({ error: "Slug could not be generated or is missing." });
  }


  // Set publishedAt if isPublished is true and not already set
  if (data.isPublished && !data.publishedAt) {
    data.publishedAt = new Date();
  }

  try {
    const [newPost] = await db
      .insert(posts)
      .values(data)
      .returning(); // Return the created object

    res.status(201).json(newPost);
  } catch (error: any) {
    console.error("Error creating post:", error);
    if (error.code === '23505') {
        return res.status(409).json({ error: "A post with this slug already exists." });
    }
    res.status(500).json({ error: "Failed to create post" });
  }
});

// --- PUT /posts/:id (Admin Update) ---
// (No changes needed here as it doesn't involve the problematic join selection)
router.put('/posts/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  const validationResult = updatePostSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: "Invalid input data", details: validationResult.error.errors });
  }

  const updateData = validationResult.data;

  // Handle slug generation/update carefully
  if (updateData.title && !updateData.slug) {
    updateData.slug = slugify(updateData.title, { lower: true, strict: true });
  }

  // Ensure slug is unique if it's being changed
  if (updateData.slug) {
    const [existing] = await db.select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.slug, updateData.slug), ne(posts.id, id)))
      .limit(1);
    if (existing) {
       return res.status(409).json({ error: "Slug already exists. Please provide a unique slug." });
    }
  }

  // Set publishedAt if isPublished is being set to true and publishedAt is null/undefined
  if (updateData.isPublished === true && (!req.body.publishedAt || req.body.publishedAt === null)) {
     const [currentPost] = await db.select({ publishedAt: posts.publishedAt }).from(posts).where(eq(posts.id, id));
     if (currentPost && !currentPost.publishedAt) {
        updateData.publishedAt = new Date();
     }
  } else if (updateData.isPublished === false) {
     // updateData.publishedAt = null; // Optional: clear publishedAt
  }


  try {
    const [updatedPost] = await db
      .update(posts)
      .set({
        ...updateData,
        updatedAt: new Date() // Manually set updatedAt if no trigger
      })
      .where(eq(posts.id, id))
      .returning();

    if (!updatedPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    res.json(updatedPost);
  } catch (error: any) {
    console.error(`Error updating post ${id}:`, error);
    if (error.code === '23505') {
        return res.status(409).json({ error: "A post with this slug already exists." });
    }
    res.status(500).json({ error: "Failed to update post" });
  }
});

// --- DELETE /posts/:id (Admin Delete) ---
// (No changes needed here)
router.delete('/posts/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  try {
    const result = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning({ id: posts.id });

    if (result.length === 0) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error(`Error deleting post ${id}:`, error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});


export default router;
