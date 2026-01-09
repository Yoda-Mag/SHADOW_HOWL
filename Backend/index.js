const express = require('express');
const cors = require('cors');
require('dotenv').config();

// CORRECT PATHS: Note the ./ and the Capital letters
const authRoutes = require('./Routes/AuthRoutes');
const authMiddleware = require('./Middleware/Authmiddleware'); 

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Test Route
app.get('/api/auth/verify-me', authMiddleware, (req, res) => {
    res.json({ message: "Success! You are authenticated", user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));