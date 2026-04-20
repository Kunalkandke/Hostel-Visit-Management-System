require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/helpers');

const app = express();

app.use(helmet());
const normalizeOrigin = (value) => (value || '').trim().replace(/\/+$/, '');
const defaultAllowedOrigins = ['https://hvms-system.vercel.app', 'http://localhost:3000'];
const envAllowedOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map(normalizeOrigin)
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins].map(normalizeOrigin)));

// Log allowed origins for debugging
console.log('🔐 Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    const normalizedOrigin = normalizeOrigin(origin);
    
    // Allow all vercel.app domains in production
    if (normalizedOrigin.endsWith('.vercel.app') || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    
    console.error(`❌ CORS blocked for origin: ${origin}`);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

const authLimiter = rateLimit({ windowMs: 60000, max: 20, message: { success: false, message: 'Too many requests' } });

app.use('/api/v1/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/v1/visits', require('./routes/visitRoutes'));
app.use('/api/v1/hostels', require('./routes/hostelRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/reports', require('./routes/reportRoutes'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'HVMS API running', time: new Date() }));
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

module.exports = app;
