import express from 'express';
import multer from 'multer';
import {
  getBlogPosts,
  getBlogPostBySlug,
  getAdminBlogPosts,
  getAdminBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadFeaturedImage,
  getBlogMetrics,
  getBlogFilters
} from '../controllers/blogController';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Public routes
router.get('/', getBlogPosts);
router.get('/filters', getBlogFilters);
router.get('/:slug', getBlogPostBySlug);

// Admin routes - require authentication and admin privileges
router.get('/admin/posts', authMiddleware, adminMiddleware, getAdminBlogPosts);
router.get('/admin/posts/:id', authMiddleware, adminMiddleware, getAdminBlogPostById);
router.get('/admin/metrics', authMiddleware, adminMiddleware, getBlogMetrics);
router.post('/admin/posts', authMiddleware, adminMiddleware, createBlogPost);
router.put('/admin/posts/:id', authMiddleware, adminMiddleware, updateBlogPost);
router.delete('/admin/posts/:id', authMiddleware, adminMiddleware, deleteBlogPost);
router.post('/admin/upload-image', authMiddleware, adminMiddleware, upload.single('image'), uploadFeaturedImage);

export default router;