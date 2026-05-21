import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

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
  if (cleanUsername.length < 3 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
    return c.json({ error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores' }, 400);
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
    
    // Insert user and default profile inside a D1 batch transaction (or sequential runs)
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO users (id, username, password_hash, is_premium) VALUES (?, ?, ?, 0)')
        .bind(userId, cleanUsername, password),
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
      user: { username: cleanUsername, isPremium: false }
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
    const user = await c.env.DB.prepare('SELECT username, password_hash, is_premium FROM users WHERE username = ?')
      .bind(cleanUsername)
      .first();

    if (!user || user.password_hash !== password) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    return c.json({
      message: 'Login successful',
      user: { username: user.username, isPremium: Boolean(user.is_premium) }
    });
  } catch (err) {
    return c.json({ error: 'Database query error' }, 500);
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
    const profile = await c.env.DB.prepare('SELECT * FROM profiles WHERE username = ?')
      .bind(cleanUsername)
      .first();

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

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

// Toggle Premium Helper
app.post('/api/profile/:username/toggle-premium', async (c) => {
  const cleanUsername = c.req.param('username').trim().toLowerCase();

  try {
    const user = await c.env.DB.prepare('SELECT is_premium FROM users WHERE username = ?')
      .bind(cleanUsername)
      .first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const nextPremiumStatus = user.is_premium === 1 ? 0 : 1;
    await c.env.DB.prepare('UPDATE users SET is_premium = ? WHERE username = ?')
      .bind(nextPremiumStatus, cleanUsername)
      .run();

    return c.json({ message: 'Premium status updated', isPremium: Boolean(nextPremiumStatus) });
  } catch (err) {
    return c.json({ error: 'Error toggling premium status' }, 500);
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

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No valid image file uploaded' }, 400);
    }

    const extension = file.name.split('.').pop();
    const uniqueName = `${crypto.randomUUID()}.${extension}`;
    
    // Put file buffer to Cloudflare R2 bucket
    const buffer = await file.arrayBuffer();
    await c.env.BUCKET.put(uniqueName, buffer, {
      httpMetadata: { contentType: file.type }
    });

    return c.json({ url: `/images/${uniqueName}` });

  } catch (err) {
    console.error(err);
    return c.json({ error: 'Failed to upload image file to bucket storage' }, 500);
  }
});

// Serve image from R2
app.get('/images/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  try {
    const object = await c.env.BUCKET.get(filename);
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

export default app;
