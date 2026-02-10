/**
 * ERROR HANDLING GUIDE
 * 
 * This guide shows how to use the custom exception classes
 * to handle errors gracefully in your controllers
 */

// ============================================
// EXAMPLE 1: Validation Error
// ============================================
const { ValidationError } = require('../Utils/AppError');
const { catchAsync } = require('../Middleware/ErrorHandler');

// ✅ GOOD: Throw validation error
exports.registerUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // ... rest of logic
});

// ============================================
// EXAMPLE 2: Authentication Error
// ============================================
const { AuthenticationError } = require('../Utils/AppError');

exports.login = catchAsync(async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // ... rest of logic
});

// ============================================
// EXAMPLE 3: Not Found Error
// ============================================
const { NotFoundError } = require('../Utils/AppError');

exports.getUserById = catchAsync(async (req, res) => {
  const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  
  if (!user) {
    throw new NotFoundError('User');
  }

  res.json(user);
});

// ============================================
// EXAMPLE 4: Database Error
// ============================================
const { DatabaseError } = require('../Utils/AppError');

exports.createUser = catchAsync(async (req, res) => {
  try {
    const result = await db.query(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, password]
    );
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new ValidationError('Email already exists');
    }
    throw new DatabaseError('Failed to create user', err);
  }
});

// ============================================
// EXAMPLE 5: Using catchAsync wrapper
// ============================================
// Without catchAsync - need manual try/catch
exports.oldWay = (req, res, next) => {
  try {
    // logic
  } catch (err) {
    next(err); // Pass to error handler
  }
};

// With catchAsync - cleaner code
exports.newWay = catchAsync(async (req, res) => {
  // Just throw errors, catchAsync handles them
  // throw new ValidationError('...');
  // throw new NotFoundError('...');
});

// ============================================
// EXAMPLE 6: Authorization Error
// ============================================
const { AuthorizationError } = require('../Utils/AppError');

exports.deleteUser = catchAsync(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new AuthorizationError();
  }

  await db.query('DELETE FROM users WHERE id = ?', [id]);
  res.json({ message: 'User deleted' });
});

// ============================================
// EXAMPLE 7: Conflict Error
// ============================================
const { ConflictError } = require('../Utils/AppError');

exports.updateEmail = catchAsync(async (req, res) => {
  try {
    await db.query('UPDATE users SET email = ? WHERE id = ?', [newEmail, id]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new ConflictError('Email is already in use');
    }
    throw err;
  }
});

// ============================================
// EXAMPLE 8: External Service Error
// ============================================
const { ExternalServiceError } = require('../Utils/AppError');

exports.sendEmail = catchAsync(async (req, res) => {
  try {
    await emailService.send();
  } catch (err) {
    throw new ExternalServiceError('Email Service', 'Failed to send email');
  }
});

// ============================================
// IMPLEMENTATION CHECKLIST
// ============================================
/*
✅ Wrap all async route handlers with catchAsync()
✅ Throw custom errors instead of using res.json()
✅ Use appropriate error types for different scenarios
✅ Never expose sensitive data in error messages
✅ Log errors for debugging (handled automatically)
✅ Provide helpful error messages to users

Example of a complete, error-safe controller:

const { ValidationError, NotFoundError, DatabaseError } = require('../Utils/AppError');
const { catchAsync } = require('../Middleware/ErrorHandler');

exports.updateUser = catchAsync(async (req, res) => {
  // Validate input
  if (!req.body.email) {
    throw new ValidationError('Email is required');
  }

  // Check if user exists
  const [user] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) {
    throw new NotFoundError('User');
  }

  // Update user
  try {
    await db.query('UPDATE users SET email = ? WHERE id = ?', [req.body.email, req.params.id]);
  } catch (err) {
    throw new DatabaseError('Failed to update user', err);
  }

  res.json({ message: 'User updated' });
});
*/

module.exports = {};
