const db = require('../Config/Database');

exports.updateSubscription = async (req, res) => {
    try {
        const { userId, status, days } = req.body; 
        // status: 'active', 'expired', etc.
        // days: number of days to add (e.g., 365 for annual) [cite: 44]

        let expiryDate = null;
        if (status === 'active') {
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(days));
        }

        const query = `
            UPDATE users 
            SET subscription_status = ?, subscription_expiry = ? 
            WHERE id = ?
        `;

        await db.query(query, [status, expiryDate, userId]);
        res.json({ success: true, message: `User subscription set to ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin can see all users to manage their access
exports.getAllUsers = async (req, res) => {
    try {
        const query = "SELECT id, username, email, role, subscription_status, subscription_expiry FROM users";
        const [users] = await db.query(query);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};