// server/routes/neighborhoods.ts (or wherever you define your routes)

import express, { Request, Response } from 'express';
import { db } from '../db'; // Adjust path as needed
import {
  neighborhoods,
  insertNeighborhoodSchema,
  updateNeighborhoodSchema,
  type Neighborhood
} from '@shared/schema'; // Adjust path as needed
import { eq, and, or, like, ilike, desc, sql } from 'drizzle-orm';

// --- Middleware (Placeholders - Implement these based on your auth) ---
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  // Example: Check if user is logged in (e.g., req.session.user or JWT)
  // if (!req.user) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }
  next();
};

const isAdmin = (req: Request, res: Response, next: Function) => {
  // Example: Check if the logged-in user has the 'admin' role
  // if (req.user?.role !== 'admin') {
  //   return res.status(403).json({ error: 'Forbidden: Admin access required' });
  // }
  next();
};
// --- End Middleware Placeholders ---


const router = express.Router();

// --- GET /neighborhoods (Public List - Active Only) ---
router.get('/neighborhoods', async (req: Request, res: Response) => {
  try {
    const { city, search } = req.query;
    const conditions = [eq(neighborhoods.active, true)]; // Always filter for active

    if (city && typeof city === 'string') {
      conditions.push(ilike(neighborhoods.city, `%${city}%`));
    }

    if (search && typeof search === 'string') {
      conditions.push(
        or(
          ilike(neighborhoods.name, `%${search}%`),
          ilike(neighborhoods.city, `%${search}%`),
          ilike(neighborhoods.description, `%${search}%`) // Optional: search description
        ) ?? sql`false` // Handle case where 'or' might be empty
      );
    }

    const results = await db
      .select()
      .from(neighborhoods)
      .where(and(...conditions))
      .orderBy(desc(neighborhoods.createdAt)); // Or order as needed

    res.json(results);
  } catch (error: any) {
    console.error("Error fetching active neighborhoods:", error);
    res.status(500).json({ error: "Failed to fetch neighborhoods" });
  }
});

// --- GET /neighborhoods/all (Admin List - All Statuses) ---
router.get('/neighborhoods/all', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    // No 'active' filter here
    const results = await db
      .select()
      .from(neighborhoods)
      .orderBy(desc(neighborhoods.createdAt));

    res.json(results);
  } catch (error: any) {
    console.error("Error fetching all neighborhoods (admin):", error);
    res.status(500).json({ error: "Failed to fetch neighborhoods" });
  }
});

// --- GET /neighborhoods/:id (Public Detail - Active Only) ---
router.get('/neighborhoods/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid neighborhood ID" });
    }

    const [result] = await db
      .select()
      .from(neighborhoods)
      .where(and(eq(neighborhoods.id, id), eq(neighborhoods.active, true))); // Must be active

    if (!result) {
      return res.status(404).json({ error: "Neighborhood not found or not active" });
    }
    res.json(result);
  } catch (error: any) {
    console.error(`Error fetching neighborhood ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch neighborhood" });
  }
});

// --- POST /neighborhoods (Admin Create) ---
router.post('/neighborhoods', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  const validationResult = insertNeighborhoodSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: "Invalid input data", details: validationResult.error.errors });
  }

  try {
    const [newNeighborhood] = await db
      .insert(neighborhoods)
      .values(validationResult.data)
      .returning(); // Return the created object

    res.status(201).json(newNeighborhood);
  } catch (error: any) {
    console.error("Error creating neighborhood:", error);
    // Handle potential unique constraint errors (e.g., duplicate name/city)
    if (error.code === '23505') { // PostgreSQL unique violation code
        return res.status(409).json({ error: "Neighborhood with this name and city already exists." });
    }
    res.status(500).json({ error: "Failed to create neighborhood" });
  }
});

// --- PUT /neighborhoods/:id (Admin Update) ---
router.put('/neighborhoods/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid neighborhood ID" });
  }

  const validationResult = updateNeighborhoodSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: "Invalid input data", details: validationResult.error.errors });
  }

  // Prevent updating certain fields if necessary (e.g., createdAt)
  const updateData = validationResult.data;
  // delete updateData.createdAt; // Example if you don't want createdAt updated

  try {
    const [updatedNeighborhood] = await db
      .update(neighborhoods)
      .set({
        ...updateData,
        updatedAt: new Date() // Manually set updatedAt if no trigger
      })
      .where(eq(neighborhoods.id, id))
      .returning();

    if (!updatedNeighborhood) {
      return res.status(404).json({ error: "Neighborhood not found" });
    }

    res.json(updatedNeighborhood);
  } catch (error: any) {
    console.error(`Error updating neighborhood ${id}:`, error);
     // Handle potential unique constraint errors if name/city are updated
    if (error.code === '23505') {
        return res.status(409).json({ error: "Another neighborhood with this name and city already exists." });
    }
    res.status(500).json({ error: "Failed to update neighborhood" });
  }
});

// --- DELETE /neighborhoods/:id (Admin Delete) ---
router.delete('/neighborhoods/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid neighborhood ID" });
  }

  try {
    const result = await db
      .delete(neighborhoods)
      .where(eq(neighborhoods.id, id))
      .returning({ id: neighborhoods.id }); // Check if a row was actually deleted

    if (result.length === 0) {
      return res.status(404).json({ error: "Neighborhood not found" });
    }

    res.status(204).send(); // No content on successful deletion
  } catch (error: any) {
    console.error(`Error deleting neighborhood ${id}:`, error);
    // Handle potential foreign key constraint errors if properties link here
    // if (error.code === '23503') { // PostgreSQL foreign key violation
    //    return res.status(409).json({ error: "Cannot delete neighborhood with associated properties." });
    // }
    res.status(500).json({ error: "Failed to delete neighborhood" });
  }
});

// Export the router to be used in your main server file
// module.exports = router; // If using CommonJS
export default router; // If using ESModules
