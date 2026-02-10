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
app.use(cors());
app.use(express.json());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes); 
app.use('/api/admin', adminRoutes);

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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));