// server/routes.ts
import type { Express, Request, Response, NextFunction } from "express"; // Added Request, Response, NextFunction
import { storage } from "./storage";
import { PROPERTY_TYPES } from "../shared/schema";
import {
  insertUserSchema, insertPropertySchema, properties, locations, settings,
  insertLocationSchema, type Location // Added insertLocationSchema and Location type
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";
import usersRoutes from "./routes/users";
import placesRoutes from "./routes/places";
import ouluDataRoutes from "./routes/oulu-data";
import reseedRoutes from "./routes/reseed";
import { router as favoritesRoutes } from "./routes/favorites";
import { router as adminRoutes } from "./routes/admin";
import { router as messagesRoutes } from "./routes/messages";
import settingsRoutes from "./routes/settings";
import logsRoutes from "./routes/logs";
import footerRoutes from "./routes/footer";
import pageContentRouter from "./routes/pageContent";
import neighborhoodRoutes from './routes/neighborhoods'; // Adjust path
import postsRoutes from './routes/posts';
import { log } from "console";
import { Router } from 'express';
import { adminOnly } from './routes/middleware'; // if you have admin middleware
import staticPagesRoutes from './routes/staticPages';
import { ouluDataService } from "./services/ouluDataService";
import crimedata from './crimedata.json';

// Helper for handling async route errors
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Helper: Haversine distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function registerRoutes(app: Express): Promise<void> {
  // Register modular routes
  app.use("/api/users", usersRoutes);
  app.use("/api/places", placesRoutes);
  app.use("/api/oulu", ouluDataRoutes);
  app.use("/api/reseed", reseedRoutes);
  app.use("/api/favorites", favoritesRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/messages", messagesRoutes);
  app.use("/api/admin/settings", settingsRoutes);
  app.use("/api/admin/logs", logsRoutes);
  app.use("/api/footer", footerRoutes);
  app.use("/api/page-content", pageContentRouter);
  app.use('/api', neighborhoodRoutes);
  app.use('/api', postsRoutes);
  app.use('/api/admin/page-content', staticPagesRoutes);

  // --- Public Settings Endpoints ---
  app.get("/api/settings/currency", asyncHandler(async (req, res) => {
    const [currentSettings] = await db.select().from(settings).where(eq(settings.key, 'currency'));
    if (!currentSettings) {
      return res.json({ currency: "EUR", symbol: "€", position: "before", decimalPlaces: 0 });
    }
    // Add try-catch for JSON parsing
    try {
      return res.json(JSON.parse(currentSettings.value));
    } catch (parseError) {
      console.error("Error parsing currency settings:", parseError);
      return res.status(500).json({ error: "Failed to parse currency settings from database" });
    }
  }));

  app.get("/api/settings/site", asyncHandler(async (req, res) => {
    const [currentSettings] = await db.select().from(settings).where(eq(settings.key, 'site'));
    if (!currentSettings) {
      return res.json({
        siteName: "HomeHarbor", brandName: "HomeHarbor",
        footerCopyright: `© ${new Date().getFullYear()} HomeHarbor. All rights reserved.`,
        contactPhone: "+358 123 456 789", contactEmail: "info@homeharbor.com",
        defaultLanguage: "en", showAdminLink: true
      });
    }
     // Add try-catch for JSON parsing
    try {
      return res.json(JSON.parse(currentSettings.value));
    } catch (parseError) {
      console.error("Error parsing site settings:", parseError);
      return res.status(500).json({ error: "Failed to parse site settings from database" });
    }
  }));

  // --- Admin Data Management Routes ---
  app.delete("/api/admin/clear-all-data", asyncHandler(async (req, res) => {
    // Ensure this is protected by admin middleware if not done in adminRoutes
    await db.delete(properties);
    await db.delete(locations);
    return res.json({ success: true, message: "All properties and locations have been deleted" });
  }));

  app.post("/api/admin/generate-data", asyncHandler(async (req, res) => {
    const validationSchema = z.object({
      clearExisting: z.boolean().default(false),
    });
    const validatedData = validationSchema.parse(req.body);
    if (validatedData.clearExisting) {
      const settingsModule = await import('./seedDatabase');
      await settingsModule.seedDatabase();
      return res.json({ success: true, message: 'Database reseeded using main seed script.' });
    } else {
      return res.status(400).json({ error: 'Full reseed is required. Partial/country-specific seeding is not supported.' });
    }
  }));

  // --- Property Routes Implementation ---
  app.get("/api/properties", asyncHandler(async (req, res) => {
    // Extract filters from query parameters (req.query)
    const filters = req.query; // Includes page, limit, city, type, etc.
    const { properties: propertyList, total } = await storage.getProperties(filters);
    res.json({ properties: propertyList, total });
  }));

  app.get("/api/properties/featured", asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 16;
    const featuredProperties = await storage.getFeaturedProperties(limit);
    res.json(featuredProperties);
  }));

  app.get("/api/properties/search", asyncHandler(async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Search query 'q' is required" });
    }
    const searchResults = await storage.searchProperties(query);
    res.json(searchResults);
  }));

  app.get("/api/properties/:id/recommendations", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    const recommendations = await storage.getRecommendedProperties(id, limit);
    res.json(recommendations);
  }));

  app.get("/api/properties/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    const property = await storage.getProperty(id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json(property);
  }));

  app.post("/api/properties", asyncHandler(async (req, res) => {
    // Add validation using Zod schema
    try {
      // Note: insertPropertySchema might need adjustment if frontend sends numbers as strings
      const validatedData = insertPropertySchema.parse(req.body);
      const newProperty = await storage.createProperty(validatedData);
      res.status(201).json(newProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      // Re-throw other errors to be caught by asyncHandler/generic handler
      throw error;
    }
  }));

  app.get("/api/properties/types", asyncHandler(async (req, res) => {
    // Simply return the predefined list
    res.json(PROPERTY_TYPES);
  }));

  app.put("/api/properties/:id", asyncHandler(async (req, res) => {
    // Ensure this route is protected if needed (e.g., only owner or admin can update)
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    // Add partial validation if desired
    // const validatedData = insertPropertySchema.partial().parse(req.body);
    const updatedProperty = await storage.updateProperty(id, req.body); // Pass req.body directly for partial updates
    if (!updatedProperty) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json(updatedProperty);
  }));

  app.delete("/api/properties/:id", asyncHandler(async (req, res) => {
    // Ensure this route is protected (e.g., only owner or admin can delete)
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    const success = await storage.deleteProperty(id);
    if (!success) {
      // This might happen if the storage method returns false on failure,
      // or if the item wasn't found (depending on implementation)
      return res.status(404).json({ error: "Property not found or could not be deleted" });
    }
    res.status(204).send(); // No content on successful deletion
  }));

  // --- Location Routes Implementation ---
  app.get("/api/locations", asyncHandler(async (req, res) => {
    const locationList = await storage.getLocations();
    res.json(locationList);
  }));

  app.get("/api/locations/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }
    const location = await storage.getLocation(id);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json(location);
  }));

  // POST /api/locations - Create a new location
  app.post("/api/locations", asyncHandler(async (req, res) => {
    // Add validation using Zod schema
    try {
      // Validate the request body against the schema
      const validatedData = insertLocationSchema.parse(req.body);
      const newLocation = await storage.createLocation(validatedData);
      res.status(201).json(newLocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Return validation errors
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      // Re-throw other errors to be caught by asyncHandler/generic handler
      throw error;
    }
  }));

  // PUT /api/locations/:id - Update an existing location
  app.put("/api/locations/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }
    // Add partial validation if desired
    // const validatedData = insertLocationSchema.partial().parse(req.body);
    // Pass req.body directly for partial updates
    const updatedLocation = await storage.updateLocation(id, req.body);
    if (!updatedLocation) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json(updatedLocation);
  }));

  // DELETE /api/locations/:id - Delete a location
  app.delete("/api/locations/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }
    const success = await storage.deleteLocation(id);
    if (!success) {
      // This might happen if the storage method returns false on failure,
      // or if the item wasn't found (depending on implementation)
      // Also consider if deleting a location with properties should be allowed
      return res.status(404).json({ error: "Location not found or could not be deleted" });
    }
    res.status(204).send(); // No content on successful deletion
  }));

  app.get("/api/properties/user/:userId", asyncHandler(async (req: Request, res: Response) => {
    const userIdParam = req.params.userId;
    const userId = parseInt(userIdParam, 10);

    console.log(`Handling GET /api/properties/user/${userIdParam}`); // Log request

    if (isNaN(userId)) {
      console.log("Invalid user ID parameter:", userIdParam);
      return res.status(400).json({ success: false, message: "Invalid user ID provided" });
    }

    try {
      // Fetch properties from the database where userId matches
      const userProperties = await db.select()
        .from(properties)
        .where(eq(properties.userId, userId)) // Filter by the userId column
        .orderBy(properties.createdAt); // Optional: Order results

      console.log(`Found ${userProperties.length} properties for user ID ${userId}`);
      // Return the properties found (will be an empty array if none found)
      res.json(userProperties); // Send the array directly

    } catch (error: any) {
      console.error(`Error fetching properties for user ID ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user properties",
        details: error.message,
      });
    }
  }));

  app.get("/api/attractions/nearby", asyncHandler(async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10;
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "Missing or invalid lat/lng" });
    }
    const attractions = await ouluDataService.getNearbyAttractions(lat, lng, radius);
    res.json(attractions);
  }));

  app.get('/api/crime-rate', asyncHandler(async (req, res) => {
    const { city } = req.query;

    // Get last 12 months in YYYY-MM format
    const now = new Date();
    const months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Query the database for crime data
    let result;
    if (city) {
      // If city is provided, filter by city name (case-insensitive)
      const cityName = city as string;
      result = await db.query.crime_data.findMany({
        where: (crime_data, { and, ilike, inArray }) => and(
          ilike(crime_data.municipality_name, `%${cityName}%`),
          inArray(crime_data.month, months)
        ),
        columns: {
          crime_count: true,
          month: true,
          municipality_code: true,
          municipality_name: true,
          crime_group_code: true,
          crime_group_name: true
        }
      });
    } else {
      // If no city is provided, get all data
      result = await db.query.crime_data.findMany({
        where: (crime_data, { inArray }) => inArray(crime_data.month, months),
        columns: {
          crime_count: true,
          month: true,
          municipality_code: true,
          municipality_name: true,
          crime_group_code: true,
          crime_group_name: true
        }
      });
    }

    // Calculate total crimes
    const total = result.reduce((sum, entry) => sum + entry.crime_count, 0);

    res.json({ 
      city: city || 'all',
      totalCrimes: total, 
      months: months.length,
      dataPoints: result.length,
      data: result
    });
  }));
}
