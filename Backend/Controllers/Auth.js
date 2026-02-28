const db = require('../Config/Database'); //Go up one level,then COnfig
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendOTP, verifyOTPLogic, clearOTP } = require('../Utils/OTP');

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
            await sendOTP(email);
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
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // 1. Get the user - Using 'password' as the column name based on your DB check
        const [users] = await db.query('SELECT id, username, email, password, role FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) return res.status(404).json({ message: "User not found" });

        const user = users[0];

        // 2. Hybrid Password Check (Plain text OR Hashed)
        // We use user.password because that's what's in your DB
        let isMatch = (password === user.password); 
        
        if (!isMatch) {
            try {
                // If plain text fails, try bcrypt as a backup
                isMatch = await bcrypt.compare(password, user.password);
            } catch (err) {
                console.error("Login error:", err);
                isMatch = false;
            }
        }

        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // 3. Subscription Check
        const [subscriptions] = await db.query('SELECT status FROM subscriptions WHERE user_id = ?', [user.id]);
        const subscriptionStatus = subscriptions.length > 0 ? subscriptions[0].status : 'expired';

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ 
            token, 
            role: user.role, // Sending role directly for easier frontend access
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                subscription_status: subscriptionStatus
            } 
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Verify OTP and complete registration
 */
exports.verifyOTP = async (req, res) => {
    const { email, otp, username, password } = req.body;

    try {
        // 1. Basic validation
        if (!email || !otp || !username || !password) {
            return res.status(400).json({ message: "Registration data missing. Try again." });
        }

        // 2. Use Utility to check the code
        const otpResult = verifyOTPLogic(email, otp);
        if (!otpResult.success) {
            return res.status(400).json({ message: otpResult.message });
        }

        // 3. OTP is valid - Now Save to Database
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Use the column 'password' or 'password_hash' based on your DB check
        const [result] = await db.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        // Initialize subscription
        await db.query('INSERT INTO subscriptions (user_id, status) VALUES (?, "expired")', [result.insertId]);

        res.status(201).json({ success: true, message: "Registered! Please login." });
    } catch (err) {
        console.error("Verify Error:", err);
        res.status(500).json({ error: "Database error during registration" });
    }
};

/**
 * Reset Password - Verify OTP and update password
 */
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
        if (!specialCharRegex.test(newPassword)) {
            return res.status(400).json({ message: "Password must contain at least one special character" });
        }

        // Verify OTP
        const otpResult = verifyOTPLogic(email, otp);
        if (!otpResult.success) {
            return res.status(400).json({ message: otpResult.message });
        }

        // Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE email = ?', [hashedPassword, email]);

        // Clear OTP from store
        clearOTP(email);

        res.json({ 
            message: "Password reset successfully. Please login with your new password.",
            success: true
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};