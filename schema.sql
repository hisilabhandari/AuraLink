-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    google_id TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    pro_status TEXT DEFAULT 'none',
    account_status TEXT DEFAULT 'active',
    suspension_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_username_change DATETIME
);


-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    username TEXT PRIMARY KEY,
    name TEXT,
    bio TEXT,
    avatar_url TEXT,
    background_type TEXT DEFAULT 'gradient',
    background_value TEXT DEFAULT 'linear-gradient(135deg, #0f172a, #1e293b)',
    font TEXT DEFAULT 'Inter',
    button_style TEXT DEFAULT 'solid',
    button_color TEXT DEFAULT '#3b82f6',
    button_text_color TEXT DEFAULT '#ffffff',
    button_border_color TEXT DEFAULT 'transparent',
    font_color TEXT DEFAULT '#ffffff',
    google_analytics_id TEXT,
    seo_title TEXT,
    seo_description TEXT,
    allow_indexing INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- Links Table
CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    username TEXT REFERENCES profiles(username) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    button_style TEXT DEFAULT NULL,
    button_color TEXT DEFAULT NULL,
    button_text_color TEXT DEFAULT NULL,
    button_border_color TEXT DEFAULT NULL,
    button_border_radius TEXT DEFAULT NULL,
    show_url INTEGER DEFAULT 0,
    image_url TEXT,
    icon_name TEXT,
    link_type TEXT DEFAULT 'link',
    price REAL,
    currency TEXT DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Views Table (Page Hits)
CREATE TABLE IF NOT EXISTS analytics_views (
    id TEXT PRIMARY KEY,
    username TEXT REFERENCES profiles(username) ON DELETE CASCADE,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    referrer TEXT DEFAULT 'Direct',
    user_agent TEXT,
    country TEXT
);

-- Analytics Clicks Table (Link Clicks)
CREATE TABLE IF NOT EXISTS analytics_clicks (
    id TEXT PRIMARY KEY,
    username TEXT REFERENCES profiles(username) ON DELETE CASCADE,
    link_id TEXT REFERENCES links(id) ON DELETE CASCADE,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT
);

-- Profile Reports Table
CREATE TABLE IF NOT EXISTS profile_reports (
    id TEXT PRIMARY KEY,
    reported_username TEXT REFERENCES profiles(username) ON DELETE CASCADE,
    reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Scalability
CREATE INDEX IF NOT EXISTS idx_links_username ON links(username);
CREATE INDEX IF NOT EXISTS idx_reports_status ON profile_reports(status);
CREATE INDEX IF NOT EXISTS idx_analytics_views_username ON analytics_views(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Seed Initial Demo Data
INSERT OR IGNORE INTO users (id, username, password_hash, pro_status, role) VALUES 
('u1', 'creator1', 'f472823f419e3a9921969bea8c34d61f9be02eca576600728508992ee7df16e1', 'approved', 'user'),
('u2', 'demo', 'f472823f419e3a9921969bea8c34d61f9be02eca576600728508992ee7df16e1', 'none', 'user'),
('u3', 'admin', '3482ddd3a33b95f3392351da63c4fbc2301825445ce189e1111149d66cac46a8', 'approved', 'admin');

INSERT OR IGNORE INTO profiles (username, name, bio, avatar_url, background_type, background_value, font, button_style, button_color, button_text_color, button_border_color) VALUES 
('creator1', 'Alex Rivers', 'Digital Creator & Tech Reviewer. Sharing my favorite gear, templates, and courses.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80', 'gradient', 'linear-gradient(135deg, #1e1b4b, #311042)', 'Outfit', 'glassmorphic', 'rgba(255, 255, 255, 0.1)', '#ffffff', 'rgba(255, 255, 255, 0.2)'),
('demo', 'Jane Doe', 'Minimalist Designer & Writer. Building clean interfaces and writing monthly letters.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80', 'flat', '#0f172a', 'Inter', 'solid', '#3b82f6', '#ffffff', 'transparent'),
('admin', 'Admin Staff', 'AuraLink Platform Administrator.', '', 'gradient', 'linear-gradient(135deg, #0f172a, #1e293b)', 'Inter', 'solid', '#3b82f6', '#ffffff', 'transparent');

INSERT OR IGNORE INTO links (id, username, title, url, is_active, display_order) VALUES 
('link-1', 'creator1', '🎥 My YouTube Channel', 'https://youtube.com', 1, 0),
('link-2', 'creator1', '💻 Premium Notion Workspaces (Use code AURA for 20% off)', 'https://notion.so', 1, 1),
('link-3', 'creator1', '🛍️ Affiliate Shop: Setup & Gear', 'https://amazon.com', 1, 2),
('link-4', 'creator1', '🐦 Daily Tech Tips on Twitter / X', 'https://x.com', 1, 3),
('link-demo-1', 'demo', '🎨 UI Design Portfolio', 'https://dribbble.com', 1, 0),
('link-demo-2', 'demo', '✍️ Read My Newsletter', 'https://substack.com', 1, 1),
('link-admin-1', 'admin', '🔧 Admin Tools', 'https://auralink.com/admin', 1, 0);

INSERT OR IGNORE INTO analytics_views (id, username, timestamp, referrer) VALUES
('v1', 'creator1', '2026-05-21 02:00:00', 'Instagram'),
('v2', 'creator1', '2026-05-21 03:30:00', 'Twitter/X'),
('v3', 'creator1', '2026-05-21 04:15:00', 'Direct'),
('v4', 'creator1', '2026-05-21 05:00:00', 'Instagram'),
('v5', 'creator1', '2026-05-21 06:45:00', 'YouTube'),
('v6', 'creator1', '2026-05-21 08:00:00', 'Direct'),
('v7', 'creator1', '2026-05-21 09:15:00', 'Instagram'),
('v8', 'creator1', '2026-05-21 10:00:00', 'TikTok'),
('v9', 'creator1', '2026-05-21 10:30:00', 'Instagram'),
('v10', 'creator1', '2026-05-21 11:00:00', 'Direct');

INSERT OR IGNORE INTO analytics_clicks (id, username, link_id, timestamp) VALUES
('c1', 'creator1', 'link-1', '2026-05-21 02:05:00'),
('c2', 'creator1', 'link-2', '2026-05-21 03:32:00'),
('c3', 'creator1', 'link-1', '2026-05-21 05:02:00'),
('c4', 'creator1', 'link-3', '2026-05-21 06:48:00'),
('c5', 'creator1', 'link-2', '2026-05-21 09:20:00'),
('c6', 'creator1', 'link-1', '2026-05-21 10:05:00'),
('c7', 'creator1', 'link-4', '2026-05-21 10:35:00');

-- User Media Table (To avoid R2 list Class A operations)
CREATE TABLE IF NOT EXISTS user_media (
    id TEXT PRIMARY KEY,
    username TEXT REFERENCES profiles(username) ON DELETE CASCADE,
    file_key TEXT NOT NULL,
    size INTEGER NOT NULL,
    content_type TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_media_username ON user_media(username);

