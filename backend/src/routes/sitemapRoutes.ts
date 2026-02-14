import { Router } from 'express';
import { getSitemap } from '../controllers/sitemapController';

const router = Router();

// Public sitemap endpoint
router.get('/', getSitemap);

export default router;
