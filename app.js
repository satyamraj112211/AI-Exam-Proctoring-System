const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { errorHandler } = require('./src/middleware/error.js');
const metricsMiddleware = require('./src/middleware/metricsMiddleware');
const { register: metricsRegister } = require('./src/metrics/metrics');
require('dotenv').config();

//second commit in feature
// again shit

// just a random line for devops project later be removed 
//ok
// Import routes
const authRoutes = require('./src/routes/api/v1/auth/authRoutes.js');
const teacherAuthRoutes = require('./src/routes/api/v1/auth/teacherAuthRoutes.js');
const studentRoutes = require('./src/routes/api/v1/users/studentRoutes.js');
const apiRoutes = require('./src/routes/api');

const app = express();

// Parse allowed origins from environment or use defaults
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'https://virtualxam-fp5e.onrender.com'];

// CORS MUST be before Helmet to work properly
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security middleware - AFTER CORS to not interfere with CORS headers
app.use(helmet({
  // Configure Helmet to not interfere with CORS
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - increased limits for dashboard endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per 15 minutes
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after a few minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/metrics';
  }
});

// More lenient rate limiter for dashboard endpoints
const dashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Higher limit for dashboard endpoints
  message: {
    status: 'error',
    message: 'Too many requests, please wait a moment'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply more lenient limiter to dashboard routes FIRST (order matters)
app.use('/api/v1/student/dashboard', dashboardLimiter);
app.use('/api/v1/teacher', dashboardLimiter);

// Apply general limiter to all other API routes
app.use('/api/', generalLimiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global HTTP metrics for all subsequent routes
app.use(metricsMiddleware);

// Session management for OTP verification flows
app.set('trust proxy', 1);
app.use(
  session({
    name: 'eps.sid',
    secret: process.env.SESSION_SECRET || 'exam-proctoring-session-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 30 * 60, // 30 minutes (in seconds)
      autoRemove: 'native',
      touchAfter: 24 * 3600 // lazy session update (24 hours)
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 60 * 1000 // 30 minutes
    }
  })
);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files for uploaded content (e.g., profile images)
app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res, next) => {
  try {
    res.set('Content-Type', metricsRegister.contentType);
    const metrics = await metricsRegister.metrics();
    res.send(metrics);
  } catch (err) {
    next(err);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes); // versioned alias for students
app.use('/api/v1/auth/teacher', teacherAuthRoutes);
app.use('/api/students', studentRoutes);
app.use('/api', apiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
