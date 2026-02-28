const db = require('../Config/Database'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendOTP, verifyOTPLogic, clearOTP } = require('../Utils/OTP');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) return res.status(400).json({ message: "All fields are required" });
        if (username.includes(' ')) return res.status(400).json({ message: "Username cannot contain spaces" });
        
        const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUsers.length > 0) return res.status(409).json({ message: "Username or email already exists" });

        await sendOTP(email);
        res.status(200).json({ message: "OTP sent", requiresOTPVerification: true, email, username, password });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT id, username, email, password, role FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });

        const user = users[0];
        let isMatch = (password === user.password);
        if (!isMatch) {
            try {
                isMatch = await bcrypt.compare(password, user.password);
            } catch (err) {
                console.error("Bcrypt error:", err); // Fixes 'err' defined but never used
                isMatch = false;
            }
        }
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const [subscriptions] = await db.query('SELECT status FROM subscriptions WHERE user_id = ?', [user.id]);
        const subscriptionStatus = subscriptions.length > 0 ? subscriptions[0].status : 'expired';

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, subscription_status: subscriptionStatus } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp, username, password } = req.body;
    try {
        const otpResult = verifyOTPLogic(email, otp);
        if (!otpResult.success) return res.status(400).json({ message: otpResult.message });

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
        await db.query('INSERT INTO subscriptions (user_id, status) VALUES (?, "expired")', [result.insertId]);
        clearOTP(email);
        res.status(201).json({ success: true, message: "Registered!" });
    } catch (err) {
        console.error("Verification error:", err); // Fixes 'err' defined but never used
        res.status(500).json({ error: "Database error during registration" });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const otpResult = verifyOTPLogic(email, otp);
        if (!otpResult.success) return res.status(400).json({ message: otpResult.message });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
        clearOTP(email);
        res.json({ message: "Password reset successful", success: true });
    } catch (err) {
        console.error("Reset password error:", err); // Fixes 'err' defined but never used
        res.status(500).json({ error: "Failed to reset password" });
    }
};

exports.resendOTP = async (req, res) => {
    const { email } = req.body;
    try {
        await sendOTP(email);
        res.json({ message: "OTP resent successfully" });
    } catch (err) {
        console.error("Resend error:", err); 
        res.status(500).json({ message: "Failed to resend OTP" });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });
        await sendOTP(email);
        res.json({ message: "OTP sent" });
    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ message: "Failed to send OTP" });
    }
};

module.exports = { register: exports.register, login: exports.login, verifyOTP: exports.verifyOTP, resendOTP: exports.resendOTP, forgotPassword: exports.forgotPassword, resetPassword: exports.resetPassword };