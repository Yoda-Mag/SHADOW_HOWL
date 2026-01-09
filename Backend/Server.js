const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MySQL Connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'shadow_howl_db'
}).promise();

// Middleware: Verify JWT and Check Role
const authenticateToken = (roleRequired) => async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid Token" });
        if (roleRequired && user.role !== roleRequired) {
            return res.status(403).json({ message: "Access Denied" });
        }
        req.user = user;
        next();
    });
};