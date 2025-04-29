import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertFavoriteSchema } from "@shared/schema";
import { favorites, properties } from "@shared/schema"; // Drizzle tables
import { db } from "../db"; // Drizzle instance
import { eq, and } from "drizzle-orm"; // Drizzle operators

export const router = Router();
// Helper for handling async route errors (optional, but good practice)
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * @route GET /api/favorites
 * @desc Get all favorites for a user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get user ID from session or query parameter 
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const favorites = await storage.getFavoritesByUser(userId);
    return res.json(favorites);
  } catch (error) {
    console.error("Error getting favorites:", error);
    return res.status(500).json({ error: "Failed to get favorites" });
  }
});

/**
 * @route POST /api/favorites
 * @desc Add a property to user's favorites
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = insertFavoriteSchema.parse(req.body);
    
    // Check if favorite already exists
    const isFavorite = await storage.isFavorite(validatedData.userId, validatedData.propertyId);
    if (isFavorite) {
      return res.status(409).json({ error: "Property is already in favorites" });
    }
    
    const favorite = await storage.addFavorite(validatedData);
    return res.status(201).json(favorite);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error adding favorite:", error);
    return res.status(500).json({ error: "Failed to add favorite" });
  }
});

/**
 * @route DELETE /api/favorites/:userId/:propertyId
 * @desc Remove a property from user's favorites
 */
router.delete("/:userId/:propertyId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const propertyId = parseInt(req.params.propertyId);
    
    if (isNaN(userId) || isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid user ID or property ID" });
    }
    
    const success = await storage.removeFavorite(userId, propertyId);
    if (!success) {
      return res.status(404).json({ error: "Favorite not found" });
    }
    
    return res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return res.status(500).json({ error: "Failed to remove favorite" });
  }
});

/**
 * @route GET /api/favorites/check/:userId/:propertyId
 * @desc Check if a property is in user's favorites
 */
router.get("/check/:userId/:propertyId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const propertyId = parseInt(req.params.propertyId);
    
    if (isNaN(userId) || isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid user ID or property ID" });
    }
    
    const isFavorite = await storage.isFavorite(userId, propertyId);
    return res.json({ isFavorite });
  } catch (error) {
    console.error("Error checking favorite:", error);
    return res.status(500).json({ error: "Failed to check favorite" });
  }
});

/**
 * @route   GET /api/favorites/user/:userId
 * @desc    Get all properties favorited by a specific user
 * @access  Public (Authentication removed)
 */
// --- Removed 'authenticate' middleware from here ---
router.get("/user/:userId", asyncHandler(async (req: Request, res: Response) => {
  const userIdParam = req.params.userId;
  const requestedUserId = parseInt(userIdParam, 10);

  // --- Removed Authorization Check Block ---
  // const loggedInUserId = req.user?.id;
  // if (!loggedInUserId) { ... }
  // if (loggedInUserId !== requestedUserId) { ... }
  // --- End Removed Block ---

  console.log(`Handling GET /api/favorites/user/${userIdParam} (Public)`);

  if (isNaN(requestedUserId)) {
      console.log("Invalid user ID parameter:", userIdParam);
      return res.status(400).json({ success: false, message: "Invalid user ID provided" });
  }

  try {
      // Fetch properties that are favorited by the requested user ID
      const favoriteProperties = await db
          .select({
              property: properties // Select the full property object
          })
          .from(favorites)
          .innerJoin(properties, eq(favorites.propertyId, properties.id))
          .where(eq(favorites.userId, requestedUserId)) // Filter by the user ID from the URL
          .orderBy(favorites.createdAt);

      const propertiesList = favoriteProperties.map(fav => fav.property);

      console.log(`Found ${propertiesList.length} favorite properties for user ID ${requestedUserId}`);
      res.json(propertiesList); // Send the array of property objects

  } catch (error: any) {
      console.error(`Error fetching favorites for user ID ${requestedUserId}:`, error);
      res.status(500).json({
          success: false,
          message: "Failed to fetch user favorites",
          details: error.message,
      });
  }
}));