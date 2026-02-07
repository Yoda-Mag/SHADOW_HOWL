const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/Admin');
const authenticateToken = require('../Middleware/Authmiddleware');
const checkRole = require('../Middleware/Rolemiddleware');

//LOCK EVERYTHING
router.use(authenticateToken); 
router.use(checkRole('admin')); 

// --- User Management ---
router.get('/users', adminController.getAllUsers);
router.get('/users/search/:query', adminController.searchUsers);

// frontend calls: /api/admin/users/:id/status (matches Admin.jsx handleUserToggle)
router.patch('/users/:id/status', adminController.updateSubscription); 

// --- Signal Management ---
// Matches Admin.jsx fetchData
router.get('/signals', adminController.getAllSignals); 

// Matches Admin.jsx Modal (POST)
router.post('/signals', adminController.createSignal); 

// Matches Admin.jsx Modal (PUT - update)
router.put('/signals/:id', adminController.updateSignal); 

// Matches Admin.jsx deleteSignal (DELETE /api/admin/signals/5)
router.delete('/signals/:id', adminController.deleteSignal); 

router.patch('/signals/:id/approve', adminController.toggleApproval);

module.exports = router;