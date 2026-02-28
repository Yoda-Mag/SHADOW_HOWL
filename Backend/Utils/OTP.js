const axios = require('axios');

const otpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (email) => {
    try {
        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        otpStore.set(email, { otp, expiresAt });

        await axios.post('https://api.resend.com/emails', {
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: 'Shadow Howl - Verification',
            html: `<h1>Your Verification Code: ${otp}</h1>`
        }, {
            headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` }
        });
        return { success: true };
    } catch (err) {
        console.error('OTP Send Error:', err.message);
        throw err;
    }
};

const verifyOTPLogic = (email, otp) => {
    const stored = otpStore.get(email);
    if (!stored) return { success: false, message: 'No OTP found for this email' };
    if (Date.now() > stored.expiresAt) {
        otpStore.delete(email);
        return { success: false, message: 'OTP expired' };
    }
    if (stored.otp !== otp.toString()) return { success: false, message: 'Invalid OTP' };
    
    otpStore.delete(email);
    return { success: true };
};

module.exports = { sendOTP, verifyOTPLogic };