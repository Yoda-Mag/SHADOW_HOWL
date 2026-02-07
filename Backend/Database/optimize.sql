-- Shadow Howl Database Optimization Script
-- Run this once to add indexes and optimize performance

-- ==================== USER TABLE INDEXES ====================
-- Index for email lookups (used in login and registration)
CREATE INDEX idx_users_email ON users(email);

-- Index for username searches
CREATE INDEX idx_users_username ON users(username);

-- Index for role-based queries
CREATE INDEX idx_users_role ON users(role);

-- ==================== SUBSCRIPTIONS TABLE INDEXES ====================
-- Index for user_id lookups (Foreign Key)
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Index for status queries (finding active subscribers)
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Composite index for finding active subscribers with expiry check
CREATE INDEX idx_subscriptions_status_enddate ON subscriptions(status, end_date);

-- ==================== SIGNALS TABLE INDEXES ====================
-- Index for approval status lookups (used heavily in admin/feed queries)
CREATE INDEX idx_signals_is_approved ON signals(is_approved);

-- Index for created_at sorting (signals are ordered by creation date)
CREATE INDEX idx_signals_created_at ON signals(created_at DESC);

-- Composite index for filtering and sorting approved signals
CREATE INDEX idx_signals_approved_created ON signals(is_approved, created_at DESC);

-- ==================== QUERY OPTIMIZATION ====================
-- Analyze tables for query optimizer
ANALYZE TABLE users;
ANALYZE TABLE subscriptions;
ANALYZE TABLE signals;

-- ==================== TABLE OPTIMIZATION ====================
-- Optimize table storage and reclaim space
OPTIMIZE TABLE users;
OPTIMIZE TABLE subscriptions;
OPTIMIZE TABLE signals;

-- ==================== DISPLAY INDEX INFO ====================
-- Show all indexes created
SHOW INDEX FROM users;
SHOW INDEX FROM subscriptions;
SHOW INDEX FROM signals;
