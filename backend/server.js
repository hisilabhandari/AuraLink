import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database helper functions
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file, returning empty schema:', err);
    return { users: {}, profiles: {}, views: [], clicks: [] };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
};

// --- AUTHENTICATION ENDPOINTS ---

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 4 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
    return res.status(400).json({ error: 'Username must be at least 4 characters and contain only letters, numbers, and underscores' });
  }

  const db = readDB();
  if (db.users[cleanUsername]) {
    return res.status(409).json({ error: 'Username is already taken' });
  }

  // Create User
  db.users[cleanUsername] = {
    username: cleanUsername,
    password, // Storing in plain text for this local prototype/demo simplicity
    isPremium: false,
    role: 'user'
  };

  // Create Default Profile
  db.profiles[cleanUsername] = {
    username: cleanUsername,
    name: username,
    bio: 'Welcome to my new link page!',
    avatarUrl: '',
    theme: {
      backgroundType: 'gradient',
      backgroundValue: 'linear-gradient(135deg, #0f172a, #1e293b)',
      font: 'Inter',
      buttonStyle: 'solid',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
      buttonBorderColor: 'transparent'
    },
    links: [
      { id: 'link-default-1', title: '👋 Welcome to my Link Page!', url: 'https://google.com', active: true }
    ]
  };

  writeDB(db);

  res.status(201).json({
    message: 'User registered successfully',
    user: { username: cleanUsername, isPremium: false }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const db = readDB();

  const user = db.users[cleanUsername];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  res.json({
    message: 'Login successful',
    user: { username: user.username, role: user.role || 'user', isPremium: user.isPremium }
  });
});

// --- PROFILE ENDPOINTS ---

// Check username availability
app.get('/api/profile/check/:username', (req, res) => {
  const cleanUsername = req.params.username.trim().toLowerCase();
  const db = readDB();
  const available = !db.users[cleanUsername];
  res.json({ available });
});

// Get profile (Public)
app.get('/api/profile/:username', (req, res) => {
  const cleanUsername = req.params.username.trim().toLowerCase();
  const db = readDB();

  let profile = db.profiles[cleanUsername];
  if (!profile) {
    // Auto-create a default profile if user exists but has no profile
    if (db.users[cleanUsername]) {
      db.profiles[cleanUsername] = {
        username: cleanUsername,
        name: cleanUsername,
        bio: 'Welcome to my new link page!',
        avatarUrl: '',
        theme: {
          backgroundType: 'gradient',
          backgroundValue: 'linear-gradient(135deg, #0f172a, #1e293b)',
          font: 'Inter',
          buttonStyle: 'solid',
          buttonColor: '#3b82f6',
          buttonTextColor: '#ffffff',
          buttonBorderColor: 'transparent'
        },
        links: [
          { id: 'link-default-1', title: '👋 Welcome to my Link Page!', url: 'https://google.com', active: true }
        ]
      };
      writeDB(db);
      profile = db.profiles[cleanUsername];
    } else {
      return res.status(404).json({ error: 'Profile not found' });
    }
  }

  res.json(profile);
});

// Update profile (Authorized)
app.put('/api/profile/:username', (req, res) => {
  const cleanUsername = req.params.username.trim().toLowerCase();
  const { name, bio, avatarUrl, theme, links } = req.body;
  
  const db = readDB();
  const profile = db.profiles[cleanUsername];

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Update profile values
  profile.name = name !== undefined ? name : profile.name;
  profile.bio = bio !== undefined ? bio : profile.bio;
  profile.avatarUrl = avatarUrl !== undefined ? avatarUrl : profile.avatarUrl;
  profile.theme = theme !== undefined ? { ...profile.theme, ...theme } : profile.theme;
  profile.links = links !== undefined ? links : profile.links;

  db.profiles[cleanUsername] = profile;
  writeDB(db);

  res.json({ message: 'Profile updated successfully', profile });
});

// Change Username
app.post('/api/profile/:username/change-username', (req, res) => {
  const currentUsername = req.params.username.trim().toLowerCase();
  const { newUsername } = req.body;
  
  if (!newUsername) {
    return res.status(400).json({ error: 'New username is required' });
  }
  
  const cleanNewUsername = newUsername.trim().toLowerCase();
  if (cleanNewUsername.length < 4 || !/^[a-z0-9_]+$/.test(cleanNewUsername)) {
    return res.status(400).json({ error: 'Username must be at least 4 characters and contain only letters, numbers, and underscores' });
  }
  
  const db = readDB();
  
  // Check if new username is already taken
  if (db.users[cleanNewUsername]) {
    return res.status(409).json({ error: 'Username is already taken' });
  }
  
  const user = db.users[currentUsername];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Update users object key
  user.username = cleanNewUsername;
  db.users[cleanNewUsername] = user;
  delete db.users[currentUsername];
  
  // Update profiles object key
  const profile = db.profiles[currentUsername];
  if (profile) {
    profile.username = cleanNewUsername;
    db.profiles[cleanNewUsername] = profile;
    delete db.profiles[currentUsername];
  }
  
  // Update analytics views references
  db.views = db.views.map(v => {
    if (v.username === currentUsername) {
      return { ...v, username: cleanNewUsername };
    }
    return v;
  });
  
  // Update analytics clicks references
  db.clicks = db.clicks.map(c => {
    if (c.username === currentUsername) {
      return { ...c, username: cleanNewUsername };
    }
    return c;
  });
  
  writeDB(db);
  
  res.json({
    message: 'Username updated successfully',
    username: cleanNewUsername
  });
});

