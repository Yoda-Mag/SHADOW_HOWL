const db = require('../Config/Database');

// ADMIN: Create a new signal (Draft status by default)
exports.createSignal = async (req, res) => {
    const { pair, direction, entry_price, stop_loss, take_profit } = req.body;
    const disclaimer = "This is not financial advice. Trade at your own risk.";

    try {
            if (isNaN(entry_price) || isNaN(stop_loss)) {
                return res.status(400).json({ message: "Prices must be valid numbers." });
                }

            if (pair.length > 10) {
                return res.status(400).json({ message: "Pair name is too long (e.g., BTC/USD)." });
                }

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
    try {
        const signalId = req.params.id;

        if (!signalId) {
            return res.status(400).json({ message: "Signal ID is required." });
        }

        const query = "UPDATE signals SET is_approved = 1 WHERE id = ?";

        // Switch to [result] await pattern to match your other functions
        const [result] = await db.query(query, [signalId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Signal not found." });
        }

        return res.json({ 
            success: true, 
            message: "Signal approved successfully!" 
        });

    } catch (error) {
        console.error("Controller Error:", error);
        // This ensures if the DB fails, the user gets an answer
        return res.status(500).json({ error: error.message });
    }
};
// USER/ADMIN: Get signals (Users only see approved ones)
exports.getAllSignals = async (req, res) => {
    try {
        const { role, id } = req.user;

        // 1. Fetch user's current subscription info from subscriptions table
        const [subscriptionRows] = await db.query("SELECT status, end_date FROM subscriptions WHERE user_id = ?", [id]);
        const subscription = subscriptionRows[0];

        // 2. Admin always has access
        if (role === 'admin') {
            const [signals] = await db.query("SELECT id, pair, direction, entry_price, stop_loss, take_profit, notes, is_approved, created_at FROM signals ORDER BY created_at DESC LIMIT 1000");
            return res.json(signals);
        }

        // 3. Check if subscription is active and not expired
        const today = new Date();
        if (!subscription || subscription.status !== 'active' || (subscription.end_date && new Date(subscription.end_date) < today)) {
            return res.status(403).json({ 
                message: "Subscription Required", 
                status: subscription?.status || 'none',
                instruction: "Please contact admin for subscription access" 
            });
        }

        // 4. Return live signals for active users [cite: 30]
        const [signals] = await db.query("SELECT id, pair, direction, entry_price, stop_loss, take_profit, notes, is_approved, created_at FROM signals WHERE is_approved = 1 ORDER BY created_at DESC LIMIT 1000");
        res.json(signals);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ADMIN: Edit an existing signall
exports.updateSignal = async (req, res) => {
    try {
        const { id } = req.params;
        const { pair, direction, entry_price, stop_loss, take_profit, notes } = req.body;

        // Validation (NOW AFTER destructuring)
        if (isNaN(entry_price) || isNaN(stop_loss)) {
            return res.status(400).json({ message: "Prices must be valid numbers." });
        }
                
        if (pair.length > 10) {
            return res.status(400).json({ message: "Pair name is too long (e.g., BTC/USD)." });
        }

        // Construct the update query
        const query = `
            UPDATE signals 
            SET pair = ?, direction = ?, entry_price = ?, stop_loss = ?, take_profit = ?, notes = ?
            WHERE id = ?
        `;

        const [result] = await db.query(query, [
            pair, 
            direction.toUpperCase(), 
            entry_price, 
            stop_loss, 
            take_profit, 
            notes || "This is not financial advice. Trade at your own risk.", 
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Signal not found" });
        }

        res.json({ success: true, message: "Signal updated successfully!" });
    } catch (err) {
        console.error("Update Signal Error:", err);
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