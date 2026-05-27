import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Helper to hash passwords using Web Crypto API
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode('auralink_salt_' + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Enable CORS
app.use('/api/*', cors());

// --- AUTHENTICATION ---

// Register
app.post('/api/auth/register', async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400);
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 4 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
    return c.json({ error: 'Username must be at least 4 characters and contain only letters, numbers, and underscores' }, 400);
  }

  try {
    // Check if user exists
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?')
      .bind(cleanUsername)
      .first();

    if (existing) {
      return c.json({ error: 'Username is already taken' }, 409);
    }

    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);
    
    // Insert user and default profile
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT INTO users (id, username, password_hash, role, pro_status, account_status) VALUES (?, ?, ?, 'user', 'none', 'active')")
        .bind(userId, cleanUsername, hashedPassword),
      c.env.DB.prepare('INSERT INTO profiles (username, name, bio, avatar_url, background_type, background_value, font, button_style, button_color, button_text_color, button_border_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          cleanUsername,
          username,
          'Welcome to my new link page!',
          '',
          'gradient',
          'linear-gradient(135deg, #0f172a, #1e293b)',
          'Inter',
          'solid',
          '#3b82f6',
          '#ffffff',
          'transparent'
        ),
      c.env.DB.prepare('INSERT INTO links (id, username, title, url, is_active, display_order) VALUES (?, ?, ?, ?, 1, 0)')
        .bind(crypto.randomUUID(), cleanUsername, '👋 Welcome to my Link Page!', 'https://google.com')
    ]);

    return c.json({
      message: 'User registered successfully',
      user: { username: cleanUsername, role: 'user', proStatus: 'none', accountStatus: 'active' }
    }, 201);

  } catch (err) {
    console.error(err);
    return c.json({ error: 'Database execution error' }, 500);
  }
});

// Login
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400);
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    const user = await c.env.DB.prepare('SELECT username, password_hash, role, pro_status, account_status FROM users WHERE username = ?')
      .bind(cleanUsername)
      .first();

    const hashedPassword = await hashPassword(password);

    if (!user || user.password_hash !== hashedPassword) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }
    
    if (user.account_status === 'suspended') {
      return c.json({ error: 'This account is suspended' }, 403);
    }

    return c.json({
      message: 'Login successful',
      user: { username: user.username, role: user.role, proStatus: user.pro_status }
    });
  } catch (err) {
    return c.json({ error: 'Database query error' }, 500);
  }
});

// Google OAuth Login / Signup
app.post('/api/auth/google', async (c) => {
  const { credential } = await c.req.json();
  if (!credential) return c.json({ error: 'Missing credential' }, 400);

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!response.ok) return c.json({ error: 'Invalid Google token' }, 401);
    const googleUser = await response.json();
    
    const email = googleUser.email;
    const googleId = googleUser.sub;
    const name = googleUser.name;
    const defaultUsername = email.split('@')[0] + Math.floor(Math.random() * 1000);

    let user = await c.env.DB.prepare('SELECT username, role, pro_status, account_status FROM users WHERE google_id = ? OR email = ?')
      .bind(googleId, email).first();

    if (!user) {
      // New Google User
      const userId = crypto.randomUUID();
      await c.env.DB.batch([
        c.env.DB.prepare("INSERT INTO users (id, username, email, google_id, password_hash, role, pro_status, account_status) VALUES (?, ?, ?, ?, 'oauth_user', 'user', 'none', 'active')")
          .bind(userId, defaultUsername, email, googleId),
        c.env.DB.prepare("INSERT INTO profiles (username, name, bio, background_type, background_value, font, button_style, button_color, button_text_color, button_border_color) VALUES (?, ?, ?, 'gradient', 'linear-gradient(135deg, #0f172a, #1e293b)', 'Inter', 'solid', '#3b82f6', '#ffffff', 'transparent')")
          .bind(defaultUsername, name, 'Welcome to my new link page!')
      ]);
      user = { username: defaultUsername, role: 'user', pro_status: 'none', account_status: 'active' };
    }

    if (user.account_status === 'suspended') {
      return c.json({ error: 'This account is suspended' }, 403);
    }

    return c.json({
      message: 'Login successful',
      user: { username: user.username, role: user.role, proStatus: user.pro_status }
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Google auth failed' }, 500);
  }
});

