const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/Admin');
const authenticateToken = require('../Middleware/Authmiddleware');
const checkRole = require('../Middleware/Rolemiddleware');

// 🛡️ LOCK EVERYTHING: Token must be valid AND user must be an admin
router.use(authenticateToken); 
router.use(checkRole('admin')); 

// Map routes to the controller functions
router.get('/users', adminController.getAllUsers);
router.put('/users/status', adminController.updateSubscription);
router.put('/users/role', adminController.updateUserRole);
router.post('/broadcast', adminController.createSignal);

module.exports = router;