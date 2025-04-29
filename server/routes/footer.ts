import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertFooterContentSchema } from "@shared/schema";
import { adminOnly } from "./middleware";

const router = Router();

// Get all footer contents
router.get("/", async (req, res) => {
  try {
    const contents = await storage.getFooterContents();
    res.json(contents);
  } catch (error) {
    console.error("Error fetching footer contents:", error);
    res.status(500).json({ error: "Failed to fetch footer contents" });
  }
});

// Get footer contents by section
router.get("/section/:section", async (req, res) => {
  try {
    const { section } = req.params;
    const contents = await storage.getFooterContentsBySection(section);
    res.json(contents);
  } catch (error) {
    console.error("Error fetching footer contents by section:", error);
    res.status(500).json({ error: "Failed to fetch footer contents by section" });
  }
});

// Get single footer content
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const content = await storage.getFooterContent(id);
    
    if (!content) {
      return res.status(404).json({ error: "Footer content not found" });
    }
    
    res.json(content);
  } catch (error) {
    console.error("Error fetching footer content:", error);
    res.status(500).json({ error: "Failed to fetch footer content" });
  }
});

// Create new footer content (admin only)
router.post("/", adminOnly, async (req, res) => {
  try {
    // Validate request body
    const validationResult = insertFooterContentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid data",
        details: validationResult.error.format()
      });
    }
    
    const newContent = await storage.createFooterContent(validationResult.data);
    res.status(201).json(newContent);
  } catch (error) {
    console.error("Error creating footer content:", error);
    res.status(500).json({ error: "Failed to create footer content" });
  }
});

// Update footer content (admin only)
router.patch("/:id", adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // Validate request body
    const validationResult = insertFooterContentSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid data",
        details: validationResult.error.format()
      });
    }
    
    const updatedContent = await storage.updateFooterContent(id, validationResult.data);
    
    if (!updatedContent) {
      return res.status(404).json({ error: "Footer content not found" });
    }
    
    res.json(updatedContent);
  } catch (error) {
    console.error("Error updating footer content:", error);
    res.status(500).json({ error: "Failed to update footer content" });
  }
});

// Delete footer content (admin only)
router.delete("/:id", adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const success = await storage.deleteFooterContent(id);
    
    if (!success) {
      return res.status(404).json({ error: "Footer content not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting footer content:", error);
    res.status(500).json({ error: "Failed to delete footer content" });
  }
});

// Reorder footer content (admin only)
router.post("/:id/reorder", adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // Validate request body
    const schema = z.object({
      newPosition: z.number().int().nonnegative()
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid data",
        details: validationResult.error.format()
      });
    }
    
    const { newPosition } = validationResult.data;
    const success = await storage.reorderFooterContent(id, newPosition);
    
    if (!success) {
      return res.status(404).json({ error: "Footer content not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error reordering footer content:", error);
    res.status(500).json({ error: "Failed to reorder footer content" });
  }
});

export default router;