// --- PROFILES ---

// Check availability
app.get('/api/profile/check/:username', async (c) => {
  const cleanUsername = c.req.param('username').trim().toLowerCase();
  try {
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?')
      .bind(cleanUsername)
      .first();
    return c.json({ available: !user });
  } catch (err) {
    return c.json({ error: 'Error checking username' }, 500);
  }
});

// Get Public Profile
app.get('/api/profile/:username', async (c) => {
  const cleanUsername = c.req.param('username').trim().toLowerCase();

  try {
    let profileData = await c.env.DB.prepare(`
      SELECT p.*, u.account_status 
      FROM profiles p 
      JOIN users u ON p.username = u.username 
      WHERE p.username = ?
    `).bind(cleanUsername).first();

    if (!profileData) {
      // Check if user exists
      const user = await c.env.DB.prepare('SELECT account_status FROM users WHERE username = ?')
        .bind(cleanUsername)
        .first();

      if (user) {
        // User exists but has no profile, auto-create profile and default link
        await c.env.DB.batch([
          c.env.DB.prepare('INSERT INTO profiles (username, name, bio, avatar_url, background_type, background_value, font, button_style, button_color, button_text_color, button_border_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(
              cleanUsername,
              cleanUsername,
              'Welcome to my new link page!',
              '',
              'gradient',
              'linear-gradient(135deg, #0f172a, #1e293b)',
              'Inter',
              'solid',
              '#3b82f6',
              '#ffffff',
              'transparent'
            ),
          c.env.DB.prepare('INSERT INTO links (id, username, title, url, is_active, display_order) VALUES (?, ?, ?, ?, 1, 0)')
            .bind(crypto.randomUUID(), cleanUsername, '👋 Welcome to my Link Page!', 'https://google.com')
        ]);

        profileData = await c.env.DB.prepare(`
          SELECT p.*, u.account_status 
          FROM profiles p 
          JOIN users u ON p.username = u.username 
          WHERE p.username = ?
        `).bind(cleanUsername).first();
      } else {
        return c.json({ error: 'Profile not found' }, 404);
      }
    }
    
    if (profileData.account_status === 'suspended') {
      return c.json({ error: 'This profile has been suspended.', isSuspended: true }, 403);
    }
    
    const profile = profileData;

    // Get active links ordered by display_order
    const { results: links } = await c.env.DB.prepare('SELECT id, title, url, is_active, button_style, button_color, button_text_color, button_border_color, button_border_radius, show_url, image_url, icon_name, link_type, price, currency FROM links WHERE username = ? ORDER BY display_order ASC')
      .bind(cleanUsername)
      .all();

    // Map DB schema names to matches expected by client code
    const clientProfile = {
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      theme: {
        backgroundType: profile.background_type,
        backgroundValue: profile.background_value,
        font: profile.font,
        fontColor: profile.font_color,
        buttonStyle: profile.button_style,
        buttonColor: profile.button_color,
        buttonTextColor: profile.button_text_color,
        buttonBorderColor: profile.button_border_color
      },
      seo: {
        title: profile.seo_title,
        description: profile.seo_description,
        allowIndexing: Boolean(profile.allow_indexing !== 0)
      },
      links: links.map(l => ({
        id: l.id,
        title: l.title,
        url: l.url,
        active: Boolean(l.is_active),
        buttonStyle: l.button_style,
        buttonColor: l.button_color,
        buttonTextColor: l.button_text_color,
        buttonBorderColor: l.button_border_color,
        buttonBorderRadius: l.button_border_radius,
        showUrl: Boolean(l.show_url),
        imageUrl: l.image_url,
        iconName: l.icon_name,
        linkType: l.link_type,
        price: l.price,
        currency: l.currency
      })),
      googleAnalyticsId: profile.google_analytics_id
    };

    return c.json(clientProfile);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Error fetching profile' }, 500);
  }
});

