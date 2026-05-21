-- 1. Add new columns to the existing users table
ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN pro_status TEXT DEFAULT 'none';
ALTER TABLE users ADD COLUMN account_status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN suspension_reason TEXT;

-- 2. Create unique indexes for the new email and google_id columns
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 3. Create the new profile_reports table
CREATE TABLE IF NOT EXISTS profile_reports (
    id TEXT PRIMARY KEY,
    reported_username TEXT REFERENCES profiles(username) ON DELETE CASCADE,
    reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_links_username ON links(username);
CREATE INDEX IF NOT EXISTS idx_reports_status ON profile_reports(status);
CREATE INDEX IF NOT EXISTS idx_analytics_views_username ON analytics_views(username);

-- Note: In your original schema, `password_hash` was `NOT NULL`. 
-- SQLite does not support dropping NOT NULL constraints easily, 
-- so if you get a NOT NULL constraint error during Google OAuth signup, 
-- you may need to insert a dummy string like 'oauth_placeholder' for the password_hash.
