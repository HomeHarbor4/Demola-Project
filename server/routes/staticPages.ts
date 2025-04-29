import { Router } from 'express';
import { db } from '../db';
import { staticPages } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { adminOnly } from './middleware';

const router = Router();

// GET /admin/page-content/:slug - fetch static page content
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const [page] = await db.select().from(staticPages).where(eq(staticPages.slug, slug));
  res.json({ content: page?.content || '' });
});

// POST /admin/page-content/:slug - upsert static page content (admin only)
router.post('/:slug', adminOnly, async (req, res) => {
  const { slug } = req.params;
  const { content } = req.body;
  const [existing] = await db.select().from(staticPages).where(eq(staticPages.slug, slug));
  if (existing) {
    await db.update(staticPages).set({ content }).where(eq(staticPages.slug, slug));
  } else {
    await db.insert(staticPages).values({ slug, content });
  }
  res.json({ success: true });
});

export default router; 