// Update Profile
app.put('/api/profile/:username', async (c) => {
  const cleanUsername = c.req.param('username').trim().toLowerCase();
  const { name, bio, avatarUrl, theme, seo, links, googleAnalyticsId } = await c.req.json();

  try {
    // 1. Update profiles table
    await c.env.DB.prepare(`
      UPDATE profiles SET 
        name = COALESCE(?, name),
        bio = COALESCE(?, bio),
        avatar_url = COALESCE(?, avatar_url),
        background_type = COALESCE(?, background_type),
        background_value = COALESCE(?, background_value),
        font = COALESCE(?, font),
        font_color = COALESCE(?, font_color),
        button_style = COALESCE(?, button_style),
        button_color = COALESCE(?, button_color),
        button_text_color = COALESCE(?, button_text_color),
        button_border_color = COALESCE(?, button_border_color),
        seo_title = COALESCE(?, seo_title),
        seo_description = COALESCE(?, seo_description),
        allow_indexing = COALESCE(?, allow_indexing),
        google_analytics_id = COALESCE(?, google_analytics_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE username = ?
    `).bind(
      name,
      bio,
      avatarUrl,
      theme?.backgroundType,
      theme?.backgroundValue,
      theme?.font,
      theme?.fontColor,
      theme?.buttonStyle,
      theme?.buttonColor,
      theme?.buttonTextColor,
      theme?.buttonBorderColor,
      seo?.title,
      seo?.description,
      seo?.allowIndexing === false ? 0 : 1,
      googleAnalyticsId,
      cleanUsername
    ).run();

    // 2. Synchronize links table
    if (links && Array.isArray(links)) {
      // First, delete old links
      await c.env.DB.prepare('DELETE FROM links WHERE username = ?').bind(cleanUsername).run();
      
      // Then, batch insert new links preserving display_order
      if (links.length > 0) {
        const statements = links.map((link, idx) => {
          return c.env.DB.prepare('INSERT INTO links (id, username, title, url, is_active, display_order, button_style, button_color, button_text_color, button_border_color, button_border_radius, show_url, image_url, icon_name, link_type, price, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(
              link.id || crypto.randomUUID(), 
              cleanUsername, 
              link.title, 
              link.url, 
              link.active ? 1 : 0, 
              idx,
              link.buttonStyle || null,
              link.buttonColor || null,
              link.buttonTextColor || null,
              link.buttonBorderColor || null,
              link.buttonBorderRadius || null,
              link.showUrl ? 1 : 0,
              link.imageUrl || null,
              link.iconName || null,
              link.linkType || 'link',
              link.price || null,
              link.currency || 'USD'
            );
        });
        await c.env.DB.batch(statements);
      }
    }

    // Fetch updated profile
    const profile = await c.env.DB.prepare('SELECT * FROM profiles WHERE username = ?')
      .bind(cleanUsername)
      .first();

    const { results: dbLinks } = await c.env.DB.prepare('SELECT id, title, url, is_active, button_style, button_color, button_text_color, button_border_color, button_border_radius, show_url, image_url, icon_name, link_type, price, currency FROM links WHERE username = ? ORDER BY display_order ASC')
      .bind(cleanUsername)
      .all();

    const clientProfile = {
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      theme: {
        backgroundType: profile.background_type,
        backgroundValue: profile.background_value,
        font: profile.font,
        fontColor: profile.font_color,
        buttonStyle: profile.button_style,
        buttonColor: profile.button_color,
        buttonTextColor: profile.button_text_color,
        buttonBorderColor: profile.button_border_color
      },
      seo: {
        title: profile.seo_title,
        description: profile.seo_description,
        allowIndexing: Boolean(profile.allow_indexing !== 0)
      },
      links: dbLinks.map(l => ({
        id: l.id,
        title: l.title,
        url: l.url,
        active: Boolean(l.is_active),
        buttonStyle: l.button_style,
        buttonColor: l.button_color,
        buttonTextColor: l.button_text_color,
        buttonBorderColor: l.button_border_color,
        buttonBorderRadius: l.button_border_radius,
        showUrl: Boolean(l.show_url),
        imageUrl: l.image_url,
        iconName: l.icon_name,
        linkType: l.link_type,
        price: l.price,
        currency: l.currency
      })),
      googleAnalyticsId: profile.google_analytics_id
    };

    return c.json({
      message: 'Profile updated successfully',
      profile: clientProfile
    });

  } catch (err) {
    console.error(err);
    return c.json({ error: 'Error saving profile modifications' }, 500);
  }
});

