const db = require('../Config/Database');
const sendSignalEmail = require('../Utils/sendEmail');

// 1. Get all users + their subscription status
exports.getAllUsers = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.username, u.email, u.role, 
                   s.status as subscription_status, 
                   s.end_date as subscription_expiry
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id
        `;
        const [users] = await db.query(query);
        res.json(users);
    } catch (err) {
        console.error("GET USERS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch users", error: err.message });
    }
};

// 1.5 Search users
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.params;
        if (!query || query.trim().length === 0) return res.status(400).json({ message: "Search query required" });

        const searchQuery = `
            SELECT u.id, u.username, u.email, u.role, 
                   s.status as subscription_status, 
                   s.end_date as subscription_expiry
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id
            WHERE u.username LIKE ? OR u.email LIKE ?
            LIMIT 50
        `;
        const searchTerm = `%${query}%`;
        const [users] = await db.query(searchQuery, [searchTerm, searchTerm]);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Update Subscription
exports.updateSubscription = async (req, res) => {
    const id = req.params.id || req.body.userId;
    const { status, expiryDays = 30 } = req.body; 
    try {
        if (!status || !id) return res.status(400).json({ message: "ID and Status required" });

        let dbStatus = (status === 'inactive' || status === 'disabled') ? 'expired' : status;
        let expiryDate = new Date();
        if (dbStatus !== 'expired') expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

        const formattedDate = expiryDate.toISOString().slice(0, 19).replace('T', ' ');
        const query = `
            INSERT INTO subscriptions (user_id, status, end_date) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE status = VALUES(status), end_date = VALUES(end_date)
        `;
        await db.query(query, [parseInt(id), dbStatus, formattedDate]);
        res.json({ message: `User status set to ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Signal Management
exports.getAllSignals = async (req, res) => {
    try {
        const [signals] = await db.query("SELECT * FROM signals ORDER BY created_at DESC LIMIT 100");
        res.json(signals);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createSignal = async (req, res) => {
    const { pair, type, entry_price, sl, tp, notes } = req.body;
    try {
        const query = `INSERT INTO signals (pair, direction, entry_price, stop_loss, take_profit, notes, is_approved) VALUES (?, ?, ?, ?, ?, ?, 1)`;
        await db.query(query, [pair, type.toUpperCase(), entry_price, sl, tp, notes || "Admin Signal"]);
        res.status(201).json({ message: "Signal broadcasted!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateSignal = async (req, res) => {
    const { id } = req.params;
    const { pair, type, entry_price, sl, tp, notes } = req.body;
    try {
        await db.query("UPDATE signals SET pair=?, direction=?, entry_price=?, stop_loss=?, take_profit=?, notes=? WHERE id=?", [pair, type.toUpperCase(), entry_price, sl, tp, notes, id]);
        res.json({ message: "Signal updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteSignal = async (req, res) => {
    try {
        await db.query("DELETE FROM signals WHERE id = ?", [req.params.id]);
        res.json({ message: "Signal deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.toggleApproval = async (req, res) => {
    const { id } = req.params;
    const { is_approved } = req.body;
    try {
        await db.query("UPDATE signals SET is_approved = ? WHERE id = ?", [is_approved, id]);
        if (is_approved) {
            const [sig] = await db.query("SELECT * FROM signals WHERE id = ?", [id]);
            const [users] = await db.query("SELECT u.email FROM users u JOIN subscriptions s ON u.id = s.user_id WHERE s.status = 'active' AND s.end_date > NOW()");
            users.forEach(u => sendSignalEmail(u.email, sig[0]).catch(e => console.error(e)));
        }
        res.json({ message: "Status updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// FIXED EXPORTS: Matches the functions in THIS file
module.exports = {
    getAllUsers: exports.getAllUsers,
    searchUsers: exports.searchUsers,
    updateSubscription: exports.updateSubscription,
    getAllSignals: exports.getAllSignals,
    createSignal: exports.createSignal,
    updateSignal: exports.updateSignal,
    deleteSignal: exports.deleteSignal,
    toggleApproval: exports.toggleApproval
};