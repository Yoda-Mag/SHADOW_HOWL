const db = require('../Config/Database'); //Go up one level,then COnfig
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert user and create a placeholder subscription
        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        
        // Initialize an empty/expired subscription record for the user
        await db.query('INSERT INTO subscriptions (user_id, status) VALUES (?, "expired")', [result.insertId]);

        res.status(201).json({ message: "User registered successfully" });
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