// Change Username
app.post('/api/profile/:username/change-username', async (c) => {
  const currentUsername = c.req.param('username').trim().toLowerCase();
  const { newUsername } = await c.req.json();

  if (!newUsername) {
    return c.json({ error: 'New username is required' }, 400);
  }

  const cleanNewUsername = newUsername.trim().toLowerCase();
  if (cleanNewUsername.length < 4 || !/^[a-z0-9_]+$/.test(cleanNewUsername)) {
    return c.json({ error: 'Username must be at least 4 characters and contain only letters, numbers, and underscores' }, 400);
  }

  try {
    // 1. Check if new username is already taken
    const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?')
      .bind(cleanNewUsername)
      .first();

    if (existingUser) {
      return c.json({ error: 'Username is already taken' }, 409);
    }

    // 2. Perform transaction / batch update to update username across all tables
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE users SET username = ? WHERE username = ?').bind(cleanNewUsername, currentUsername),
      c.env.DB.prepare('UPDATE profiles SET username = ? WHERE username = ?').bind(cleanNewUsername, currentUsername),
      c.env.DB.prepare('UPDATE links SET username = ? WHERE username = ?').bind(cleanNewUsername, currentUsername),
      c.env.DB.prepare('UPDATE analytics_views SET username = ? WHERE username = ?').bind(cleanNewUsername, currentUsername),
      c.env.DB.prepare('UPDATE analytics_clicks SET username = ? WHERE username = ?').bind(cleanNewUsername, currentUsername),
      c.env.DB.prepare('UPDATE profile_reports SET reported_username = ? WHERE reported_username = ?').bind(cleanNewUsername, currentUsername)
    ]);

    return c.json({
      message: 'Username updated successfully',
      username: cleanNewUsername
    });

  } catch (err) {
    console.error(err);
    return c.json({ error: 'Failed to update username in database' }, 500);
  }
});

// Request Pro Status
app.post('/api/profile/:username/request-pro', async (c) => {
  const cleanUsername = c.req.param('username').trim().toLowerCase();
  try {
    await c.env.DB.prepare("UPDATE users SET pro_status = 'pending' WHERE username = ? AND pro_status = 'none'")
      .bind(cleanUsername)
      .run();
    return c.json({ message: 'Pro status requested' });
  } catch (err) {
    return c.json({ error: 'Error requesting pro' }, 500);
  }
});

