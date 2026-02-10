/**
 * Global Error Handling Middleware
 * Catches all errors and prevents server crashes
 */

const {
  AppError,
  ValidationError,
  DatabaseError,
  ExternalServiceError,
  ConflictError
} = require('../Utils/AppError');

/**
 * Development error logger
 */
const logError = (err) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    name: err.name,
    code: err.code || 'UNKNOWN',
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
    ...(err.sql && { sql: err.sql })
  };

  console.error('❌ ERROR LOGGED:', JSON.stringify(errorLog, null, 2));
  
  // Optional: Send to error tracking service (Sentry, etc.)
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(err);
  // }
};

/**
 * Handle database errors
 */
const handleDatabaseError = (err) => {
  console.error('Database Error:', err.code, err.message);

  switch (err.code) {
    case 'ER_DUP_ENTRY':
      return new ConflictError('Username or email already exists');
    
    case 'ER_NO_REFERENCED_ROW_2':
      return new ValidationError('Invalid reference: Resource does not exist');
    
    case 'ER_BAD_FIELD_ERROR':
      return new DatabaseError('Invalid column name');
    
    case 'ER_PARSE_ERROR':
      return new DatabaseError('SQL syntax error');
    
    case 'PROTOCOL_CONNECTION_LOST':
      return new ExternalServiceError('Database', 'Database connection lost');
    
    case 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR':
      return new ExternalServiceError('Database', 'Database connection is dead');
    
    case 'PROTOCOL_ENQUEUE_AFTER_DESTROY':
      return new ExternalServiceError('Database', 'Database connection destroyed');
    
    default:
      return new DatabaseError('An unexpected database error occurred', err);
  }
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
};

const handleJWTExpiredError = () => {
  return new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;

  // Reference _next so linters don't flag it as unused; do NOT call it.
  void _next;

  // Log the error
  logError(err);

  // Handle specific error types
  let error = err;

  // Database errors
  if (err.code && err.code.startsWith('ER_')) {
    error = handleDatabaseError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Mongoose validation errors (if using MongoDB)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(e => e.message)
      .join(', ');
    error = new ValidationError(message);
  }

  // Unknown Error - don't expose details in production
  if (!error.isOperational) {
    error = new AppError(
      process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred. Please try again later.'
        : err.message,
      err.statusCode || 500,
      'INTERNAL_SERVER_ERROR'
    );
  }

  // Send error response
  res.status(error.statusCode).json(error.toJSON());
};

/**
 * Async handler wrapper to catch promise rejections
 * Use this to wrap async route handlers
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Global unhandled rejection handler
 */
const handleUnhandledRejection = (reason, promise) => {
  console.error('⚠️  UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  
  // In production, you might want to restart the server or send alerts
  if (process.env.NODE_ENV === 'production') {
    // Send alert to monitoring service
    console.error('🚨 Critical: Unhandled rejection in production!');
  }
};

/**
 * Global uncaught exception handler
 */
const handleUncaughtException = (err) => {
  console.error('⚠️  UNCAUGHT EXCEPTION! 💥');
  console.error('Error:', err);
  
  // Log it
  logError(err);
  
  // In production, gracefully restart
  if (process.env.NODE_ENV === 'production') {
    console.error('Server will restart in 5 seconds...');
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }
};

module.exports = {
  errorHandler,
  catchAsync,
  handleUnhandledRejection,
  handleUncaughtException,
  logError
};
