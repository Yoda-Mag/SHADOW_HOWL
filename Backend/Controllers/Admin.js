const db = require('../Config/Database');
const sendSignalEmail = require('../Utils/sendEmail');

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

// 1.5 Search users by username or email
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.params;
        
        if (!query || query.trim().length === 0) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Use LIKE for partial matching, with % wildcards
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
        console.error("SEARCH USERS ERROR:", err);
        res.status(500).json({ message: "Failed to search users", error: err.message });
    }
};

// 2. Manage Subscription (Targets the 'subscriptions' table)
exports.updateSubscription = async (req, res) => {
    const { id } = req.params; // user_id
    const { status, expiryDays = 30 } = req.body; 
    
    try {
        // Validate status parameter
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        // Validate user_id
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        // Map frontend status values to database enum values
        // Frontend sends 'active' or 'inactive', map to database allowed values
        let dbStatus = status;
        if (status === 'inactive' || status === 'disabled') {
            dbStatus = 'expired'; // Use 'expired' for deactivated subscriptions
        }

        // If deactivating, set end_date to now; if activating, set future date
        let expiryDate;
        if (status === 'inactive' || status === 'disabled') {
            expiryDate = new Date(); // Current date deactivates immediately
        } else {
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
        }

        // Format date as YYYY-MM-DD HH:MM:SS for MySQL
        const formattedDate = expiryDate.toISOString().slice(0, 19).replace('T', ' ');

        // Use ON DUPLICATE KEY UPDATE so it creates a record if one doesn't exist
        const query = `
            INSERT INTO subscriptions (user_id, status, end_date) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE status = VALUES(status), end_date = VALUES(end_date)
        `;

        console.log("UPDATE SUBSCRIPTION QUERY:", { id, dbStatus, formattedDate });
        await db.query(query, [parseInt(id), dbStatus, formattedDate]);
        res.json({ message: `User status set to ${status}` });
    } catch (err) {
        console.error("UPDATE SUBSCRIPTION ERROR:", err);
        res.status(500).json({ error: err.message, errorDetails: err.toString() });
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
        const [signals] = await db.query("SELECT id, pair, direction, entry_price, stop_loss, take_profit, notes, is_approved, created_at FROM signals ORDER BY created_at DESC LIMIT 1000");
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
        // Update the signal approval status
        await db.query("UPDATE signals SET is_approved = ? WHERE id = ?", [is_approved, id]);

        // If signal is approved, fetch it and send emails to all active subscribers
        if (is_approved) {
            // Get the signal details
            const [signals] = await db.query("SELECT id, pair, direction, entry_price, stop_loss, take_profit, notes, is_approved, created_at FROM signals WHERE id = ?", [id]);
            if (signals.length === 0) {
                return res.status(404).json({ message: "Signal not found" });
            }
            
            const signal = signals[0];
            console.log("Signal to approve:", signal);

            // Fetch all users with active subscriptions (with better debugging)
            const [activeUsers] = await db.query(`
                SELECT u.id, u.email, u.username, s.status, s.end_date
                FROM users u
                INNER JOIN subscriptions s ON u.id = s.user_id
                WHERE s.status = 'active' AND s.end_date > NOW()
            `);

            console.log(`Found ${activeUsers.length} active subscribers:`, activeUsers);

            // Send email to each active subscriber
            if (activeUsers.length > 0) {
                const emailPromises = activeUsers.map(user => {
                    console.log(`Queuing email for ${user.email}`);
                    return sendSignalEmail(user.email, {
                        pair: signal.pair,
                        direction: signal.direction,
                        entry_price: signal.entry_price,
                        stop_loss: signal.stop_loss,
                        take_profit: signal.take_profit
                    }).catch(err => {
                        console.error(`Failed to send email to ${user.email}:`, err.message);
                    });
                });
                
                await Promise.all(emailPromises);
                console.log(`Signal approved and emails sent to ${activeUsers.length} subscribers`);
            } else {
                console.log("No active subscribers found to email");
            }
        }

        res.json({ message: is_approved ? "Signal Approved and notifications sent!" : "Signal Unapproved!" });
    } catch (err) {
        console.error("TOGGLE APPROVAL ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};