import React, { useState, useEffect } from 'react';
import { 
  Link2, BarChart3, Palette, User, Plus, Trash2, Save, 
  ExternalLink, LogOut, RefreshCw, Eye, Sparkles, Check, ChevronRight 
} from 'lucide-react';

const API_BASE = '/api';

export default function CreatorDashboard({ username, onLogout }) {
  const [activeTab, setActiveTab] = useState('links'); // 'links', 'design', 'analytics'
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  
  // Link form states
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [expandedLinkId, setExpandedLinkId] = useState(null);

  const handleUpdateLinkStyle = (linkId, key, value) => {
    const updatedLinks = profile.links.map(l => {
      if (l.id === linkId) {
        return { ...l, [key]: value };
      }
      return l;
    });
    const updatedProfile = { ...profile, links: updatedLinks };
    setProfile(updatedProfile);
    handleSave(updatedProfile);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingAvatar(true);
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const updatedProfile = { ...profile, avatarUrl: data.url };
        setProfile(updatedProfile);
        handleSave(updatedProfile);
      } else {
        alert('Upload failed. Make sure your file is a valid image under 5MB.');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Fetch profile & analytics
  const fetchData = async () => {
    try {
      setLoading(true);
      const profRes = await fetch(`${API_BASE}/profile/${username}`);
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
      }
      
      const analRes = await fetch(`${API_BASE}/analytics/report/${username}`);
      if (analRes.ok) {
        const analData = await analRes.json();
        setAnalytics(analData);
      }
      
      // Get user premium info from localStorage (simulated session)
      const cachedUser = localStorage.getItem('auralink_user');
      if (cachedUser) {
        const userObj = JSON.parse(cachedUser);
        setIsPremium(userObj.isPremium);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [username]);

  // Save changes to backend
  const handleSave = async (updatedProfile = profile) => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/profile/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  // Add Link
  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newLinkItem = {
      id: `link-${Date.now()}`,
      title: newTitle.trim(),
      url: formattedUrl,
      active: true
    };

    const updatedProfile = {
      ...profile,
      links: [...profile.links, newLinkItem]
    };

    setProfile(updatedProfile);
    setNewTitle('');
    setNewUrl('');
    handleSave(updatedProfile);
  };

  // Delete Link
  const handleDeleteLink = (id) => {
    const updatedLinks = profile.links.filter(l => l.id !== id);
    const updatedProfile = { ...profile, links: updatedLinks };
    setProfile(updatedProfile);
    handleSave(updatedProfile);
  };

  // Toggle Link Active Status
  const handleToggleLink = (id) => {
    const updatedLinks = profile.links.map(l => {
      if (l.id === id) {
        return { ...l, active: !l.active };
      }
      return l;
    });
    const updatedProfile = { ...profile, links: updatedLinks };
    setProfile(updatedProfile);
    handleSave(updatedProfile);
  };

  // Edit Link detail
  const handleEditLinkText = (id, field, value) => {
    const updatedLinks = profile.links.map(l => {
      if (l.id === id) {
        return { ...l, [field]: value };
      }
      return l;
    });
    setProfile({ ...profile, links: updatedLinks });
  };

  // Theme updates
  const handleUpdateTheme = (key, value) => {
    const updatedProfile = {
      ...profile,
      theme: {
        ...profile.theme,
        [key]: value
      }
    };
    setProfile(updatedProfile);
    handleSave(updatedProfile);
  };

  // Toggle Premium simulated helper
  const handleTogglePremium = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile/${username}/toggle-premium`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsPremium(data.isPremium);
        // update local cached user
        const cachedUser = localStorage.getItem('auralink_user');
        if (cachedUser) {
          const userObj = JSON.parse(cachedUser);
          userObj.isPremium = data.isPremium;
          localStorage.setItem('auralink_user', JSON.stringify(userObj));
        }
      }
    } catch (err) {
      console.error('Error toggling premium status:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={24} />
        <span>Loading your AuraLink dashboard...</span>
      </div>
    );
  }

  // Pre-made Theme Presets
  const themePresets = [
    {
      name: 'Midnight Ink',
      type: 'gradient',
      value: 'linear-gradient(135deg, #0f172a, #1e293b)',
      btnStyle: 'solid',
      btnColor: '#3b82f6',
      textColor: '#ffffff',
      premium: false
    },
    {
      name: 'Plum Nebula',
      type: 'gradient',
      value: 'linear-gradient(135deg, #1e1b4b, #311042)',
      btnStyle: 'glassmorphic',
      btnColor: 'rgba(255, 255, 255, 0.1)',
      textColor: '#ffffff',
      premium: true
    },
    {
      name: 'Cyber Neon',
      type: 'flat',
      value: '#05050a',
      btnStyle: 'neon',
      btnColor: '#39ff14',
      textColor: '#39ff14',
      premium: true
    },
    {
      name: 'Soft Rose',
      type: 'gradient',
      value: 'linear-gradient(135deg, #fdf2f8, #fbcfe8)',
      btnStyle: 'pastel',
      btnColor: '#ec4899',
      textColor: '#4c0519',
      premium: true
    },
    {
      name: 'Forest Dream',
      type: 'gradient',
      value: 'linear-gradient(135deg, #022c22, #064e3b)',
      btnStyle: 'outline',
      btnColor: '#34d399',
      textColor: '#34d399',
      premium: false
    },
    {
      name: 'Ocean Spray',
      type: 'gradient',
      value: 'linear-gradient(135deg, #0f172a, #0284c7)',
      btnStyle: 'pill',
      btnColor: '#38bdf8',
      textColor: '#ffffff',
      premium: false
    },
    {
      name: 'Sunset Glow',
      type: 'gradient',
      value: 'linear-gradient(135deg, #451a03, #b45309)',
      btnStyle: 'solid',
      btnColor: '#f59e0b',
      textColor: '#ffffff',
      premium: false
    },
    {
      name: 'Lavender Mist',
      type: 'gradient',
      value: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
      btnStyle: 'soft',
      btnColor: 'rgba(79, 70, 229, 0.1)',
      textColor: '#4f46e5',
      premium: false
    },
    {
      name: 'Carbon & Gold',
      type: 'gradient',
      value: 'linear-gradient(135deg, #111111, #222222)',
      btnStyle: 'outline',
      btnColor: '#fbbf24',
      textColor: '#fbbf24',
      premium: true
    },
    {
      name: 'Matcha Latte',
      type: 'gradient',
      value: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      btnStyle: 'soft',
      btnColor: 'rgba(22, 101, 52, 0.08)',
      textColor: '#166534',
      premium: false
    },
    {
      name: 'Tangerine Breeze',
      type: 'gradient',
      value: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
      btnStyle: 'solid',
      btnColor: '#ea580c',
      textColor: '#ffffff',
      premium: true
    },
    {
      name: 'Minimal Slate',
      type: 'flat',
      value: '#f8fafc',
      btnStyle: 'solid',
      btnColor: '#0f172a',
      textColor: '#ffffff',
      premium: false
    },
    {
      name: 'Sakura Glass',
      type: 'gradient',
      value: 'linear-gradient(135deg, #3b0764, #f472b6)',
      btnStyle: 'glassmorphic',
      btnColor: 'rgba(255, 255, 255, 0.15)',
      textColor: '#ffffff',
      premium: true
    },
    {
      name: 'Retro Mint',
      type: 'flat',
      value: '#e6fffa',
      btnStyle: 'shadow',
      btnColor: '#319795',
      textColor: '#ffffff',
      premium: true
    },
    {
      name: 'Electric Violet',
      type: 'gradient',
      value: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
      btnStyle: 'neon',
      btnColor: '#a78bfa',
      textColor: '#ffffff',
      premium: true
    },
    {
      name: 'Warm Terracotta',
      type: 'gradient',
      value: 'linear-gradient(135deg, #2e1007, #7c2d12)',
      btnStyle: 'dashed',
      btnColor: '#ea580c',
      textColor: '#ffedd5',
      premium: false
    }
  ];

  return (
    <div className="app-container">
      <div className="dashboard-layout">
        
        {/* Sidebar Nav */}
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="nav-brand" style={{ padding: '0 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
              <Link2 size={24} />
              <span>AuraLink</span>
            </div>
            
            <nav className="sidebar-menu">
              <button 
                onClick={() => setActiveTab('links')}
                className={`sidebar-item ${activeTab === 'links' ? 'active' : ''}`}
              >
                <User size={18} />
                <span>Page Profile</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('design')}
                className={`sidebar-item ${activeTab === 'design' ? 'active' : ''}`}
              >
                <Palette size={18} />
                <span>Theme Design</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
              >
                <BarChart3 size={18} />
                <span>Analytics</span>
              </button>
            </nav>
          </div>
          
          <div className="sidebar-bottom">
            <div className="sidebar-item" onClick={handleTogglePremium} style={{ color: isPremium ? 'var(--success)' : 'var(--warning)', cursor: 'pointer', marginBottom: '1rem', border: '1px dashed var(--border-light)' }}>
              <Sparkles size={16} />
              <span>{isPremium ? 'Premium Active' : 'Upgrade to Pro'}</span>
            </div>
            
            <div className="sidebar-user">
              <div className="user-info">
                <span className="username">@{username}</span>
                <span className="plan-badge">{isPremium ? 'PRO' : 'FREE'}</span>
              </div>
              <button onClick={onLogout} className="btn-text" title="Log Out">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="workspace-content">
          <div className="splitscreen">
            
            {/* Left: Editor form */}
            <div className="editor-pane">
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem' }}>Creator Dashboard</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Live URL: <a href={`#p/${username}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: '500', textDecoration: 'underline' }}>
                      {window.location.origin}/#p/{username} <ExternalLink size={12} style={{ display: 'inline' }} />
                    </a>
                  </p>
                </div>
                <div>
                  <button 
                    onClick={() => handleSave()} 
                    disabled={saving} 
                    className="btn btn-primary"
                  >
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Page'}
                  </button>
                </div>
              </div>

              {/* TABS */}
              {activeTab === 'links' && (
                <>
                  {/* Profile Info */}
                  <section className="editor-card">
                    <h2 className="card-title"><User size={18} /> Profile Bio Details</h2>
                    
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Avatar Photo (Upload to Cloudflare R2)</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.4rem' }}>
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="Avatar Preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-light)' }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px dashed var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Pic</div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          style={{ display: 'none' }}
                          id="avatar-file-input"
                        />
                        <label htmlFor="avatar-file-input" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', margin: 0, cursor: 'pointer' }}>
                          {uploadingAvatar ? 'Uploading...' : 'Choose Image'}
                        </label>
                        {profile.avatarUrl && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const updatedProfile = { ...profile, avatarUrl: '' };
                              setProfile(updatedProfile);
                              handleSave(updatedProfile);
                            }}
                            className="btn-text" 
                            style={{ color: 'var(--danger)', fontSize: '0.8rem' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Display Name</label>
                      <input 
                        type="text" 
                        value={profile.name} 
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="input-control" 
                        placeholder="Alex Rivers"
                        maxLength={40}
                      />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Google Analytics Measurement ID (gtag.js)</label>
                      <input 
                        type="text" 
                        value={profile.googleAnalyticsId || ''} 
                        onChange={(e) => setProfile({ ...profile, googleAnalyticsId: e.target.value })}
                        onBlur={() => handleSave()}
                        className="input-control" 
                        placeholder="e.g. G-XXXXXXXXXX"
                        maxLength={20}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Short Biography</label>
                      <textarea 
                        value={profile.bio} 
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        className="input-control" 
                        placeholder="Share a short bio (social handles, products, info...)"
                        rows={3}
                        maxLength={180}
                        style={{ resize: 'none' }}
                      />
                    </div>
                  </section>

                  {/* Add New Link */}
                  <section className="editor-card">
                    <h2 className="card-title"><Plus size={18} /> Add New Link</h2>
                    <form onSubmit={handleAddLink} style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                      <div className="form-group">
                        <label>Link Display Title</label>
                        <input 
                          type="text" 
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="input-control" 
                          placeholder="e.g. 🛍️ Visit My Storefront"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Target URL</label>
                        <input 
                          type="text" 
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          className="input-control" 
                          placeholder="e.g. https://my-affiliate-shop.com/discount"
                          required
                        />
                      </div>
                      
                      <button type="submit" className="btn btn-secondary" style={{ width: 'fit-content' }}>
                        <Plus size={16} /> Add to List
                      </button>
                    </form>
                  </section>

                  {/* Active Links List */}
                  <section className="editor-card">
                    <h2 className="card-title"><Link2 size={18} /> Manage Active Links</h2>
                    
                    {profile.links.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                        No links added yet. Use the form above to add your first link!
                      </p>
                    ) : (
                      <div className="links-list">
                        {profile.links.map((link) => (
                          <div key={link.id} className="link-editor-item">
                            <div className="link-item-header">
                              <span className="link-drag-handle">🔗 Link Edit</span>
                              <div className="link-actions">
                                <label className="switch">
                                  <input 
                                    type="checkbox" 
                                    checked={link.active}
                                    onChange={() => handleToggleLink(link.id)} 
                                  />
                                  <span className="slider"></span>
                                </label>
                                <button 
                                  onClick={() => handleDeleteLink(link.id)} 
                                  className="btn-text" 
                                  style={{ color: 'var(--danger)', padding: '0.2rem' }}
                                  title="Delete Link"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '0.75rem' }}>
                              <input 
                                type="text" 
                                value={link.title}
                                onChange={(e) => handleEditLinkText(link.id, 'title', e.target.value)}
                                onBlur={() => handleSave()}
                                className="input-control" 
                                style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                                placeholder="Title"
                              />
                              <input 
                                type="text" 
                                value={link.url}
                                onChange={(e) => handleEditLinkText(link.id, 'url', e.target.value)}
                                onBlur={() => handleSave()}
                                className="input-control" 
                                style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                                placeholder="URL"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}

              {activeTab === 'design' && (
                <>
                  {/* Theme Presets */}
                  <section className="editor-card">
                    <h2 className="card-title"><Palette size={18} /> Designer Theme Presets</h2>
                    <div className="themes-grid">
                      {themePresets.map((preset, idx) => {
                        const isSelected = profile.theme.backgroundValue === preset.value && profile.theme.buttonStyle === preset.btnStyle;
                        const isLocked = preset.premium && !isPremium;
                        
                        return (
                          <div 
                            key={idx} 
                            onClick={() => {
                              if (isLocked) {
                                alert('This is a Pro Theme! Click the Upgrade button on the left sidebar to unlock.');
                                return;
                              }
                              const updatedProfile = {
                                ...profile,
                                theme: {
                                  backgroundType: preset.type,
                                  backgroundValue: preset.value,
                                  buttonStyle: preset.btnStyle,
                                  buttonColor: preset.btnColor,
                                  buttonTextColor: preset.textColor,
                                  buttonBorderColor: preset.btnStyle === 'glassmorphic' ? 'rgba(255,255,255,0.2)' : 'transparent'
                                }
                              };
                              setProfile(updatedProfile);
                              handleSave(updatedProfile);
                            }}
                            className={`theme-option ${isSelected ? 'active' : ''}`}
                            style={{ position: 'relative' }}
                          >
                            {isLocked && (
                              <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', padding: '0.15rem', borderRadius: '50%' }}>
                                🔒
                              </div>
                            )}
                            <div 
                              className="theme-preview-dot" 
                              style={{ background: preset.value }}
                            ></div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{preset.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Manual Editor */}
                  <section className="editor-card">
                    <h2 className="card-title"><Palette size={18} /> Typography & Buttons</h2>
                    
                    {/* Font selection */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Font Styling</label>
                      <select 
                        value={profile.theme.font || 'Inter'} 
                        onChange={(e) => handleUpdateTheme('font', e.target.value)}
                        className="input-control"
                      >
                        <option value="Inter">Inter (Clean Sans)</option>
                        <option value="Outfit">Outfit (Display Bold)</option>
                        <option value="Georgia">Georgia (Serif)</option>
                        <option value="monospace">Courier New (Monospace)</option>
                      </select>
                    </div>

                    {/* Button style selection */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Button Border Style</label>
                      <select 
                        value={profile.theme.buttonStyle || 'solid'} 
                        onChange={(e) => {
                          const val = e.target.value;
                          let btnCol = profile.theme.buttonColor;
                          let textCol = profile.theme.buttonTextColor;
                          let borderCol = 'transparent';

                          if (val === 'glassmorphic') {
                            btnCol = 'rgba(255, 255, 255, 0.08)';
                            textCol = '#ffffff';
                            borderCol = 'rgba(255, 255, 255, 0.2)';
                          } else if (val === 'neon') {
                            btnCol = '#000000';
                            textCol = '#39ff14';
                            borderCol = '#39ff14';
                          }

                          const updatedProfile = {
                            ...profile,
                            theme: {
                              ...profile.theme,
                              buttonStyle: val,
                              buttonColor: btnCol,
                              buttonTextColor: textCol,
                              buttonBorderColor: borderCol
                            }
                          };
                          setProfile(updatedProfile);
                          handleSave(updatedProfile);
                        }}
                        className="input-control"
                      >
                        <option value="solid">Solid Background</option>
                        <option value="outline">Outline Border</option>
                        <option value="glassmorphic">Glassmorphic Glow</option>
                        {isPremium && <option value="neon">Neon Digital</option>}
                        {isPremium && <option value="pastel">Rounded Pastel</option>}
                      </select>
                    </div>

                    {/* Background Picker */}
                    <div className="form-group">
                      <label>Custom Page Color</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="color" 
                          value={profile.theme.backgroundType === 'flat' ? profile.theme.backgroundValue : '#0f172a'}
                          onChange={(e) => {
                            const updatedProfile = {
                              ...profile,
                              theme: {
                                ...profile.theme,
                                backgroundType: 'flat',
                                backgroundValue: e.target.value
                              }
                            };
                            setProfile(updatedProfile);
                            handleSave(updatedProfile);
                          }}
                          style={{ width: '40px', height: '40px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click to pick solid hex color</span>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'analytics' && (
                <>
                  {analytics ? (
                    <>
                      {/* Metric Summary Cards */}
                      <div className="analytics-grid">
                        <div className="stat-card">
                          <div className="stat-icon"><Eye size={20} /></div>
                          <div className="stat-info">
                            <span className="stat-label">Page Views</span>
                            <span className="stat-value">{analytics.metrics.totalViews}</span>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon"><Link2 size={20} /></div>
                          <div className="stat-info">
                            <span className="stat-label">Link Clicks</span>
                            <span className="stat-value">{analytics.metrics.totalClicks}</span>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon" style={{ color: 'var(--accent-secondary)', backgroundColor: 'rgba(236,72,153,0.1)' }}><BarChart3 size={20} /></div>
                          <div className="stat-info">
                            <span className="stat-label">CTR Average</span>
                            <span className="stat-value">{analytics.metrics.ctr}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Charts Grid */}
                      <div className="charts-row">
                        {/* Traffic Timeline Chart (HTML simulated bar-chart) */}
                        <div className="chart-card">
                          <div className="chart-header">
                            <h3>Analytics Performance Timeline</h3>
                            <div className="chart-legend">
                              <div className="legend-item"><div className="legend-color views"></div><span>Views</span></div>
                              <div className="legend-item"><div className="legend-color clicks"></div><span>Clicks</span></div>
                            </div>
                          </div>
                          <div className="chart-body">
                            {/* Simple simulated timeline grouping past 5 hours */}
                            <div className="chart-axis-y">
                              <span>10</span>
                              <span>5</span>
                              <span>0</span>
                            </div>
                            <div className="chart-bars-container">
                              {[
                                { hour: '10:00', views: 3, clicks: 1 },
                                { hour: '11:00', views: 4, clicks: 2 },
                                { hour: '12:00', views: 6, clicks: 3 },
                                { hour: '13:00', views: 8, clicks: 4 },
                                { hour: '14:00 (Now)', views: analytics.metrics.totalViews || 1, clicks: analytics.metrics.totalClicks || 0 }
                              ].map((bar, i) => {
                                const maxVal = 10;
                                const viewsHeight = `${Math.min((bar.views / maxVal) * 100, 100)}%`;
                                const clicksHeight = `${Math.min((bar.clicks / maxVal) * 100, 100)}%`;

                                return (
                                  <div key={i} className="chart-bar-wrapper">
                                    <div className="chart-bar-group">
                                      <div className="chart-bar-views" style={{ height: viewsHeight }}>
                                        <div className="bar-tooltip">Views: {bar.views}</div>
                                      </div>
                                      <div className="chart-bar-clicks" style={{ height: clicksHeight }}>
                                        <div className="bar-tooltip">Clicks: {bar.clicks}</div>
                                      </div>
                                    </div>
                                    <div className="chart-label">{bar.hour}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Referrers */}
                        <div className="chart-card">
                          <h3 style={{ marginBottom: '1.25rem' }}>Top Referrers</h3>
                          <div className="referral-list">
                            {analytics.referralData.length === 0 ? (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No referrer data available</p>
                            ) : (
                              analytics.referralData.map((ref, idx) => (
                                <div key={idx} className="referral-row">
                                  <div className="referral-row-header">
                                    <span>{ref.source}</span>
                                    <span style={{ fontWeight: '600' }}>{ref.count} ({ref.percentage}%)</span>
                                  </div>
                                  <div className="referral-bar-bg">
                                    <div className="referral-bar-fill" style={{ width: `${ref.percentage}%` }}></div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Detailed performance list */}
                      <div className="table-card">
                        <h3>Detailed Link Clicks</h3>
                        <table className="perf-table">
                          <thead>
                            <tr>
                              <th>Link Name</th>
                              <th>Clicks</th>
                              <th>Link CTR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.linkPerformance.map((link, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: '500' }}>
                                  <div>{link.title}</div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{link.url}</span>
                                </td>
                                <td>{link.clicks} clicks</td>
                                <td>{link.ctr}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Fetching analytics reports...
                    </div>
                  )}
                </>
              )}

            </div>

            {/* Right: Phone preview */}
            <div className="preview-pane">
              <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Eye size={14} /> LIVE PREVIEW (SIMULATOR)
              </div>
              
              <div className="phone-mockup">
                <div className="phone-speaker"></div>
                <div 
                  className="phone-screen" 
                  style={{ 
                    background: profile.theme.backgroundValue, 
                    fontFamily: profile.theme.font === 'monospace' ? 'Courier New, monospace' : profile.theme.font,
                    color: profile.theme.backgroundValue.includes('#fdf2f8') ? '#4c0519' : '#ffffff' 
                  }}
                >
                  
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="bio-avatar" />
                  ) : (
                    <div className="bio-avatar-placeholder">
                      <User size={30} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}

                  <h2 className="bio-name">{profile.name || `@${username}`}</h2>
                  <p className="bio-description" style={{ color: profile.theme.backgroundValue.includes('#fdf2f8') ? 'rgba(76,5,25,0.7)' : 'rgba(255,255,255,0.7)' }}>
                    {profile.bio || 'Enter details on the left to customize...'}
                  </p>

                  <div className="bio-links-container">
                    {profile.links.filter(l => l.active).map((link) => {
                      const buttonClass = `bio-link-button theme-${profile.theme.buttonStyle}-btn`;
                      const computedStyles = {};
                      if (profile.theme.buttonStyle === 'solid') {
                        computedStyles.backgroundColor = profile.theme.buttonColor;
                        computedStyles.color = profile.theme.buttonTextColor;
                      } else if (profile.theme.buttonStyle === 'outline') {
                        computedStyles.borderColor = profile.theme.buttonColor;
                        computedStyles.color = profile.theme.buttonColor;
                      }

                      return (
                        <a 
                          key={link.id} 
                          href={link.url}
                          target="_blank" 
                          rel="noreferrer"
                          className={buttonClass}
                          style={computedStyles}
                        >
                          {link.title}
                        </a>
                      );
                    })}
                  </div>

                  {!profile.theme.backgroundValue.includes('pastel') && (
                    <div className="branding-tag" style={{ color: profile.theme.backgroundValue.includes('#fdf2f8') ? 'rgba(76,5,25,0.4)' : 'rgba(255,255,255,0.4)' }}>
                      <Link2 size={12} /> Powered by <span>AuraLink</span>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}
