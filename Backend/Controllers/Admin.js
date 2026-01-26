const db = require('../Config/Database');

// 1. Get all users (Preserving your specific SELECT query)
exports.getAllUsers = async (req, res) => {
    try {
        // Using SELECT * prevents a 500 crash if you haven't added 
        // the 'subscription_status' column to your database yet.
        const [users] = await db.query("SELECT * FROM users");
        res.json(users);
    } catch (err) {
        // This log will show the REAL error in your VS Code terminal
        console.error("CRITICAL BACKEND ERROR:", err); 
        res.status(500).json({ message: "Backend query failed", error: err.message });
    }
};

// 2. Manage Subscription (Preserving your expiryDays logic)
exports.updateSubscription = async (req, res) => {
    const { userId, status, expiryDays } = req.body;
    try {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

        await db.query(
            "UPDATE users SET subscription_status = ?, subscription_expiry = ? WHERE id = ?",
            [status, expiryDate, userId]
        );
        res.json({ message: "Subscription updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Manage User Role
exports.updateUserRole = async (req, res) => {
    const { userId, newRole } = req.body;
    try {
        await db.query("UPDATE users SET role = ? WHERE id = ?", [newRole, userId]);
        res.json({ message: `User role updated to ${newRole}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Signal Management (Preserving your req.user.id logic)
exports.createSignal = async (req, res) => {
    const { pair, type, entry, sl, tp } = req.body;
    try {
        await db.query(
            "INSERT INTO signals (pair, type, entry_price, stop_loss, take_profit, created_by) VALUES (?, ?, ?, ?, ?, ?)",
            [pair, type, entry, sl, tp, req.user.id]
        );
        res.status(201).json({ message: "New signal broadcasted!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to post signal" });
    }
};