/**
 * OTP Utility - Generate, store, and verify one-time passwords
 * Used for email verification during registration
 */

const axios = require('axios');

// In-memory storage for OTPs (use Redis in production)
const otpStore = new Map();

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to user email and store it
 * @param {string} email - User's email address
 * @returns {object} - { success, expiresIn, message }
 */
const sendOTP = async (email) => {
  try {
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Store OTP with email and expiry
    otpStore.set(email, {
      otp,
      expiresAt,
      attempts: 0
    });

    // Send OTP via Resend HTTP API
    await axios.post('https://api.resend.com/emails', {
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: 'Shadow Howl - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066ff;">Shadow Howl - Email Verification</h2>
          <p>Your one-time password (OTP) to verify your email is:</p>
          <h1 style="color: #0066ff; letter-spacing: 5px; font-size: 36px;">${otp}</h1>
          <p style="color: #666;">This OTP will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          <p style="color: #999; font-size: 12px;">Never share your OTP with anyone.</p>
        </div>
      `
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      message: 'OTP sent to your email',
      expiresIn: 600 // 10 minutes in seconds
    };
  } catch (err) {
    console.error('Error sending OTP:', err.response?.data || err.message);
    throw err;
  }
};

/**
 * Verify OTP for a given email
 * @param {string} email - User's email address
 * @param {string} otp - OTP entered by user
 * @returns {object} - { success, message }
 */
exports.verifyOTP = async (req, res) => {
    const { email, otp, username, password } = req.body;

    // 1. Check if the frontend actually sent the required data
    if (!username || !password) {
        return res.status(400).json({ 
            message: "Registration session lost. Please go back and register again." 
        });
    }

    try {
        const otpResult = verifyOTP(email, otp); // Calls your Utility function
        if (!otpResult.success) {
            return res.status(400).json({ message: otpResult.message });
        }

        // 2. The database insert usually fails here if fields are missing
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ success: true, message: "User registered!" });
    } catch (err) {
        console.error("Verify Error:", err);
        res.status(500).json({ error: "Database error during registration" });
    }

};

module.exports = {
  generateOTP,
  sendOTP,
  verifyOTP,
  clearOTP
};
