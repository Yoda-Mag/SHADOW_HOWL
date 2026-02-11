const db = require('../Config/Database'); //Go up one level,then COnfig
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodeMailer = require('nodemailer');
require('dotenv').config();
const { sendOTP, verifyOTP, clearOTP } = require('../Utils/OTP');

// Create transporter for email
const transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
    
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        
        if (username.includes(' ')) {
            return res.status(400).json({ message: "Username cannot contain spaces" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

     if (!specialCharRegex.test(password)) {
        return res.status(400).json({message: "Password must contain at least one special character"});
        }

        // Check if email/username already exists
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: "Username or email already exists" });
        }

        // Send OTP to email for verification
        try {
            await sendOTP(email, transporter);
        } catch (otpErr) {
            console.error('OTP sending failed:', otpErr);
            return res.status(500).json({ 
                error: 'Failed to send OTP. Please try again.',
                details: otpErr.message
            });
        }

        // Return success and prompt frontend to show OTP verification
        res.status(200).json({ 
            message: "Registration initiated. Please verify your email with the OTP sent to your inbox.",
            requiresOTPVerification: true,
            email: email,
            username: username,
            password: password // Store temporarily (frontend will use this after OTP verification)
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Username or email already exists" });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const [users] = await db.query('SELECT id, username, email, password_hash, role FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // Get subscription status
        const [subscriptions] = await db.query('SELECT status FROM subscriptions WHERE user_id = ?', [user.id]);
        const subscriptionStatus = subscriptions.length > 0 ? subscriptions[0].status : 'expired';

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                subscription_status: subscriptionStatus
            } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Verify OTP and complete registration
 */
exports.verifyOTP = async (req, res) => {
    const { email, otp, username, password } = req.body;

    try {
        if (!email || !otp || !username || !password) {
            return res.status(400).json({ message: "Email, OTP, username, and password are required" });
        }

        // Verify OTP
        const otpResult = verifyOTP(email, otp);
        if (!otpResult.success) {
            return res.status(400).json({ message: otpResult.message });
        }

        // Hash password and insert user
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        // Initialize subscription record
        await db.query('INSERT INTO subscriptions (user_id, status) VALUES (?, "expired")', [result.insertId]);

        // Clear OTP from store
        clearOTP(email);

        res.status(201).json({ 
            message: "Email verified and user registered successfully",
            success: true 
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Username or email already exists" });
        }
        res.status(500).json({ error: err.message });
    }
};

/**
 * Resend OTP (if user didn't receive it)
 */
exports.resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Send new OTP
        const result = await sendOTP(email, transporter);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};