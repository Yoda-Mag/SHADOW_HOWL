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
const verifyOTP = (email, otp) => {
  const stored = otpStore.get(email);

  if (!stored) {
    return { success: false, message: 'No OTP found for this email' };
  }

  // Check if OTP has expired
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return { success: false, message: 'OTP has expired. Request a new one.' };
  }

  // Check max attempts (3 attempts)
  if (stored.attempts >= 3) {
    otpStore.delete(email);
    return { success: false, message: 'Maximum OTP attempts exceeded. Request a new one.' };
  }

  // Check if OTP matches
  if (stored.otp !== otp.toString()) {
    stored.attempts += 1;
    return { success: false, message: `Invalid OTP. ${3 - stored.attempts} attempts remaining.` };
  }

  // OTP verified successfully
  otpStore.delete(email);
  return { success: true, message: 'Email verified successfully' };
};

/**
 * Clear OTP for email (useful after successful registration)
 */
const clearOTP = (email) => {
  otpStore.delete(email);
};

module.exports = {
  generateOTP,
  sendOTP,
  verifyOTP,
  clearOTP
};
