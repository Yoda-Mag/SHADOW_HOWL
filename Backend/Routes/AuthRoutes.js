const express = require('express');
const router = express.Router();

// Go UP one level, then into Controllers
const authController = require('../Controllers/Auth'); 

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;