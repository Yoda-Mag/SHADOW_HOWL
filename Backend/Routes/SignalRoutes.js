// Routes/SignalRoutes.js
const express = require('express');
const router = express.Router();
const signalController = require('../Controllers/SignalController');
const authMiddleware = require('../Middleware/Authmiddleware');
const roleMiddleware = require('./Middleware/Rolemiddleware'); // Import new middleware

// Users can view approved signals
router.get('/', authMiddleware, signalController.getAllSignals);

// ONLY Admins can create signals
router.post('/create', authMiddleware, roleMiddleware('admin'), signalController.createSignal);

module.exports = router;