import { Router, Request, Response } from "express";
import { db } from "../db";
import { storage } from "../storage";
import { properties, locations, settings } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { seedDatabase } from '../seedDatabase';

const router = Router();

// Validation schema for currency settings
const currencySettingsSchema = z.object({
  currency: z.string().min(1),
  symbol: z.string().min(1),
  position: z.enum(["before", "after"]),
});

// Validation schema for site settings
const siteSettingsSchema = z.object({
  siteName: z.string().min(1),
  brandName: z.string().min(1),
  footerCopyright: z.string(),
  contactPhone: z.string().min(1),
  contactEmail: z.string().email(),
  defaultLanguage: z.string().default("en"),
  showAdminLink: z.boolean(),
  heroImageUrl: z.string()
});

// Validation schema for data generation
const dataGenerationSchema = z.object({
  clearExisting: z.boolean().default(false),
});

/**
 * @route GET /api/admin/settings/currency
 * @desc Get current currency settings
 */
router.get("/currency", async (req: Request, res: Response) => {
  try {
    // Get current currency settings from settings table
    const [currentSettings] = await db.select().from(settings).where(eq(settings.key, 'currency'));
    
    if (!currentSettings) {
      // Return default settings if none exist
      return res.json({
        currency: "USD",
        symbol: "$",
        position: "before"
      });
    }
    
    return res.json(JSON.parse(currentSettings.value));
  } catch (error) {
    console.error("Error getting currency settings:", error);
    return res.status(500).json({ error: "Failed to fetch currency settings" });
  }
});

/**
 * @route POST /api/admin/settings/currency
 * @desc Update currency settings
 */
router.post("/currency", async (req: Request, res: Response) => {
  try {
    const validatedData = currencySettingsSchema.parse(req.body);
    
    // Check if settings already exist
    const [existingSettings] = await db.select().from(settings).where(eq(settings.key, 'currency'));
    
    if (existingSettings) {
      // Update existing settings
      await db.update(settings)
        .set({ value: JSON.stringify(validatedData) })
        .where(eq(settings.id, existingSettings.id));
    } else {
      // Create new settings
      await db.insert(settings).values({
        key: 'currency',
        value: JSON.stringify(validatedData)
      });
    }
    
    return res.json({ success: true, settings: validatedData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating currency settings:", error);
    return res.status(500).json({ error: "Failed to update currency settings" });
  }
});

/**
 * @route POST /api/admin/generate-data
 * @desc Generate property data for a specific country
 */
router.post("/generate-data", async (req: Request, res: Response) => {
  try {
    const validatedData = dataGenerationSchema.parse(req.body);
    // Only support full reseed
    if (validatedData.clearExisting) {
      await seedDatabase();
      return res.json({ success: true, message: 'Database reseeded using main seed script.' });
    } else {
      return res.status(400).json({ error: 'Full reseed is required. Partial/country-specific seeding is not supported.' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error generating data:", error);
    return res.status(500).json({ error: "Failed to generate data" });
  }
});

/**
 * @route DELETE /api/admin/clear-all-data
 * @desc Clear all properties and locations data
 */
router.delete("/clear-all-data", async (req: Request, res: Response) => {
  try {
    // Delete all properties first (due to foreign key constraints)
    await db.delete(properties);
    
    // Delete all locations
    await db.delete(locations);
    
    return res.json({ 
      success: true, 
      message: "All properties and locations have been deleted" 
    });
  } catch (error) {
    console.error("Error clearing data:", error);
    return res.status(500).json({ error: "Failed to clear data" });
  }
});

/**
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard data
 */
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    // Get property count
    const [propertyCount] = await db
      .select({ count: sql`count(*)` })
      .from(properties);
    
    // Get user count
    const users = await storage.getAllUsers();
    
    // Get location count
    const [locationCount] = await db
      .select({ count: sql`count(*)` })
      .from(locations);
    
    // Get featured property count
    const [featuredCount] = await db
      .select({ count: sql`count(*)` })
      .from(properties)
      .where(eq(properties.featured, true));
    
    // Get verified property count
    const [verifiedCount] = await db
      .select({ count: sql`count(*)` })
      .from(properties)
      .where(eq(properties.verified, true));
    
    // Get properties by type
    const propertiesByType = await storage.getPropertiesByType();
    
    // Get properties by listing type
    const propertiesByListingType = await storage.getPropertiesByListingType();
    
    // Get properties by city
    const propertiesByCity = await storage.getPropertiesByCity();
    
    // Get recent properties
    const recentProperties = await db
      .select()
      .from(properties)
      .orderBy(sql`${properties.createdAt} DESC`)
      .limit(5);
    
    // For security, we will not include sensitive user data
    const recentUsers = users
      .slice(0, 5)
      .map(({ id, name, username, email, role, createdAt }) => ({
        id, name, username, email, role, createdAt
      }));
    
    return res.json({
      counts: {
        properties: propertyCount?.count || 0,
        users: users.length,
        locations: locationCount?.count || 0,
        featuredProperties: featuredCount?.count || 0,
        verifiedProperties: verifiedCount?.count || 0,
      },
      charts: {
        propertiesByType,
        propertiesByListingType,
        propertiesByCity,
      },
      recentProperties,
      recentUsers,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

/**
 * @route GET /api/settings/site
 * @desc Get current site settings
 */
router.get("/site", async (req: Request, res: Response) => {
  try {
    // Get current site settings from settings table
    const [currentSettings] = await db.select().from(settings).where(eq(settings.key, 'site'));
    
    if (!currentSettings) {
      // Return default settings if none exist
      return res.json({
        siteName: "HomeHarbor",
        brandName: "HomeHarbor",
        footerCopyright: `© ${new Date().getFullYear()} HomeHarbor. All rights reserved.`,
        contactPhone: "+358 123 456 789",
        contactEmail: "info@homeharbor.com",
        defaultLanguage: "en",
        showAdminLink: true,
        heroImageUrl: null
      });
    }
    
    return res.json(JSON.parse(currentSettings.value));
  } catch (error) {
    console.error("Error getting site settings:", error);
    return res.status(500).json({ error: "Failed to fetch site settings" });
  }
});

/**
 * @route POST /api/admin/settings/site
 * @desc Update site settings
 */
router.post("/site", async (req: Request, res: Response) => {
  try {
    const validatedData = siteSettingsSchema.parse(req.body);
    
    // Check if settings already exist
    const [existingSettings] = await db.select().from(settings).where(eq(settings.key, 'site'));
    
    if (existingSettings) {
      // Update existing settings
      await db.update(settings)
        .set({ value: JSON.stringify(validatedData) })
        .where(eq(settings.id, existingSettings.id));
    } else {
      // Create new settings
      await db.insert(settings).values({
        key: 'site',
        value: JSON.stringify(validatedData)
      });
    }
    
    return res.json({ success: true, settings: validatedData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating site settings:", error);
    return res.status(500).json({ error: "Failed to update site settings" });
  }
});

export default router;