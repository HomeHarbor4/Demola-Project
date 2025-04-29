import { Router } from 'express';
import { storage } from '../storage';
import { adminOnly } from './middleware';
import { z } from 'zod';
import { insertPageContentSchema } from '@shared/schema';

const router = Router();

// Get all page contents
router.get('/', async (req, res) => {
  try {
    const pageContents = await storage.getPageContents();
    res.json(pageContents);
  } catch (error) {
    console.error('Error fetching page contents:', error);
    res.status(500).json({ error: 'Failed to fetch page contents' });
  }
});

// Get page contents by page type
router.get('/type/:pageType', async (req, res) => {
  try {
    const { pageType } = req.params;
    const pageContents = await storage.getPageContentsByType(pageType);
    res.json(pageContents);
  } catch (error) {
    console.error(`Error fetching page contents for type ${req.params.pageType}:`, error);
    res.status(500).json({ error: 'Failed to fetch page contents by type' });
  }
});

// Get page contents by page type and section
router.get('/type/:pageType/section/:section', async (req, res) => {
  try {
    const { pageType, section } = req.params;
    const pageContents = await storage.getPageContentsByTypeAndSection(pageType, section);
    res.json(pageContents);
  } catch (error) {
    console.error(`Error fetching page contents for type ${req.params.pageType} and section ${req.params.section}:`, error);
    res.status(500).json({ error: 'Failed to fetch page contents by type and section' });
  }
});

// Get a specific page content by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const pageContent = await storage.getPageContent(id);
    if (!pageContent) {
      return res.status(404).json({ error: 'Page content not found' });
    }
    
    res.json(pageContent);
  } catch (error) {
    console.error(`Error fetching page content with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
});

// Create a new page content (admin only)
router.post('/', adminOnly, async (req, res) => {
  try {
    const validationResult = insertPageContentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid page content data', 
        details: validationResult.error.format() 
      });
    }
    
    const newPageContent = await storage.createPageContent(validationResult.data);
    res.status(201).json(newPageContent);
  } catch (error) {
    console.error('Error creating page content:', error);
    res.status(500).json({ error: 'Failed to create page content' });
  }
});

// Update a page content (admin only)
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Use a partial schema validation for updates
    const updateSchema = insertPageContentSchema.partial();
    const validationResult = updateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid page content data', 
        details: validationResult.error.format() 
      });
    }
    
    const updatedPageContent = await storage.updatePageContent(id, validationResult.data);
    if (!updatedPageContent) {
      return res.status(404).json({ error: 'Page content not found' });
    }
    
    res.json(updatedPageContent);
  } catch (error) {
    console.error(`Error updating page content with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update page content' });
  }
});

// Delete a page content (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const success = await storage.deletePageContent(id);
    if (!success) {
      return res.status(404).json({ error: 'Page content not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Error deleting page content with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete page content' });
  }
});

// Reorder a page content (admin only)
router.put('/:id/reorder', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const { position } = req.body;
    if (typeof position !== 'number' || position < 0) {
      return res.status(400).json({ error: 'Invalid position value' });
    }
    
    const success = await storage.reorderPageContent(id, position);
    if (!success) {
      return res.status(404).json({ error: 'Page content not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Error reordering page content with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to reorder page content' });
  }
});

export default router;