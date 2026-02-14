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
import contactRoutes from './routes/contactRoutes';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './utils/errors';

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/support-groups', supportGroupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);

// Global error handler (must be after all routes)
app.use(errorHandler);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
