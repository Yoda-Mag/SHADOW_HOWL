const express = require('express');
const router = express.Router();
const chatController = require('../Controllers/Chat');
const authMiddleware = require('../Middleware/Authmiddleware');

// Only authorized users can ask the AI Coach questions
router.post('/ask', authMiddleware, chatController.askAssistant);

module.exports = router;