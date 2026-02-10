// Controller reserved for user-facing actions. Administrative user-list and
// subscription management moved to `Controllers/Admin.js` to avoid duplication.
// Keep this file minimal and focused on user-specific endpoints.

const db = require('../Config/Database');

// Example: get current user's profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const query = `SELECT id, username, email, role, subscription_status, subscription_expiry FROM users WHERE id = ?`;
        const [rows] = await db.query(query, [userId]);
        const user = rows[0] || null;
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('getProfile error:', err);
        res.status(500).json({ message: 'Failed to load profile' });
    }
};