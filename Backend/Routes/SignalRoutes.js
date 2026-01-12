// Routes/SignalRoutes.js
const express = require('express');
const router = express.Router();

const signalController = require('../Controllers/Signal');
const authMiddleware = require('../Middleware/Authmiddleware');
const roleMiddleware = require('../Middleware/Rolemiddleware'); // Import new middleware

// Users can view approved signals
router.get('/', authMiddleware, signalController.getAllSignals);

// ONLY Admins can create signals
router.post('/create', authMiddleware, roleMiddleware('admin'), signalController.createSignal);

// ONLY Admins can approve signals
router.put('/approve/:id', authMiddleware, roleMiddleware('admin'), signalController.approveSignal);

// ONLY Admins can edit signals
router.put('/update/:id', authMiddleware, roleMiddleware('admin'), signalController.updateSignal);

// ONLY Admins can delete signals
router.delete('/delete/:id', authMiddleware, roleMiddleware('admin'), signalController.deleteSignal);
module.exports = router;