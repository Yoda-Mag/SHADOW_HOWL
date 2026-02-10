/**
 * Custom AppError Class for consistent error handling
 * Prevents server crashes and provides structured error responses
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || `ERR_${statusCode}`;
    this.timestamp = new Date().toISOString();
    this.isOperational = true; // Flag to distinguish operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.errorCode,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
      }
    };
  }
}

/**
 * Predefined error types for common scenarios
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }

  toJSON() {
    const json = super.toJSON();
    if (this.details) {
      json.error.details = this.details;
    }
    return json;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to access this resource') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }

  toJSON() {
    const json = super.toJSON();
    // Log the original error for debugging but don't expose it to client
    if (this.originalError && process.env.NODE_ENV === 'development') {
      json.error.originalError = this.originalError.message;
    }
    return json;
  }
}

class ExternalServiceError extends AppError {
  constructor(service = 'External Service', message = null) {
    super(
      message || `${service} is temporarily unavailable. Please try again later.`,
      503,
      'SERVICE_UNAVAILABLE'
    );
    this.service = service;
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Too many requests. Please try again later.', 429, 'RATE_LIMITED');
    this.retryAfter = retryAfter;
  }

  toJSON() {
    const json = super.toJSON();
    json.error.retryAfter = this.retryAfter;
    return json;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError
};