// Report a profile
app.post('/api/report', async (c) => {
  const { reportedUsername, reason, reporterId } = await c.req.json();
  if (!reportedUsername || !reason) return c.json({ error: 'Missing fields' }, 400);

  try {
    await c.env.DB.prepare("INSERT INTO profile_reports (id, reported_username, reporter_id, reason, status) VALUES (?, ?, ?, ?, 'pending')")
      .bind(crypto.randomUUID(), reportedUsername, reporterId || null, reason)
      .run();
    return c.json({ message: 'Report submitted successfully' }, 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Failed to submit report' }, 500);
  }
});

// --- ADMIN ROUTES ---

// Get all users
app.get('/api/admin/users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT id, username, email, role, pro_status, account_status, created_at FROM users ORDER BY created_at DESC").all();
    return c.json(results);
  } catch (err) {
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Approve/Reject Pro
app.post('/api/admin/approve-pro/:username', async (c) => {
  const cleanUsername = c.req.param('username').trim().toLowerCase();
  const { status } = await c.req.json(); // 'approved' or 'none'
  try {
    await c.env.DB.prepare("UPDATE users SET pro_status = ? WHERE username = ?")
      .bind(status, cleanUsername)
      .run();
    return c.json({ message: `Pro status updated to ${status}` });
  } catch (err) {
    return c.json({ error: 'Failed to update pro status' }, 500);
  }
});

// Suspend user
app.post('/api/admin/suspend-user/:username', async (c) => {
  const cleanUsername = c.req.param('username').trim().toLowerCase();
  const { status, reason } = await c.req.json(); // 'active' or 'suspended'
  try {
    await c.env.DB.prepare("UPDATE users SET account_status = ?, suspension_reason = ? WHERE username = ?")
      .bind(status, reason || null, cleanUsername)
      .run();
    return c.json({ message: `Account status updated to ${status}` });
  } catch (err) {
    return c.json({ error: 'Failed to update account status' }, 500);
  }
});

// Get reports
app.get('/api/admin/reports', async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM profile_reports ORDER BY created_at DESC").all();
    return c.json(results);
  } catch (err) {
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

// Update report status
app.post('/api/admin/reports/:id', async (c) => {
  const { status } = await c.req.json();
  try {
    await c.env.DB.prepare("UPDATE profile_reports SET status = ? WHERE id = ?")
      .bind(status, c.req.param('id'))
      .run();
    return c.json({ message: 'Report updated' });
  } catch (err) {
    return c.json({ error: 'Failed to update report' }, 500);
  }
});


// --- ANALYTICS AND TRACKING ---

// View Page hit
app.post('/api/analytics/view/:username', async (c) => {
  const cleanUsername = c.req.param('username').trim().toLowerCase();
  const { referrer } = await c.req.json();

  const userAgent = c.req.header('user-agent') || 'Unknown';
  const country = c.req.header('cf-ipcountry') || 'Unknown';

  try {
    await c.env.DB.prepare('INSERT INTO analytics_views (id, username, referrer, user_agent, country) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), cleanUsername, referrer || 'Direct', userAgent, country)
      .run();
    return c.json({ message: 'View logged' }, 201);
  } catch (err) {
    return c.json({ error: 'Error logging view' }, 500);
  }
});

// Click Link hit
app.post('/api/analytics/click/:username', async (c) => {
  const cleanUsername = c.req.param('username').trim().toLowerCase();
  const { linkId } = await c.req.json();
  const userAgent = c.req.header('user-agent') || 'Unknown';

  if (!linkId) return c.json({ error: 'linkId required' }, 400);

  try {
    await c.env.DB.prepare('INSERT INTO analytics_clicks (id, username, link_id, user_agent) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), cleanUsername, linkId, userAgent)
      .run();
    return c.json({ message: 'Click logged' }, 201);
  } catch (err) {
    return c.json({ error: 'Error logging click' }, 500);
  }
});

// Retrieve Analytics Reports
app.get('/api/analytics/report/:username', async (c) => {
  const cleanUsername = c.req.param('username').trim().toLowerCase();

  try {
    // 1. Fetch Views
    const { results: views } = await c.env.DB.prepare('SELECT timestamp, referrer, country FROM analytics_views WHERE username = ?')
      .bind(cleanUsername)
      .all();

    // 2. Fetch Clicks
    const { results: clicks } = await c.env.DB.prepare('SELECT timestamp, link_id FROM analytics_clicks WHERE username = ?')
      .bind(cleanUsername)
      .all();

    // 3. Fetch Links to map click counts
    const { results: dbLinks } = await c.env.DB.prepare('SELECT id, title, url FROM links WHERE username = ?')
      .bind(cleanUsername)
      .all();

    const totalViews = views.length;
    const totalClicks = clicks.length;
    const ctr = totalViews > 0 ? parseFloat(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

    // Referrers breakdown
    const referrers = {};
    views.forEach(v => {
      const ref = v.referrer || 'Direct';
      referrers[ref] = (referrers[ref] || 0) + 1;
    });

    const referralData = Object.entries(referrers).map(([source, count]) => ({
      source,
      count,
      percentage: totalViews > 0 ? parseFloat(((count / totalViews) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.count - a.count);

    // Clicks per link mapping
    const linksMap = {};
    dbLinks.forEach(l => {
      linksMap[l.id] = { title: l.title, url: l.url, clicks: 0 };
    });

    clicks.forEach(c => {
      if (linksMap[c.link_id]) {
        linksMap[c.link_id].clicks += 1;
      }
    });

    const linkPerformance = Object.entries(linksMap).map(([id, info]) => ({
      id,
      title: info.title,
      url: info.url,
      clicks: info.clicks,
      ctr: totalViews > 0 ? parseFloat(((info.clicks / totalViews) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.clicks - a.clicks);

    // Timeline structures
    const timelineViews = views.map(v => ({ timestamp: new Date(v.timestamp).toISOString() }));
    const timelineClicks = clicks.map(c => ({ timestamp: new Date(c.timestamp).toISOString(), linkId: c.link_id }));

    return c.json({
      metrics: { totalViews, totalClicks, ctr },
      referralData,
      linkPerformance,
      timeline: {
        views: timelineViews,
        clicks: timelineClicks
      }
    });

  } catch (err) {
    console.error(err);
    return c.json({ error: 'Database analytical aggregation error' }, 500);
  }
});


// --- R2 BUCKET FILE MANAGEMENT ---

// Upload image to R2
app.post('/api/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file; // Expecting multipart field named 'file'
    const username = body.username; // To organize by user

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No valid image file uploaded' }, 400);
    }

    const extension = file.name.split('.').pop();
    const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.'));
    const sanitizedBaseName = originalBaseName.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_');
    const safeName = `${sanitizedBaseName}.${extension}`;

    let filePath = `Assets/${safeName}`;

    if (username) {
      // Get user premium info from DB
      const user = await c.env.DB.prepare('SELECT pro_status FROM users WHERE username = ?')
        .bind(username.trim().toLowerCase())
        .first();

      const isPro = user && user.pro_status === 'approved';
      const limit = isPro ? 100 * 1024 * 1024 : 15 * 1024 * 1024;
      const limitStr = isPro ? '100MB' : '15MB';

      // Sum user's current storage space in D1
      const sizeResult = await c.env.DB.prepare('SELECT SUM(size) as totalSize FROM user_media WHERE username = ?')
        .bind(username.trim().toLowerCase())
        .first();
      let totalSize = sizeResult?.totalSize || 0;

      // Adjust size if overwriting an existing file under the same name
      filePath = `User/${username}/${safeName}`;
      const existingFile = await c.env.DB.prepare('SELECT id, size FROM user_media WHERE file_key = ?')
        .bind(filePath)
        .first();
      
      if (existingFile) {
        totalSize -= existingFile.size;
      }

      if (totalSize + file.size > limit) {
        return c.json({ 
          error: `Storage limit exceeded. Your account limit is ${limitStr}. Current usage is ${(totalSize / (1024 * 1024)).toFixed(2)}MB. Uploading this file (${(file.size / (1024 * 1024)).toFixed(2)}MB) would exceed the limit. Please upgrade to Pro to unlock up to 100MB of storage.` 
        }, 400);
      }
    }
    
    // Put file buffer to Cloudflare R2 bucket
    const buffer = await file.arrayBuffer();
    await c.env.BUCKET.put(filePath, buffer, {
      httpMetadata: { contentType: file.type }
    });

    // Save or update in D1 database
    if (username) {
      // Re-query existing file just in case it wasn't queried above
      const existingDbFile = await c.env.DB.prepare('SELECT id FROM user_media WHERE file_key = ?').bind(filePath).first();
      const dbId = existingDbFile ? existingDbFile.id : crypto.randomUUID();
      
      if (existingDbFile) {
        await c.env.DB.prepare('UPDATE user_media SET size = ?, content_type = ?, uploaded_at = CURRENT_TIMESTAMP WHERE id = ?')
          .bind(file.size, file.type, dbId).run();
      } else {
        await c.env.DB.prepare('INSERT INTO user_media (id, username, file_key, size, content_type) VALUES (?, ?, ?, ?, ?)')
          .bind(dbId, username.trim().toLowerCase(), filePath, file.size, file.type).run();
      }
    }

    return c.json({ url: `/images/${filePath}` });

  } catch (err) {
    console.error(err);
    return c.json({ error: 'Failed to upload image file to bucket storage' }, 500);
  }
});

// List User Media
app.get('/api/media/:username', async (c) => {
  const username = c.req.param('username');
  try {
    // Get files from D1
    const { results } = await c.env.DB.prepare('SELECT * FROM user_media WHERE username = ? ORDER BY uploaded_at DESC')
      .bind(username.trim().toLowerCase())
      .all();
    
    const files = results.map(row => ({
      key: row.file_key,
      url: `/images/${row.file_key}`,
      size: row.size,
      uploaded: row.uploaded_at
    }));

    return c.json({ files });
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Failed to list media' }, 500);
  }
});

// Delete User Media
app.delete('/api/media/:username/:filename', async (c) => {
  const username = c.req.param('username');
  const filename = c.req.param('filename');
  try {
    const key = `User/${username}/${filename}`;
    
    // Delete from D1 database
    await c.env.DB.prepare('DELETE FROM user_media WHERE file_key = ? AND username = ?')
      .bind(key, username.trim().toLowerCase())
      .run();
      
    // Delete from R2 Bucket
    await c.env.BUCKET.delete(key);
    
    return c.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Failed to delete media' }, 500);
  }
});

// Serve image from R2 (supports nested paths like /images/User/creator/xyz.jpg)
app.get('/images/*', async (c) => {
  const pathStart = c.req.url.indexOf('/images/') + 8;
  const filePath = c.req.url.substring(pathStart);
  
  if (!filePath) return c.text('Image not found', 404);
  
  try {
    const object = await c.env.BUCKET.get(filePath);
    if (!object) {
      return c.text('Image not found', 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1 Year cache control

    return new Response(object.body, { headers });
  } catch (err) {
    return c.text('Error retrieving file', 500);
  }
});

// --- SPA FALLBACK & SEO INJECTION ---

// Helper: read the base index.html from the ASSETS binding
async function getIndexHtml(c) {
  const url = new URL(c.req.url);
  url.pathname = '/index.html';
  const asset = await c.env.ASSETS.fetch(new Request(url.toString()));
  if (!asset.ok) {
    throw new Error(`ASSETS fetch failed with status: ${asset.status}`);
  }
  return await asset.text();
}

// Helper: escape HTML entities for safe injection into meta tags
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// SEO-aware route for public profiles: /@username
app.get('/@:username', async (c) => {
  const username = c.req.param('username').trim().toLowerCase();
  const requestUrl = new URL(c.req.url);
  const origin = requestUrl.origin;

  try {
    let html = await getIndexHtml(c);

    // Fetch profile data for SEO injection
    const profileData = await c.env.DB.prepare(`
      SELECT p.name, p.bio, p.avatar_url, p.seo_title, p.seo_description, p.allow_indexing
      FROM profiles p
      JOIN users u ON p.username = u.username
      WHERE p.username = ? AND u.account_status = 'active'
    `).bind(username).first();

    if (profileData) {
      const seoTitle = escapeHtml(profileData.seo_title || `${profileData.name} | AuraLink`);
      const seoDesc = escapeHtml(profileData.seo_description || profileData.bio || `Check out ${profileData.name}'s links on AuraLink`);
      const avatarUrl = profileData.avatar_url ? `${origin}${profileData.avatar_url}` : `${origin}/src/favicon.svg`;
      const canonicalUrl = `${origin}/@${username}`;
      const robotsMeta = profileData.allow_indexing === 0 ? `<meta name="robots" content="noindex, nofollow" />` : '';

      const seoTags = `
    <!-- SEO: Dynamic meta tags injected by server -->
    <meta name="description" content="${seoDesc}" />
    ${robotsMeta}
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph -->
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="${seoTitle}" />
    <meta property="og:description" content="${seoDesc}" />
    <meta property="og:image" content="${escapeHtml(avatarUrl)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:site_name" content="AuraLink" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${seoTitle}" />
    <meta name="twitter:description" content="${seoDesc}" />
    <meta name="twitter:image" content="${escapeHtml(avatarUrl)}" />
    `;

      // Inject SEO tags into <head> and replace <title>
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${seoTitle}</title>`);
      html = html.replace('</head>', `${seoTags}\n  </head>`);
    }
    // If profile not found, serve plain index.html — React will show a 404 UI

    return c.html(html);
  } catch (err) {
    console.error('SSR meta injection error:', err);
    // Fallback: serve plain index.html
    try {
      const html = await getIndexHtml(c);
      return c.html(html);
    } catch (fallbackErr) {
      return c.text('Server Error', 500);
    }
  }
});

// SPA fallback: serve index.html for all other non-API, non-asset routes
app.get('*', async (c) => {
  const path = new URL(c.req.url).pathname;

  // Skip API and image routes (already handled above)
  if (path.startsWith('/api/') || path.startsWith('/images/')) {
    return c.notFound();
  }

  // Skip requests for static assets (files with extensions like .js, .css, .png, etc.)
  if (path.includes('.') && !path.endsWith('/')) {
    try {
      const asset = await c.env.ASSETS.fetch(new Request(c.req.url, c.req.raw));
      if (asset && asset.status < 400) {
        return new Response(asset.body, asset);
      }
    } catch (e) {
      // Ignore and let it fall through to 404
    }
    return c.notFound();
  }

  try {
    const html = await getIndexHtml(c);
    return c.html(html);
  } catch (err) {
    return c.text('Server Error', 500);
  }
});

export default app;
