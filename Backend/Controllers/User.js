const db = require('../Config/Database');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const query = `
            SELECT u.id, u.username, u.email, u.role,
                   s.status AS subscription_status,
                   s.end_date AS subscription_expiry
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id
            WHERE u.id = ?
        `;
        const [rows] = await db.query(query, [userId]);
        if (!rows.length) return res.status(404).json({ message: 'User not found' });
        
        res.json(rows[0]);
    } catch (err) {
        console.error('getProfile error:', err);
        res.status(500).json({ message: 'Failed to load profile' });
    }
};

// FIXED EXPORTS: Only exports what is in THIS file
module.exports = {
    getProfile: exports.getProfile
};