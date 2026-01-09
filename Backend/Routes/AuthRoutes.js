const express = require('express');
const router = express.Router();

// Go UP one level, then into Controllers
const authController = require('../Controllers/Auth'); 

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;