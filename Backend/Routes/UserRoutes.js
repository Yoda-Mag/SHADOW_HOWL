const express = require('express');
const router = express.Router();
const userController = require('../Controllers/User'); 
const authMiddleware = require('../Middleware/Authmiddleware');
const roleMiddleware = require('../Middleware/Rolemiddleware');

// Corrected Paths:
// This becomes: GET http://localhost:5000/api/users/
router.get('/', authMiddleware, roleMiddleware('admin'), userController.getAllUsers);

// This becomes: PUT http://localhost:5000/api/users/subscription
router.put('/subscription', authMiddleware, roleMiddleware('admin'), userController.updateSubscription);

module.exports = router;