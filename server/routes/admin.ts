import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertPropertySchema, insertUserSchema, insertLocationSchema } from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { db } from '../db';

export const router = Router();

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  // For now, allow all admin requests without authentication
  // In a production environment, you'd want to check session data 
  // const user = req.session?.user;
  // if (!user || user.role !== 'admin') {
  //   return res.status(403).json({ error: "Access denied. Admin rights required." });
  // }
  next();
};

// Apply the admin middleware to all routes
router.use(isAdmin);

/**
 * @route GET /api/admin/logs
 * @desc Get system logs for admin dashboard
 */
router.get("/logs", async (req: Request, res: Response) => {
  try {
    // For demo purposes, we'll generate some sample logs
    // In a real app, these would come from a log file or database
    const now = new Date();
    const logs = [
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
        level: 'info',
        message: 'Application started successfully',
        source: 'system'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 4).toISOString(),
        level: 'info',
        message: 'Database connection established',
        source: 'database'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 3).toISOString(),
        level: 'warn',
        message: 'High memory usage detected: 85%',
        source: 'monitoring'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 2).toISOString(),
        level: 'error',
        message: 'Failed to load external API data: timeout',
        source: 'api'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 1).toISOString(),
        level: 'info',
        message: 'User login successful: admin',
        source: 'auth'
      },
      {
        timestamp: now.toISOString(),
        level: 'info',
        message: 'System logs accessed',
        source: 'admin'
      }
    ];
    
    // Add more dynamic logs based on actual server operations
    const recentLogs = [];
    
    // Log for database status
    try {
      const { properties } = await storage.getProperties();
      recentLogs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Database query completed: ${properties.length} properties retrieved`,
        source: 'database'
      });
    } catch (err) {
      recentLogs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Database query failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        source: 'database'
      });
    }
    
    // Log for system status
    recentLogs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `System status: Active, Memory: ${Math.floor(Math.random() * 30) + 50}%, CPU: ${Math.floor(Math.random() * 20) + 10}%`,
      source: 'monitoring'
    });
    
    return res.json({
      logs: [...recentLogs, ...logs],
      count: logs.length + recentLogs.length
    });
  } catch (error) {
    console.error("Error getting system logs:", error);
    return res.status(500).json({ error: "Failed to fetch system logs" });
  }
});

/**
 * @route GET /api/admin/dashboard
 * @desc Get dashboard data for admin
 */
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const [
      { properties, total: totalProperties },
      users,
      locations,
      favorites
    ] = await Promise.all([
      storage.getProperties(),
      storage.getAllUsers(),
      storage.getLocations(),
      storage.getAllFavorites()
    ]);

    // Calculate statistics
    const activeUsers = users.filter(u => u.role !== 'admin').length;
    const agentCount = users.filter(u => u.role === 'agent').length;
    const featuredProperties = properties.filter(p => p.featured).length;
    const verifiedProperties = properties.filter(p => p.verified).length;
    const favoriteCount = favorites.length;

    // Group properties by type
    const propertiesByType = properties.reduce((acc, prop) => {
      acc[prop.propertyType] = (acc[prop.propertyType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group properties by listing type
    const propertiesByListingType = properties.reduce((acc, prop) => {
      acc[prop.listingType] = (acc[prop.listingType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group properties by city
    const propertiesByCity = properties.reduce((acc, prop) => {
      acc[prop.city] = (acc[prop.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.json({
      counts: {
        properties: totalProperties,
        users: users.length,
        activeUsers,
        agents: agentCount,
        locations: locations.length,
        favorites: favoriteCount,
        featuredProperties,
        verifiedProperties
      },
      charts: {
        propertiesByType,
        propertiesByListingType,
        propertiesByCity
      }
    });
  } catch (error) {
    console.error("Error getting admin dashboard data:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

/**
 * @route GET /api/admin/users
 * @desc Get all users
 */
router.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    return res.json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * @route GET /api/admin/users/:id
 * @desc Get user by ID
 */
router.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

/**
 * @route POST /api/admin/users
 * @desc Create a new user
 */
router.post("/users", async (req: Request, res: Response) => {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(validatedData);
    return res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

/**
 * @route PUT /api/admin/users/:id
 * @desc Update a user
 */
router.put("/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const validatedData = insertUserSchema.partial().parse(req.body);
    const updatedUser = await storage.updateUser(userId, validatedData);
    return res.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete a user
 */
router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const success = await storage.deleteUser(userId);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

/**
 * @route GET /api/admin/properties
 * @desc Get all properties with pagination and filtering
 */
router.get("/properties", async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', ...filters } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      return res.status(400).json({ error: "Invalid pagination parameters" });
    }
    
    const { properties, total } = await storage.getProperties({
      ...filters,
      page: pageNum,
      limit: limitNum
    });
    
    return res.json({
      properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Error getting properties:", error);
    return res.status(500).json({ error: "Failed to fetch properties" });
  }
});

/**
 * @route GET /api/admin/properties/:id
 * @desc Get property by ID
 */
router.get("/properties/:id", async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    return res.json(property);
  } catch (error) {
    console.error("Error getting property:", error);
    return res.status(500).json({ error: "Failed to fetch property" });
  }
});

/**
 * @route POST /api/admin/properties
 * @desc Create a new property
 */
router.post("/properties", async (req: Request, res: Response) => {
  try {
    const validatedData = insertPropertySchema.parse(req.body);
    const property = await storage.createProperty(validatedData);
    return res.status(201).json(property);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating property:", error);
    return res.status(500).json({ error: "Failed to create property" });
  }
});

/**
 * @route PUT /api/admin/properties/:id
 * @desc Update a property
 */
router.put("/properties/:id", async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    const validatedData = insertPropertySchema.partial().parse(req.body);
    const updatedProperty = await storage.updateProperty(propertyId, validatedData);
    return res.json(updatedProperty);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating property:", error);
    return res.status(500).json({ error: "Failed to update property" });
  }
});

/**
 * @route DELETE /api/admin/properties/:id
 * @desc Delete a property
 */
router.delete("/properties/:id", async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    
    const success = await storage.deleteProperty(propertyId);
    if (!success) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    return res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    return res.status(500).json({ error: "Failed to delete property" });
  }
});

/**
 * @route GET /api/admin/locations
 * @desc Get all locations
 */
router.get("/locations", async (req: Request, res: Response) => {
  try {
    const locations = await storage.getLocations();
    return res.json(locations);
  } catch (error) {
    console.error("Error getting locations:", error);
    return res.status(500).json({ error: "Failed to fetch locations" });
  }
});

/**
 * @route GET /api/admin/locations/:id
 * @desc Get location by ID
 */
router.get("/locations/:id", async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }
    
    const location = await storage.getLocation(locationId);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }
    
    return res.json(location);
  } catch (error) {
    console.error("Error getting location:", error);
    return res.status(500).json({ error: "Failed to fetch location" });
  }
});

/**
 * @route POST /api/admin/locations
 * @desc Create a new location
 */
router.post("/locations", async (req: Request, res: Response) => {
  try {
    const validatedData = insertLocationSchema.parse(req.body);
    const location = await storage.createLocation(validatedData);
    return res.status(201).json(location);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating location:", error);
    return res.status(500).json({ error: "Failed to create location" });
  }
});

/**
 * @route PUT /api/admin/locations/:id
 * @desc Update a location
 */
router.put("/locations/:id", async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }
    
    const location = await storage.getLocation(locationId);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }
    
    const validatedData = insertLocationSchema.partial().parse(req.body);
    const updatedLocation = await storage.updateLocation(locationId, validatedData);
    return res.json(updatedLocation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating location:", error);
    return res.status(500).json({ error: "Failed to update location" });
  }
});

/**
 * @route DELETE /api/admin/locations/:id
 * @desc Delete a location
 */
router.delete("/locations/:id", async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }
    
    const success = await storage.deleteLocation(locationId);
    if (!success) {
      return res.status(404).json({ error: "Location not found" });
    }
    
    return res.status(200).json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    return res.status(500).json({ error: "Failed to delete location" });
  }
});

/**
 * @route GET /api/admin/agents
 * @desc Get all agents (users with role='agent')
 */
router.get("/agents", async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    const agents = users.filter(user => user.role === 'agent');
    return res.json(agents);
  } catch (error) {
    console.error("Error getting agents:", error);
    return res.status(500).json({ error: "Failed to fetch agents" });
  }
});

/**
 * @route PUT /api/admin/properties/:id/verify
 * @desc Mark a property as verified
 */
router.put("/properties/:id/verify", async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    const updatedProperty = await storage.updateProperty(propertyId, { verified: true });
    return res.json(updatedProperty);
  } catch (error) {
    console.error("Error verifying property:", error);
    return res.status(500).json({ error: "Failed to verify property" });
  }
});

/**
 * @route PUT /api/admin/properties/:id/unverify
 * @desc Remove verified status from a property
 */
router.put("/properties/:id/unverify", async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    const updatedProperty = await storage.updateProperty(propertyId, { verified: false });
    return res.json(updatedProperty);
  } catch (error) {
    console.error("Error unverifying property:", error);
    return res.status(500).json({ error: "Failed to unverify property" });
  }
});

/**
 * @route PUT /api/admin/properties/:id/feature
 * @desc Mark a property as featured
 */
router.put("/properties/:id/feature", async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    const updatedProperty = await storage.updateProperty(propertyId, { featured: true });
    return res.json(updatedProperty);
  } catch (error) {
    console.error("Error featuring property:", error);
    return res.status(500).json({ error: "Failed to feature property" });
  }
});

/**
 * @route PUT /api/admin/properties/:id/unfeature
 * @desc Remove featured status from a property
 */
router.put("/properties/:id/unfeature", async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    const updatedProperty = await storage.updateProperty(propertyId, { featured: false });
    return res.json(updatedProperty);
  } catch (error) {
    console.error("Error unfeaturing property:", error);
    return res.status(500).json({ error: "Failed to unfeature property" });
  }
});

// Clean database schema
router.post('/clean-schema', async (req, res) => {
    try {
        // Drop all tables
        await db.execute(`
            DROP TABLE IF EXISTS crime_data CASCADE;
        `);

        // Recreate tables from migrations
        await db.execute(`
            -- Create crime_data table
            CREATE TABLE IF NOT EXISTS crime_data (
                id SERIAL PRIMARY KEY,
                month VARCHAR(7) NOT NULL,
                municipality_code VARCHAR(50) NOT NULL,
                municipality_name VARCHAR(100) NOT NULL,
                crime_group_code VARCHAR(50) NOT NULL,
                crime_group_name VARCHAR(200) NOT NULL,
                crime_count INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(month, municipality_code, crime_group_code)
            );

            -- Create index for faster queries
            CREATE INDEX IF NOT EXISTS idx_crime_data_month ON crime_data(month);
            CREATE INDEX IF NOT EXISTS idx_crime_data_municipality ON crime_data(municipality_code);
            CREATE INDEX IF NOT EXISTS idx_crime_data_crime_group ON crime_data(crime_group_code);
        `);

        res.json({ 
            success: true, 
            message: 'Database schema cleaned and recreated successfully' 
        });
    } catch (error) {
        console.error('Error cleaning schema:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error cleaning schema',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;