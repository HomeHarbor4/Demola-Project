import { Router, Request, Response } from "express";
import { insertMessageSchema } from "@shared/schema";
import { storage } from "../storage";
import { z } from "zod";

export const router = Router();

/**
 * @route GET /api/messages
 * @desc Get all messages with filters (admin only)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get query parameters
    const { 
      status, propertyId, userId, page = "1", limit = "10", search 
    } = req.query;
    
    // Build filters object
    const filters: any = { page, limit };
    if (status) filters.status = status;
    if (propertyId) filters.propertyId = Number(propertyId);
    if (userId) filters.userId = Number(userId);
    if (search) filters.search = search;
    
    const result = await storage.getMessages(filters);
    res.json(result);
  } catch (err) {
    console.error("Error getting messages:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route GET /api/messages/:id
 * @desc Get a specific message by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }
    
    const message = await storage.getMessage(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    res.json(message);
  } catch (err) {
    console.error("Error getting message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route POST /api/messages
 * @desc Create a new message
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const messageData = req.body;
    
    // Validate message data
    try {
      const validatedData = insertMessageSchema.parse(messageData);
      
      // Ensure required fields are present
      if (!validatedData.name || !validatedData.email || !validatedData.subject || !validatedData.message) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          errors: ["All required fields must be provided: name, email, subject, message"] 
        });
      }
      
      // Create the message
      const message = await storage.createMessage(validatedData);
      
      // Log for debugging
      console.log("Message created successfully:", message.id);
      
      // Return the created message
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("Validation error:", err.errors);
        return res.status(400).json({ 
          message: "Invalid message data", 
          errors: err.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      throw err; // Re-throw for catch block below to handle
    }
  } catch (err) {
    console.error("Error creating message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route PUT /api/messages/:id
 * @desc Update a message (admin only)
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }
    
    const messageData = req.body;
    const message = await storage.updateMessage(id, messageData);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    res.json(message);
  } catch (err) {
    console.error("Error updating message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route DELETE /api/messages/:id
 * @desc Delete a message (admin only)
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }
    
    const success = await storage.deleteMessage(id);
    if (!success) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route GET /api/messages/user/:userId
 * @desc Get messages for a specific user
 */
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const messages = await storage.getMessagesByUser(userId);
    res.json(messages);
  } catch (err) {
    console.error("Error getting user messages:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route GET /api/messages/property/:propertyId
 * @desc Get messages for a specific property
 */
router.get("/property/:propertyId", async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    if (isNaN(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    
    const messages = await storage.getMessagesByProperty(propertyId);
    res.json(messages);
  } catch (err) {
    console.error("Error getting property messages:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route PUT /api/messages/:id/read
 * @desc Mark a message as read
 */
router.put("/:id/read", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }
    
    const message = await storage.markMessageAsRead(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    res.json(message);
  } catch (err) {
    console.error("Error marking message as read:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route PUT /api/messages/:id/replied
 * @desc Mark a message as replied
 */
router.put("/:id/replied", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }
    
    const message = await storage.markMessageAsReplied(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    res.json(message);
  } catch (err) {
    console.error("Error marking message as replied:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});