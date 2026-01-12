const db = require('../Config/Database');

// ADMIN: Create a new signal (Draft status by default)
exports.createSignal = async (req, res) => {
    const { pair, direction, entry_price, stop_loss, take_profit } = req.body;
    const disclaimer = "This is not financial advice. Trade at your own risk.";

    try {
        const [result] = await db.query(
            `INSERT INTO signals (pair, direction, entry_price, stop_loss, take_profit, notes, is_approved) 
             VALUES (?, ?, ?, ?, ?, ?, FALSE)`, 
            [pair, direction, entry_price, stop_loss, take_profit, disclaimer]
        );
        res.status(201).json({ message: "Signal created successfully. Awaiting Admin Approval.", id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ADMIN: Approve a signal to make it live
exports.approveSignal = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE signals SET is_approved = TRUE WHERE id = ?", [id]);
        res.json({ message: "Signal is now LIVE on the user feed." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// USER/ADMIN: Get signals (Users only see approved ones)
exports.getAllSignals = async (req, res) => {
    const isAdmin = req.user.role === 'admin';
    try {
        // Admins see everything, Users only see approved
        const query = isAdmin 
            ? "SELECT * FROM signals ORDER BY created_at DESC" 
            : "SELECT * FROM signals WHERE is_approved = TRUE ORDER BY created_at DESC";
            
        const [signals] = await db.query(query);
        res.json(signals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ADMIN: Delete a signal
exports.deleteSignal = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM signals WHERE id = ?", [id]);
        res.json({ message: "Signal deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};