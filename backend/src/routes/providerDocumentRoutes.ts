import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { providerGuard } from '../middleware/providerGuard';
import {
  uploadDocument,
  getDocument,
  getVerificationStatus,
} from '../controllers/providerDocumentController';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware, providerGuard);

router.get('/verification-status', getVerificationStatus);
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/:id', getDocument);

export default router;
