const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
});

// Handle connection errors
pool.on('error', (err) => {
    console.error('MySQL Pool Error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.');
    }
    if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.error('Database had a fatal error.');
    }
    if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.error('Database connection timeout.');
    }
});

// Test connection on startup
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_REFUSED') {
            console.error('❌ Database connection REFUSED - MySQL may not be running');
        }
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('❌ Database access DENIED - Check credentials in .env');
        }
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('❌ Database does not exist - Run SQL setup first');
        }
        console.error('Database Connection Error:', err);
        return;
    }
    if (connection) {
        console.log('✓ Database connection successful!');
        connection.release();
    }
});

module.exports = pool.promise();