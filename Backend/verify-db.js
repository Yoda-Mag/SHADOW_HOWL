#!/usr/bin/env node

/**
 * Database Connectivity Verification Script
 * Run this on your AWS Lightsail instance to verify database setup
 * Usage: node verify-db.js
 */

const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log(`
╔════════════════════════════════════════════════════════════════╗
║      Shadow Howl Database Connectivity Verification            ║
╚════════════════════════════════════════════════════════════════╝
`);

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
};

console.log('\n📋 Configuration from .env:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  User: ${config.user}`);
console.log(`  Database: ${config.database}`);
console.log(`  Password: ${'*'.repeat(config.password?.length || 0)}`);

// Validation
const errors = [];

if (!config.host) errors.push('  ✗ DB_HOST not set');
if (!config.user) errors.push('  ✗ DB_USER not set');
if (!config.password) errors.push('  ✗ DB_PASSWORD not set');
if (!config.database) errors.push('  ✗ DB_DATABASE not set');

if (errors.length > 0) {
    console.log('\n❌ Configuration Errors:');
    errors.forEach(e => console.log(e));
    console.log('\nPlease create .env file with correct values.');
    process.exit(1);
}

console.log('  ✓ All required environment variables are set\n');

// Test 1: Basic Connection
console.log('🔗 Test 1: Basic Connection...');
const connection = mysql.createConnection(config);

connection.connect((err) => {
    if (err) {
        console.log('  ✗ Connection failed');
        if (err.code === 'PROTOCOL_CONNECTION_REFUSED') {
            console.log('    → MySQL server is not running or refused connection');
            console.log('    → Run: sudo systemctl start mysql');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('    → Authentication failed (wrong password or user)');
            console.log(`    → User: ${config.user}`);
            console.log('    → Check credentials in .env file');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.log('    → Database does not exist');
            console.log(`    → Database: ${config.database}`);
            console.log('    → Create database or check name in .env');
        } else {
            console.log(`    → Error: ${err.message}`);
            console.log(`    → Code: ${err.code}`);
        }
        process.exit(1);
    }
    console.log('  ✓ Connection successful\n');

    // Test 2: Test Query
    console.log('📊 Test 2: Simple Query...');
    connection.query('SELECT 1 as test', (err, results) => {
        if (err) {
            console.log(`  ✗ Query failed: ${err.message}`);
            connection.end();
            process.exit(1);
        }
        console.log('  ✓ Query successful\n');

        // Test 3: Check tables
        console.log('📋 Test 3: Check Existing Tables...');
        connection.query('SHOW TABLES', (err, tables) => {
            if (err) {
                console.log(`  ✗ Failed to show tables: ${err.message}`);
                connection.end();
                process.exit(1);
            }

            if (tables.length === 0) {
                console.log('  ⚠ Database is empty - no tables found');
                console.log('  → Run setup.sql to initialize database:');
                console.log(`  → mysql -u ${config.user} -p ${config.database} < setup.sql`);
            } else {
                console.log(`  ✓ Found ${tables.length} tables:`);
                tables.forEach(t => {
                    const tableName = Object.values(t)[0];
                    console.log(`    • ${tableName}`);
                });
            }
            console.log();

            // Test 4: Connection Pool
            console.log('🔄 Test 4: Connection Pool...');
            const pool = mysql.createPool({
                host: config.host,
                user: config.user,
                password: config.password,
                database: config.database,
                waitForConnections: true,
                connectionLimit: 10,
                enableKeepAlive: true,
            });

            pool.getConnection((err, poolConnection) => {
                if (err) {
                    console.log(`  ✗ Pool connection failed: ${err.message}`);
                    connection.end();
                    process.exit(1);
                }
                console.log('  ✓ Pool connection successful\n');
                poolConnection.release();

                // Final Summary
                console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    ✓ ALL TESTS PASSED!                        ║
╠════════════════════════════════════════════════════════════════╣
║ Your database is properly configured and accessible.           ║
║ You can now deploy the application.                            ║
╚════════════════════════════════════════════════════════════════╝
                `);

                connection.end();
                pool.end();
            });
        });
    });
});

// Handle connection errors
connection.on('error', (err) => {
    console.error('❌ Connection error:', err);
    process.exit(1);
});
