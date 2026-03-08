const express = require('express');
const cors = require('cors');
require('dotenv').config();

// PATHS: Note the ./ and the Capital letters
const authRoutes = require('./Routes/AuthRoutes');
const authMiddleware = require('./Middleware/Authmiddleware'); 
const signalRoutes = require('./Routes/SignalRoutes');
const userRoutes = require('./Routes/UserRoutes');
const chatRoutes = require('./Routes/ChatRoutes');
const adminRoutes = require('./Routes/adminRoutes');

// Error handling middleware
const { 
  errorHandler, 
  handleUnhandledRejection, 
  handleUncaughtException 
} = require('./Middleware/ErrorHandler');

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests from same origin (Nginx setup)
    // Allow localhost for development
    // Allow from environment variable for flexibility
    const allowedOrigins = [
      'http://localhost',
      'http://localhost:80',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1',
      'http://127.0.0.1:80',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://18.134.190.37',      // Lightsail production server
      'http://18.134.190.37:80',
      process.env.ALLOWED_ORIGIN, // Set in .env if needed
    ].filter(Boolean); // Remove undefined values

    // In production with Nginx, frontend and backend share same origin
    // So we can be more permissive if needed
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes); 
app.use('/api/admin', adminRoutes);

// Health check endpoint - for monitoring and load balancers
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test Route
app.get('/api/auth/verify-me', authMiddleware, (req, res) => {
    res.json({ message: "Success! You are authenticated", user: req.user });
});

// 404 handler (no path so it won't be compiled by path-to-regexp)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      statusCode: 404
    }
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', handleUnhandledRejection);

// Handle uncaught exceptions
process.on('uncaughtException', handleUncaughtException);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║        Shadow Howl API Server Started      ║
╠════════════════════════════════════════════╣
║  Status: ✓ Running                         ║
║  Port: ${PORT}                              ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(22)} ║
║  Time: ${new Date().toLocaleString().padEnd(24)} ║
╚════════════════════════════════════════════╝
  `);
  
  // Startup checks
  console.log('📋 Startup Checks:');
  console.log(`  ✓ Express server initialized`);
  console.log(`  ✓ CORS configured for production`);
  console.log(`  ✓ Routes loaded`);
  console.log(`  ℹ Database initialization check in progress...`);
  console.log(`  ℹ Access API at http://localhost:${PORT}/api`);
  console.log(`  ℹ Health check: http://localhost:${PORT}/api/health`);
});