import { Router } from 'express';
import { contactSite } from '../controllers/contactController';

const router = Router();

// Public site contact form
router.post('/', contactSite);

export default router;
