const db = require('../Config/Database');

// 1. Get all users + their subscription status (Using JOIN)
exports.getAllUsers = async (req, res) => {
    try {
        // We join 'users' with 'subscriptions' to get status and end_date in one go
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

// 2. Manage Subscription (Targets the 'subscriptions' table)
exports.updateSubscription = async (req, res) => {
    const { id } = req.params; // user_id
    const { status, expiryDays = 30 } = req.body; 
    
    try {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

        // Use ON DUPLICATE KEY UPDATE so it creates a record if one doesn't exist
        const query = `
            INSERT INTO subscriptions (user_id, status, end_date) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE status = VALUES(status), end_date = VALUES(end_date)
        `;

        await db.query(query, [id, status, expiryDate]);
        res.json({ message: `User status set to ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Manage User Role
exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { newRole } = req.body;
    try {
        await db.query("UPDATE users SET role = ? WHERE id = ?", [newRole, id]);
        res.json({ message: `User role updated to ${newRole}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Get All Signals
exports.getAllSignals = async (req, res) => {
    try {
        const [signals] = await db.query("SELECT * FROM signals ORDER BY created_at DESC");
        res.json(signals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Create Signal (Matches 'direction', 'stop_loss', 'take_profit')
exports.createSignal = async (req, res) => {
    const { pair, type, entry_price, sl, tp, notes } = req.body;
    try {
        const query = `
            INSERT INTO signals 
            (pair, direction, entry_price, stop_loss, take_profit, notes, is_approved) 
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `;
        const values = [pair, type.toUpperCase(), entry_price, sl, tp, notes || "Admin Signal"];
        
        await db.query(query, values);
        res.status(201).json({ message: "Signal broadcasted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. Update Signal
exports.updateSignal = async (req, res) => {
    const { id } = req.params;
    const { pair, type, entry_price, sl, tp, notes } = req.body;
    try {
        const query = `
            UPDATE signals 
            SET pair = ?, direction = ?, entry_price = ?, stop_loss = ?, take_profit = ?, notes = ? 
            WHERE id = ?
        `;
        await db.query(query, [pair, type.toUpperCase(), entry_price, sl, tp, notes, id]);
        res.json({ message: "Signal updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. Delete Signal
exports.deleteSignal = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM signals WHERE id = ?", [id]);
        res.json({ message: "Signal deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleApproval = async (req, res) => {
    const { id } = req.params;
    const { is_approved } = req.body; // Expecting 1 or 0
    try {
        await db.query("UPDATE signals SET is_approved = ? WHERE id = ?", [is_approved, id]);
        res.json({ message: is_approved ? "Signal Approved!" : "Signal Unapproved!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};