// Toggle Premium Status (Demo Helper)
app.post('/api/profile/:username/toggle-premium', (req, res) => {
  const cleanUsername = req.params.username.trim().toLowerCase();
  const db = readDB();
  
  if (!db.users[cleanUsername]) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.users[cleanUsername].isPremium = !db.users[cleanUsername].isPremium;
  writeDB(db);

  res.json({ message: 'Premium status updated', isPremium: db.users[cleanUsername].isPremium });
});


// --- ANALYTICS TRACKING ENDPOINTS ---

// Log page view
app.post('/api/analytics/view/:username', (req, res) => {
  const cleanUsername = req.params.username.trim().toLowerCase();
  const { referrer } = req.body;
  
  const db = readDB();
  if (!db.profiles[cleanUsername]) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const newView = {
    id: uuidv4(),
    username: cleanUsername,
    timestamp: new Date().toISOString(),
    referrer: referrer || 'Direct'
  };

  db.views.push(newView);
  writeDB(db);

  res.status(201).json({ message: 'View tracked successfully' });
});

// Log link click
app.post('/api/analytics/click/:username', (req, res) => {
  const cleanUsername = req.params.username.trim().toLowerCase();
  const { linkId } = req.body;

  if (!linkId) {
    return res.status(400).json({ error: 'LinkId is required' });
  }

  const db = readDB();
  if (!db.profiles[cleanUsername]) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const newClick = {
    id: uuidv4(),
    username: cleanUsername,
    linkId,
    timestamp: new Date().toISOString()
  };

  db.clicks.push(newClick);
  writeDB(db);

  res.status(201).json({ message: 'Click tracked successfully' });
});

// Get creator analytics report
app.get('/api/analytics/report/:username', (req, res) => {
  const cleanUsername = req.params.username.trim().toLowerCase();
  const db = readDB();

  if (!db.profiles[cleanUsername]) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Filter logs for this user
  const userViews = db.views.filter(v => v.username === cleanUsername);
  const userClicks = db.clicks.filter(c => c.username === cleanUsername);

  // Total metrics
  const totalViews = userViews.length;
  const totalClicks = userClicks.length;
  const ctr = totalViews > 0 ? parseFloat(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

  // Referral breakdown
  const referrers = {};
  userViews.forEach(v => {
    const ref = v.referrer || 'Direct';
    referrers[ref] = (referrers[ref] || 0) + 1;
  });

  const referralData = Object.entries(referrers).map(([source, count]) => ({
    source,
    count,
    percentage: totalViews > 0 ? parseFloat(((count / totalViews) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.count - a.count);

  // Clicks per link breakdown
  const profile = db.profiles[cleanUsername];
  const linksMap = {};
  profile.links.forEach(l => {
    linksMap[l.id] = { title: l.title, url: l.url, clicks: 0 };
  });

  userClicks.forEach(c => {
    if (linksMap[c.linkId]) {
      linksMap[c.linkId].clicks += 1;
    }
  });

  const linkPerformance = Object.entries(linksMap).map(([id, info]) => ({
    id,
    title: info.title,
    url: info.url,
    clicks: info.clicks,
    ctr: totalViews > 0 ? parseFloat(((info.clicks / totalViews) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.clicks - a.clicks);

  // Simple hourly/daily timeline aggregation for past 24 hrs
  // For the demonstration, we'll group by Hour or simply send the raw items for frontend charting
  const timelineViews = userViews.map(v => ({ timestamp: v.timestamp }));
  const timelineClicks = userClicks.map(c => ({ timestamp: c.timestamp, linkId: c.linkId }));

  res.json({
    metrics: {
      totalViews,
      totalClicks,
      ctr
    },
    referralData,
    linkPerformance,
    timeline: {
      views: timelineViews,
      clicks: timelineClicks
    }
  });
});

// --- SPA FALLBACK FOR LOCAL DEV ---
// Serve static files from the frontend build directory
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Catch-all: serve index.html for any route not matched by API endpoints above
// This enables clean URL routing (/auth, /dashboard, /@username) to work on page refresh
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If frontend hasn't been built yet, return a helpful message
    res.status(503).send('Frontend not built yet. Run "npm run build" in the frontend directory first.');
  }
});

app.listen(PORT, () => {
  console.log(`AuraLink Backend Server running on port ${PORT}`);
});
