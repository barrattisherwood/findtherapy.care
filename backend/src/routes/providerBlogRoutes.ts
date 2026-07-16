import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { providerGuard } from '../middleware/providerGuard';
import { requireFeatureFlag } from '../middleware/requireFeatureFlag';
import {
  getMyPosts,
  createDraft,
  getPost,
  updatePost,
  deletePost,
  generateContent,
  approvePost,
  publishPost,
  addToSocialQueue,
  removeFromSocialQueue,
  uploadFeaturedImage,
  uploadFeaturedImageMiddleware,
  removeFeaturedImage,
} from '../controllers/providerBlogController';

const router = express.Router();

router.use(authMiddleware, providerGuard, requireFeatureFlag('provider_blog'));

router.get('/', getMyPosts);
router.post('/', createDraft);
router.get('/:id', getPost);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/generate', generateContent);
router.patch('/:id/approve', approvePost);
router.patch('/:id/publish', publishPost);
router.post('/:id/image', uploadFeaturedImageMiddleware, uploadFeaturedImage);
router.delete('/:id/image', removeFeaturedImage);
router.post('/:id/social-queue', addToSocialQueue);
router.delete('/:id/social-queue/:platform', removeFromSocialQueue);

export default router;
