require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/helpers');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
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
