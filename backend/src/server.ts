import './instrument'; // Must be first — initialises Sentry before anything else
import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
import providerRoutes from './routes/providerRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import supportGroupRoutes from './routes/supportGroupRoutes';
import adminRoutes from './routes/adminRoutes';
import blogRoutes from './routes/blogRoutes';
import sitemapRoutes from './routes/sitemapRoutes';
import promoRoutes from './routes/promoRoutes';
import citiesRoutes from './routes/citiesRoutes';
import providerBlogRoutes from './routes/providerBlogRoutes';
import featureFlagsRoutes from './routes/featureFlagsRoutes';
import { seedFeatureFlags } from './scripts/seed-feature-flags';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './utils/errors';
import { initializeScheduledJobs } from './services/scheduledJobs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required for Railway, Heroku, etc.)
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:4200'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Stripe webhook needs raw body (must be before express.json())
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

// PayFast ITN sends form-urlencoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Global API rate limiter
app.use('/api', apiRateLimiter);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'findtherapy.care API is running' });
});

// Sitemap (no /api prefix for SEO)
app.use('/sitemap.xml', sitemapRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/support-groups', supportGroupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/provider/blog', providerBlogRoutes);
app.use('/api/feature-flags', featureFlagsRoutes);

// Sentry error handler must be before the custom error handler
Sentry.setupExpressErrorHandler(app);

// Global error handler (must be after all routes)
app.use(errorHandler);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Seed feature flags (idempotent upsert — safe on every boot)
    seedFeatureFlags().catch(err => console.error('Feature flag seed error:', err));

    // Initialize scheduled jobs (cron tasks)
    initializeScheduledJobs();
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
