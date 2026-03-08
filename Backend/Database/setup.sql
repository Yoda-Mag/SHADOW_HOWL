-- ============================================
-- Shadow Howl Database Setup Script
-- ============================================
-- Run this on your AWS Lightsail MySQL instance
-- Or import it into MySQL: mysql -u root -p < setup.sql

-- Create database
CREATE DATABASE IF NOT EXISTS shadow_howl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE shadow_howl;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    subscription_status ENUM('active', 'inactive', 'expired') DEFAULT 'inactive',
    subscription_end_date DATETIME,
    verification_code VARCHAR(6),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create signals table
CREATE TABLE IF NOT EXISTS signals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    direction ENUM('BUY', 'SELL') NOT NULL,
    entry_price DECIMAL(10, 5) NOT NULL,
    stop_loss DECIMAL(10, 5) NOT NULL,
    take_profit DECIMAL(10, 5) NOT NULL,
    status ENUM('active', 'closed', 'cancelled') DEFAULT 'active',
    description TEXT,
    disclaimer TEXT DEFAULT 'This is not financial advice. Trade at your own risk.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id),
    INDEX idx_symbol (symbol),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create signal results table
CREATE TABLE IF NOT EXISTS signal_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    signal_id INT NOT NULL,
    user_id INT NOT NULL,
    result ENUM('win', 'loss', 'pending') DEFAULT 'pending',
    exit_price DECIMAL(10, 5),
    profit_loss DECIMAL(10, 2),
    closed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (signal_id) REFERENCES signals(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_signal_id (signal_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create chat/conversation table
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    message_type ENUM('user', 'assistant', 'system') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration_days INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    payment_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, duration_days, price, description) VALUES
('Monthly', 30, 49.99, 'Access to all live signals for 30 days'),
('Quarterly', 90, 129.99, 'Access to all live signals for 90 days'),
('Annual', 365, 399.99, 'Access to all live signals for 365 days'),
('One-Time', 30, 19.99, 'Limited access for 30 days');

-- Create application user (for backend to user)
-- Use: mysql -u root -p
-- Then in MySQL: 
-- CREATE USER 'shadow_user'@'127.0.0.1' IDENTIFIED BY 'strong_password';
-- GRANT ALL PRIVILEGES ON shadow_howl.* TO 'shadow_user'@'127.0.0.1';
-- FLUSH PRIVILEGES;

DELIMITER //
CREATE PROCEDURE GetActiveSignals()
BEGIN
    SELECT * FROM signals 
    WHERE status = 'active' 
    ORDER BY created_at DESC;
END //
DELIMITER ;

-- Verify setup
SELECT '✓ Shadow Howl Database Setup Complete!' as status;
SHOW TABLES;
