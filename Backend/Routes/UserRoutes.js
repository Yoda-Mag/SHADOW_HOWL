const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/Admin'); 
const userController = require('../Controllers/User'); 
const authMiddleware = require('../Middleware/Authmiddleware');
const roleMiddleware = require('../Middleware/Rolemiddleware');

// Reuse admin controllers for admin-only user management endpoints
router.get('/', authMiddleware, roleMiddleware('admin'), adminController.getAllUsers);

// User self endpoints
router.get('/me', authMiddleware, userController.getProfile);

// Accepts body { userId, status, expiryDays } and delegates to Admin.updateSubscription
router.put('/subscription', authMiddleware, roleMiddleware('admin'), adminController.updateSubscription);

module.exports = router;