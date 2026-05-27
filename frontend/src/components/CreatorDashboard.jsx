/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, react-hooks/purity, no-useless-assignment */
import { useState, useEffect } from 'react';
import { 
  Link2, BarChart3, Palette, User, Plus, Trash2, Save, 
  ExternalLink, LogOut, RefreshCw, Eye, Sparkles, Check, ChevronRight, Settings, Shield, Image as ImageIcon,
  Menu, X
} from 'lucide-react';
import { FaTwitter, FaInstagram, FaYoutube, FaTiktok, FaFacebook, FaGithub, FaLinkedin, FaSpotify, FaDiscord, FaTwitch } from 'react-icons/fa';
import MediaManager from './MediaManager';
import ProUpgradeModal from './ProUpgradeModal';

const AVAILABLE_ICONS = { FaTwitter, FaInstagram, FaYoutube, FaTiktok, FaFacebook, FaGithub, FaLinkedin, FaSpotify, FaDiscord, FaTwitch };

const API_BASE = '/api';

export default function CreatorDashboard({ username, onLogout, isAdmin, onUsernameChange }) {
  const [activeTab, setActiveTab] = useState('links'); // 'links', 'design', 'analytics', 'admin'
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proStatus, setProStatus] = useState('none');
  
  // Admin states
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminReports, setAdminReports] = useState([]);
  
  // Link form states
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [expandedLinkId, setExpandedLinkId] = useState(null);

  // Media Manager state
  const [mediaTarget, setMediaTarget] = useState(null);

  // Mobile UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Username change states
  const [tempUsername, setTempUsername] = useState(username);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [changingUsername, setChangingUsername] = useState(false);

  // Pro Modal state
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => {
    setTempUsername(username);
    setIsUsernameChecked(false);
  }, [username]);

  const handleCheckUsername = async () => {
    if (tempUsername === username || tempUsername.length < 3) return;
    try {
      const res = await fetch(`${API_BASE}/profile/check/${tempUsername}`);
      if (res.ok) {
        const data = await res.json();
        setIsUsernameAvailable(data.available);
        setUsernameSuggestions(data.suggestions || []);
        setIsUsernameChecked(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeUsernameSubmit = async () => {
    if (!isUsernameChecked || !isUsernameAvailable || tempUsername === username) return;
    if (!confirm(`Are you sure you want to change your username from @${username} to @${tempUsername}? Your page URL will change.`)) return;
    
    try {
      setChangingUsername(true);
      const res = await fetch(`${API_BASE}/profile/${username}/change-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername: tempUsername })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert('Your username has been updated successfully!');
        if (onUsernameChange) {
          onUsernameChange(data.username);
        }
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to change username.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during username update.');
    } finally {
      setChangingUsername(false);
    }
  };

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

  const handleMediaSelect = (url) => {
    if (!mediaTarget) return;

    if (mediaTarget.type === 'avatar') {
      const updatedProfile = { ...profile, avatarUrl: url };
      setProfile(updatedProfile);
      handleSave(updatedProfile);
    } else if (mediaTarget.type === 'link') {
      handleUpdateLinkStyle(mediaTarget.id, 'imageUrl', url);
    }
    
    setMediaTarget(null);
  };

  // Fetch profile & analytics
  const fetchData = async () => {
    try {
      setLoading(true);

      const [profRes, analRes] = await Promise.all([
        fetch(`${API_BASE}/profile/${username}`),
        fetch(`${API_BASE}/analytics/report/${username}`)
      ]);

      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
      }
      
      if (analRes.ok) {
        const analData = await analRes.json();
        setAnalytics(analData);
      }
      
      // Admin data fetch
      if (isAdmin) {
        const [usersRes, reportsRes] = await Promise.all([
          fetch(`${API_BASE}/admin/users`),
          fetch(`${API_BASE}/admin/reports`)
        ]);
        if (usersRes.ok) setAdminUsers(await usersRes.json());
        if (reportsRes.ok) setAdminReports(await reportsRes.json());
      }
      
      // Get user premium info from localStorage (simulated session)
      const cachedUser = localStorage.getItem('auralink_user');
      if (cachedUser) {
        const userObj = JSON.parse(cachedUser);
        setProStatus(userObj.proStatus || 'none');
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

  const handleAdminAction = async (action, targetUsername) => {
    try {
      let endpoint = '';
      let body = {};
      
      if (action === 'grant_pro') {
        endpoint = `${API_BASE}/admin/approve-pro/${targetUsername}`;
        body = { status: 'approved' };
      } else if (action === 'revoke_pro') {
        endpoint = `${API_BASE}/admin/approve-pro/${targetUsername}`;
        body = { status: 'none' };
      } else if (action === 'suspend') {
        endpoint = `${API_BASE}/admin/suspend-user/${targetUsername}`;
        body = { status: 'suspended', reason: 'Admin action' };
      } else if (action === 'unsuspend') {
        endpoint = `${API_BASE}/admin/suspend-user/${targetUsername}`;
        body = { status: 'active', reason: '' };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        // Refresh users
        const usersRes = await fetch(`${API_BASE}/admin/users`);
        if (usersRes.ok) setAdminUsers(await usersRes.json());
      } else {
        alert('Action failed.');
      }
    } catch (err) {
      console.error('Error performing admin action:', err);
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/reports/${reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve' })
      });
      if (res.ok) {
        // Refresh reports
        const reportsRes = await fetch(`${API_BASE}/admin/reports`);
        if (reportsRes.ok) setAdminReports(await reportsRes.json());
      } else {
        alert('Action failed.');
      }
    } catch (err) {
      console.error('Error resolving report:', err);
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

  // Upgrade to Pro Request
  const handleUpgradeToPro = () => {
    setShowProModal(true);
  };
  
  const handleProUpgradeSuccess = () => {
    setProStatus('pending');
    const cachedUser = localStorage.getItem('auralink_user');
    if (cachedUser) {
      const userObj = JSON.parse(cachedUser);
      userObj.proStatus = 'pending';
      localStorage.setItem('auralink_user', JSON.stringify(userObj));
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

  if (!profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)' }}>Profile Not Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Could not load the profile configuration for @{username}.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={fetchData} className="btn btn-primary"><RefreshCw size={16} /> Retry Connection</button>
          <button onClick={onLogout} className="btn btn-secondary">Log Out</button>
        </div>
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
    },
    {
      name: 'Midnight Velvet',
      type: 'gradient',
      value: 'linear-gradient(135deg, #2e0249, #570a57)',
      btnStyle: 'pill',
      btnColor: '#a91079',
      textColor: '#ffffff',
      premium: false
    },
    {
      name: 'Golden Hour',
      type: 'gradient',
      value: 'linear-gradient(135deg, #f59e0b, #d97706)',
      btnStyle: 'dashed',
      btnColor: '#b45309',
      textColor: '#fffbeb',
      premium: true
    },
    {
      name: 'Arctic Frost',
      type: 'gradient',
      value: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
      btnStyle: 'soft',
      btnColor: 'rgba(2, 132, 199, 0.1)',
      textColor: '#0369a1',
      premium: false
    },
    {
      name: 'Dark Matter',
      type: 'flat',
      value: '#09090b',
      btnStyle: 'shadow',
      btnColor: '#27272a',
      textColor: '#ffffff',
      premium: true
    }
  ];

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <header className="mobile-dashboard-header">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-menu-btn" title="Toggle Menu">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="nav-brand" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
          <Link2 size={20} style={{ color: 'var(--accent-primary)' }} />
          <span>AuraLink</span>
        </div>
        <button onClick={() => setShowMobilePreview(true)} className="mobile-preview-btn-top" title="View Live Preview">
          <Eye size={20} />
        </button>
      </header>

      <div className="dashboard-layout">
        
        {/* Sidebar Nav */}
        <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-top">
            <div className="nav-brand" style={{ padding: '0 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
              <Link2 size={24} />
              <span>AuraLink</span>
            </div>
            
            <nav className="sidebar-menu">
              <button 
                onClick={() => { setActiveTab('links'); setMobileMenuOpen(false); }}
                className={`sidebar-item ${activeTab === 'links' ? 'active' : ''}`}
              >
                <User size={18} />
                <span>Page Profile</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('design'); setMobileMenuOpen(false); }}
                className={`sidebar-item ${activeTab === 'design' ? 'active' : ''}`}
              >
                <Palette size={18} />
                <span>Theme Design</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }}
                className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
              >
                <BarChart3 size={18} />
                <span>Analytics</span>
              </button>
              
              {isAdmin && (
                <button 
                  onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                  className={`sidebar-item ${activeTab === 'admin' ? 'active' : ''}`}
                  style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}
                >
                  <Shield size={18} color="var(--primary)" />
                  <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Admin Panel</span>
                </button>
              )}
            </nav>
          </div>
          
          <div className="sidebar-bottom">
            <div className="sidebar-item" onClick={handleUpgradeToPro} style={{ color: proStatus === "approved" ? 'var(--success)' : 'var(--warning)', cursor: 'pointer', marginBottom: '1rem', border: '1px dashed var(--border-light)' }}>
              <Sparkles size={16} />
              <span>{proStatus === "approved" ? 'Premium Active' : 'Upgrade to Pro'}</span>
            </div>
            
            <div className="sidebar-user">
              <div className="user-info">
                <span className="username">@{username}</span>
                {proStatus === 'approved' ? (
                  <span className="plan-badge" style={{ background: 'var(--success)', color: '#000' }}>PRO</span>
                ) : proStatus === 'pending' ? (
                  <span className="plan-badge" style={{ background: 'var(--warning)', color: '#000' }}>PENDING</span>
                ) : (
                  <button onClick={handleUpgradeToPro} className="btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>UPGRADE TO PRO</button>
                )}
              </div>
              <button onClick={onLogout} className="btn-text" title="Log Out">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

        {/* Content Pane */}
        <main className="workspace-content">
          {/* Floating preview FAB for mobile */}
          <button onClick={() => setShowMobilePreview(true)} className="mobile-preview-fab" title="View Simulator Live">
            <Eye size={18} />
            <span>Live Preview</span>
          </button>

          <div className="splitscreen">
            
            {/* Left: Editor form */}
            <div className="editor-pane">
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem' }}>Creator Dashboard</h1>
                </div>
              </div>

              {/* TABS */}
              {activeTab === 'links' && (
                <>
                  {/* Profile Info */}
                  <section className="editor-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h2 className="card-title" style={{ margin: 0 }}><User size={18} /> Profile Bio Details</h2>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>
                        Live URL: <a href={`/@${username}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: '500', textDecoration: 'underline' }}>
                          {window.location.origin}/@{username} <ExternalLink size={10} style={{ display: 'inline' }} />
                        </a>
                      </p>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Avatar Photo (Upload to Cloudflare R2)</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.4rem' }}>
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="Avatar Preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-light)' }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px dashed var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Pic</div>
                        )}
                        <button 
                          type="button" 
                          onClick={() => setMediaTarget({ type: 'avatar' })}
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', margin: 0, cursor: 'pointer' }}
                        >
                          <ImageIcon size={14} style={{ marginRight: '0.3rem', display: 'inline', verticalAlign: 'text-bottom' }} /> Choose Image
                        </button>
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
                    
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontWeight: '600' }}>SEO Settings</label>
                      <input 
                        type="text" 
                        value={profile.seo?.title || ''} 
                        onChange={(e) => {
                          const updated = { ...profile, seo: { ...profile.seo, title: e.target.value } };
                          setProfile(updated);
                        }}
                        onBlur={() => handleSave()}
                        className="input-control" 
                        placeholder="SEO Meta Title"
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <textarea 
                        value={profile.seo?.description || ''} 
                        onChange={(e) => {
                          const updated = { ...profile, seo: { ...profile.seo, description: e.target.value } };
                          setProfile(updated);
                        }}
                        onBlur={() => handleSave()}
                        className="input-control" 
                        placeholder="SEO Meta Description"
                        rows={2}
                        style={{ marginBottom: '0.5rem', resize: 'none' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <input 
                          type="checkbox" 
                          checked={profile.seo?.allowIndexing !== false}
                          onChange={(e) => {
                            const updated = { ...profile, seo: { ...profile.seo, allowIndexing: e.target.checked } };
                            setProfile(updated);
                            handleSave(updated);
                          }}
                        />
                        Allow Search Engines to Index Page
                      </label>
                    </div>
                  </section>

                  {/* Change Username Card */}
                  <section className="editor-card" style={{ marginBottom: '1.5rem' }}>
                    <h2 className="card-title"><User size={18} /> Update Username</h2>
                    
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>New Username</label>
                      <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>@</span>
                          <input 
                            type="text" 
                            value={tempUsername} 
                            onChange={(e) => {
                              const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                              setTempUsername(val);
                              setIsUsernameChecked(false);
                            }}
                            className="input-control" 
                            style={{ paddingLeft: '32px' }}
                            placeholder="new_username"
                          />
                        </div>
                        <button 
                          onClick={handleCheckUsername} 
                          disabled={tempUsername === username || tempUsername.length < 3}
                          className="btn btn-secondary"
                        >
                          Check
                        </button>
                      </div>
                      
                      {isUsernameChecked && !isUsernameAvailable && (
                        <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--danger)' }}>
                          Username is already taken. 
                          {usernameSuggestions.length > 0 && (
                            <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                              Suggestions: 
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                                {usernameSuggestions.map(sug => (
                                  <button 
                                    key={sug} 
                                    onClick={() => { setTempUsername(sug); setIsUsernameChecked(false); }}
                                    style={{ padding: '0.2rem 0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                  >
                                    @{sug}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {isUsernameChecked && isUsernameAvailable && (
                        <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.25rem' }}>✓ Username is available!</p>
                      )}
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={handleChangeUsernameSubmit}
                      className="btn btn-primary"
                      disabled={!isUsernameChecked || !isUsernameAvailable || tempUsername === username || changingUsername}
                    >
                      {changingUsername ? 'Updating...' : 'Apply New Username'}
                    </button>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                <button className="btn-text" onClick={() => setExpandedLinkId(expandedLinkId === link.id ? null : link.id)} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  <Settings size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {expandedLinkId === link.id ? 'Close Settings' : 'Customize Style'}
                                </button>
                              </div>
                              
                              {expandedLinkId === link.id && (
                                <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input type="checkbox" checked={link.showUrl} onChange={(e) => handleUpdateLinkStyle(link.id, 'showUrl', e.target.checked)} />
                                    Show URL below title
                                  </label>
                                  
                                  {proStatus === "approved" && (
                                    <div style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid var(--accent-secondary)', borderRadius: '4px' }}>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input type="checkbox" checked={link.linkType === 'product'} onChange={(e) => handleUpdateLinkStyle(link.id, 'linkType', e.target.checked ? 'product' : 'link')} />
                                        🛒 Sell as Product
                                      </label>
                                      {link.linkType === 'product' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                          <input type="number" value={link.price || 0} onChange={(e) => handleUpdateLinkStyle(link.id, 'price', parseFloat(e.target.value))} onBlur={() => handleSave()} className="input-control" placeholder="Price" />
                                          <select value={link.currency || 'USD'} onChange={(e) => handleUpdateLinkStyle(link.id, 'currency', e.target.value)} className="input-control">
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="GBP">GBP</option>
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                      <label>Icon</label>
                                      <select value={link.iconName || ''} onChange={(e) => handleUpdateLinkStyle(link.id, 'iconName', e.target.value)} className="input-control">
                                        <option value="">None</option>
                                        {Object.keys(AVAILABLE_ICONS).map(icon => <option key={icon} value={icon}>{icon.replace('Fa', '')}</option>)}
                                      </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Custom Image URL
                                        <button 
                                          type="button" 
                                          onClick={() => setMediaTarget({ type: 'link', id: link.id })}
                                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                        >
                                          <ImageIcon size={12} /> Library
                                        </button>
                                      </label>
                                      <input type="text" value={link.imageUrl || ''} onChange={(e) => handleUpdateLinkStyle(link.id, 'imageUrl', e.target.value)} onBlur={() => handleSave()} className="input-control" placeholder="https://..." />
                                    </div>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <div>
                                      <label>Button Style</label>
                                      <select value={link.buttonStyle || ''} onChange={(e) => handleUpdateLinkStyle(link.id, 'buttonStyle', e.target.value)} className="input-control">
                                        <option value="">Inherit Theme</option>
                                        <option value="solid">Solid</option>
                                        <option value="outline">Outline</option>
                                        <option value="glassmorphic">Glass</option>
                                        <option value="pill">Pill</option>
                                        <option value="soft">Soft</option>
                                        <option value="shadow">Retro Shadow</option>
                                        <option value="dashed">Dashed</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label>Border Radius</label>
                                      <select value={link.buttonBorderRadius || ''} onChange={(e) => handleUpdateLinkStyle(link.id, 'buttonBorderRadius', e.target.value)} className="input-control">
                                        <option value="">Inherit</option>
                                        <option value="0px">Square 0px</option>
                                        <option value="8px">Rounded 8px</option>
                                        <option value="16px">Extra Rounded 16px</option>
                                        <option value="30px">Full Pill 30px</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label>Bg Color</label>
                                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                        <input 
                                          type="color" 
                                          value={link.buttonColor && link.buttonColor.startsWith('#') ? link.buttonColor : '#3b82f6'} 
                                          onChange={(e) => handleUpdateLinkStyle(link.id, 'buttonColor', e.target.value)}
                                          style={{ width: '36px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px', background: 'transparent' }} 
                                        />
                                        <input 
                                          type="text" 
                                          value={link.buttonColor || ''} 
                                          onChange={(e) => handleUpdateLinkStyle(link.id, 'buttonColor', e.target.value)} 
                                          onBlur={() => handleSave()} 
                                          className="input-control" 
                                          style={{ flex: 1, padding: '0.4rem' }}
                                          placeholder="Inherit" 
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label>Text Color</label>
                                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                        <input 
                                          type="color" 
                                          value={link.buttonTextColor && link.buttonTextColor.startsWith('#') ? link.buttonTextColor : '#ffffff'} 
                                          onChange={(e) => handleUpdateLinkStyle(link.id, 'buttonTextColor', e.target.value)}
                                          style={{ width: '36px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px', background: 'transparent' }} 
                                        />
                                        <input 
                                          type="text" 
                                          value={link.buttonTextColor || ''} 
                                          onChange={(e) => handleUpdateLinkStyle(link.id, 'buttonTextColor', e.target.value)} 
                                          onBlur={() => handleSave()} 
                                          className="input-control" 
                                          style={{ flex: 1, padding: '0.4rem' }}
                                          placeholder="Inherit" 
                                        />
                                      </div>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                      <label>Border Color</label>
                                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                        <input 
                                          type="color" 
                                          value={link.buttonBorderColor && link.buttonBorderColor.startsWith('#') ? link.buttonBorderColor : '#cccccc'} 
                                          onChange={(e) => handleUpdateLinkStyle(link.id, 'buttonBorderColor', e.target.value)}
                                          style={{ width: '36px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px', background: 'transparent' }} 
                                        />
                                        <input 
                                          type="text" 
                                          value={link.buttonBorderColor || ''} 
                                          onChange={(e) => handleUpdateLinkStyle(link.id, 'buttonBorderColor', e.target.value)} 
                                          onBlur={() => handleSave()} 
                                          className="input-control" 
                                          style={{ flex: 1, padding: '0.4rem' }}
                                          placeholder="Inherit" 
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
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
                        const isLocked = preset.premium && proStatus !== "approved";
                        
                        return (
                          <div 
                            key={idx} 
                            onClick={() => {
                              if (isLocked) {
                                setShowProModal(true);
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
                    <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
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
                      <div style={{ flex: 1 }}>
                        <label>Global Font Color</label>
                        <input 
                          type="color" 
                          value={profile.theme.fontColor || '#ffffff'}
                          onChange={(e) => handleUpdateTheme('fontColor', e.target.value)}
                          style={{ width: '100%', height: '40px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                        />
                      </div>
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
                        <option value="pill">Pill Shape</option>
                        <option value="soft">Soft Background</option>
                        <option value="shadow">Retro Shadow Offset</option>
                        <option value="dashed">Dashed Border</option>
                        {proStatus === "approved" && <option value="neon">Neon Digital</option>}
                        {proStatus === "approved" && <option value="pastel">Rounded Pastel</option>}
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

              {isAdmin && activeTab === 'admin' && (
                <>
                  <section className="editor-card" style={{ marginBottom: '2rem' }}>
                    <h2 className="card-title"><Shield size={18} /> User Management</h2>
                    <div className="table-card" style={{ marginTop: '1rem' }}>
                      <table className="perf-table">
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Pro Status</th>
                            <th>Account Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.map(u => (
                            <tr key={u.username}>
                              <td style={{ fontWeight: '500' }}>@{u.username}</td>
                              <td>{u.role.toUpperCase()}</td>
                              <td>
                                {u.pro_status === 'approved' ? (
                                  <span style={{ color: 'var(--success)', fontWeight: '500' }}>Active PRO</span>
                                ) : u.pro_status === 'pending' ? (
                                  <span style={{ color: 'var(--warning)', fontWeight: '500' }}>Pending</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>Free</span>
                                )}
                              </td>
                              <td>
                                {u.account_status === 'suspended' ? <span style={{ color: 'var(--danger)', fontWeight: '500' }}>Suspended</span> : <span style={{ color: 'var(--success)' }}>Active</span>}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {u.pro_status === 'pending' && (
                                    <button onClick={() => handleAdminAction('grant_pro', u.username)} className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>Grant PRO</button>
                                  )}
                                  {u.pro_status === 'approved' && (
                                    <button onClick={() => handleAdminAction('revoke_pro', u.username)} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>Revoke PRO</button>
                                  )}
                                  <button onClick={() => handleAdminAction(u.account_status === 'suspended' ? 'unsuspend' : 'suspend', u.username)} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', color: u.account_status === 'suspended' ? 'var(--success)' : 'var(--warning)' }}>
                                    {u.account_status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {adminUsers.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No users found</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  
                  <section className="editor-card">
                    <h2 className="card-title" style={{ color: 'var(--danger)' }}><Trash2 size={18} /> Reported Profiles</h2>
                    <div className="table-card" style={{ marginTop: '1rem' }}>
                      <table className="perf-table">
                        <thead>
                          <tr>
                            <th>Reported Username</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminReports.map(r => (
                            <tr key={r.id}>
                              <td style={{ fontWeight: '500' }}>@{r.reported_username}</td>
                              <td>{r.reason}</td>
                              <td>
                                {r.status === 'resolved' ? (
                                  <span style={{ color: 'var(--success)' }}>Resolved</span>
                                ) : (
                                  <span style={{ color: 'var(--warning)' }}>Pending</span>
                                )}
                              </td>
                              <td>
                                {r.status !== 'resolved' && (
                                  <button onClick={() => handleResolveReport(r.id)} className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>
                                    Resolve
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {adminReports.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No reports found</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}

            </div>

            {/* Right: Phone preview */}
            <div className={`preview-pane ${showMobilePreview ? 'active' : ''}`}>
              <div className="mobile-preview-header">
                <h3>Live Simulator</h3>
                <button onClick={() => setShowMobilePreview(false)} className="btn-close-preview" title="Close Preview">
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="desktop-preview-label">
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
                      const finalStyleName = link.buttonStyle || profile.theme.buttonStyle || 'solid';
                      const buttonClass = `bio-link-button theme-${finalStyleName}-btn`;
                      const computedStyles = {};
                      
                      // Theme Base styles
                      if (finalStyleName === 'solid' || finalStyleName === 'pill' || finalStyleName === 'soft') {
                        computedStyles.backgroundColor = profile.theme.buttonColor;
                        computedStyles.color = profile.theme.buttonTextColor;
                      } else if (finalStyleName === 'outline' || finalStyleName === 'dashed') {
                        computedStyles.borderColor = profile.theme.buttonColor;
                        computedStyles.color = profile.theme.buttonColor;
                      }
                      
                      // Individual link overrides
                      if (link.buttonColor) computedStyles.backgroundColor = link.buttonColor;
                      if (link.buttonColor && (finalStyleName === 'outline' || finalStyleName === 'dashed')) {
                        computedStyles.borderColor = link.buttonColor;
                        computedStyles.color = link.buttonColor;
                      }
                      if (link.buttonTextColor) computedStyles.color = link.buttonTextColor;
                      if (link.buttonBorderColor) computedStyles.borderColor = link.buttonBorderColor;
                      if (link.buttonBorderRadius) computedStyles.borderRadius = link.buttonBorderRadius;

                      const IconComponent = link.iconName && AVAILABLE_ICONS[link.iconName] ? AVAILABLE_ICONS[link.iconName] : null;

                      let parsedUrlHostname = '';
                      try {
                        parsedUrlHostname = new URL(link.url).hostname;
                      } catch(e) {
                        parsedUrlHostname = link.url;
                      }

                      return (
                        <a 
                          key={link.id} 
                          href={link.url}
                          target="_blank" 
                          rel="noreferrer"
                          className={buttonClass}
                          style={{...computedStyles, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {link.imageUrl && <img src={link.imageUrl} alt="icon" loading="lazy" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />}
                            {!link.imageUrl && IconComponent && <IconComponent size={20} />}
                            <span>{link.title}</span>
                            {link.linkType === 'product' && (
                              <span style={{ background: 'var(--success)', color: '#000', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                {link.currency === 'USD' ? '$' : link.currency === 'EUR' ? '€' : '£'}{link.price}
                              </span>
                            )}
                          </div>
                          {link.showUrl && <span style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.2rem' }}>{parsedUrlHostname}</span>}
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

      {mediaTarget && (
        <MediaManager
          username={username}
          onSelect={handleMediaSelect}
          onClose={() => setMediaTarget(null)}
        />
      )}
      
      {/* Save Action Bar (Sticky at bottom of screen for desktop) */}
      <div style={{
        position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100,
        backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center', gap: '1rem'
      }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Unsaved changes?</span>
        <button 
          onClick={() => handleSave()} 
          disabled={saving} 
          className="btn btn-primary"
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Page'}
        </button>
      </div>

      <ProUpgradeModal 
        isOpen={showProModal} 
        onClose={() => setShowProModal(false)}
        username={username}
        onUpgradeSuccess={handleProUpgradeSuccess}
      />
    </div>
  );
}
