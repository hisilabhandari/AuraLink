/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, no-useless-assignment */
import { useEffect, useState } from 'react';
import { Link2, User, RefreshCw, Flag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { FaTwitter, FaInstagram, FaYoutube, FaTiktok, FaFacebook, FaGithub, FaLinkedin, FaSpotify, FaDiscord, FaTwitch } from 'react-icons/fa';

const AVAILABLE_ICONS = { FaTwitter, FaInstagram, FaYoutube, FaTiktok, FaFacebook, FaGithub, FaLinkedin, FaSpotify, FaDiscord, FaTwitch };
const API_BASE = '/api';

export default function PublicBioPage({ username }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Report Modal State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportStatus, setReportStatus] = useState('');

  const handleReport = async () => {
    if (!reportReason) return;
    setReportStatus('submitting');
    try {
      const loggedInUser = JSON.parse(localStorage.getItem('auralink_user'));
      await fetch(`${API_BASE}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUsername: username,
          reason: reportReason,
          reporterId: loggedInUser?.username || null
        })
      });
      setReportStatus('success');
      setTimeout(() => {
        setReportOpen(false);
        setReportStatus('');
        setReportReason('');
      }, 2000);
    } catch(err) {
      setReportStatus('error');
    }
  };

  // Dynamically load Google Analytics if ID is provided
  useEffect(() => {
    if (profile && profile.googleAnalyticsId) {
      const gaId = profile.googleAnalyticsId.trim();
      if (gaId) {
        const scriptId = 'ga-gtag-script';
        const configScriptId = 'ga-config-script';

        // Check if script already exists to avoid duplicates
        let script = document.getElementById(scriptId);
        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          document.head.appendChild(script);
        }

        let configScript = document.getElementById(configScriptId);
        if (!configScript) {
          configScript = document.createElement('script');
          configScript.id = configScriptId;
          configScript.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);};
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `;
          document.head.appendChild(configScript);
        }

        return () => {
          const s = document.getElementById(scriptId);
          if (s) s.remove();
          const cs = document.getElementById(configScriptId);
          if (cs) cs.remove();
        };
      }
    }
  }, [profile]);

  // Parse referrer details
  const getReferrer = () => {
    try {
      const ref = document.referrer;
      if (!ref) return 'Direct';
      const url = new URL(ref);
      if (url.hostname.includes('instagram.com')) return 'Instagram';
      if (url.hostname.includes('twitter.com') || url.hostname.includes('t.co') || url.hostname.includes('x.com')) return 'Twitter/X';
      if (url.hostname.includes('tiktok.com')) return 'TikTok';
      if (url.hostname.includes('youtube.com')) return 'YouTube';
      if (url.hostname.includes('facebook.com')) return 'Facebook';
      return url.hostname;
    } catch (e) {
      return 'Direct';
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/profile/${username}`);
        if (!res.ok) {
          throw new Error('Profile not found');
        }
        const data = await res.json();
        setProfile(data);

        // Record the page view in the background
        const referrerVal = getReferrer();
        fetch(`${API_BASE}/analytics/view/${username}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referrer: referrerVal })
        }).catch(err => console.error('Failed to log view analytics:', err));

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadProfile();
    }
  }, [username]);

  // Log link click before redirection
  const handleLinkClick = (linkId) => {
    fetch(`${API_BASE}/analytics/click/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId })
    }).catch(err => console.error('Failed to log click analytics:', err));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', background: '#070913', color: '#fff' }}>
        <RefreshCw className="animate-spin" size={24} />
        <span>Visiting page...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', background: '#070913', color: '#fff', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--danger)' }}>404 Not Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>The AuraLink profile `@{username}` does not exist or has been removed.</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Create Your Own Bio Page</a>
      </div>
    );
  }

  const isPastelTheme = profile.theme.backgroundValue.includes('pastel') || profile.theme.backgroundValue.includes('#fdf2f8');
  const globalFontColor = profile.theme.fontColor || (isPastelTheme ? '#4c0519' : '#ffffff');

  return (
    <>
      <Helmet>
        <title>{profile.seo?.title || `${profile.name}'s Links`}</title>
        <meta name="description" content={profile.seo?.description || profile.bio} />
        {profile.seo?.allowIndexing === false && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>

      <div 
        className="public-profile-wrapper"
        style={{ 
          background: profile.theme.backgroundValue, 
          fontFamily: profile.theme.font === 'monospace' ? 'Courier New, monospace' : profile.theme.font,
          color: globalFontColor 
        }}
      >
        <div className="public-profile-container">
          
          {/* Avatar */}
          <div className={`bio-avatar-wrapper ${profile.proStatus === 'approved' ? 'pro-avatar-ring' : ''}`}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="bio-avatar" />
            ) : (
              <div className="bio-avatar-placeholder">
                <User size={30} style={{ color: 'var(--text-muted)' }} />
              </div>
            )}
          </div>

          {/* Info */}
          <h1 className="bio-name">{profile.name}</h1>
          <p className="bio-description" style={{ color: globalFontColor, opacity: 0.8 }}>
            {profile.bio}
          </p>

          {/* Links list */}
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
                  onClick={() => handleLinkClick(link.id)}
                  className={buttonClass}
                  style={{...computedStyles, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {link.imageUrl && <img src={link.imageUrl} alt="icon" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />}
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

          {/* Brand stamp & Report link */}
          <div className="branding-tag" style={{ color: 'rgba(255,255,255,0.4)', marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            {!isPastelTheme && (
              <div>
                <Link2 size={12} /> Powered by <a href="/" style={{ color: '#fff', textDecoration: 'underline', fontWeight: '600' }}>AuraLink</a>
              </div>
            )}
            <button 
              onClick={() => setReportOpen(true)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: 0.7 }}
            >
              <Flag size={10} /> Report this profile
            </button>
          </div>

        </div>
      </div>

      {/* Report Modal */}
      {reportOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Report Profile</h3>
            {reportStatus === 'success' ? (
              <p style={{ color: '#4ade80' }}>Report submitted successfully. Our team will review it.</p>
            ) : (
              <>
                <textarea 
                  value={reportReason} 
                  onChange={e => setReportReason(e.target.value)} 
                  placeholder="Why are you reporting this profile? Please provide details."
                  style={{ width: '100%', height: '100px', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setReportOpen(false)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>Cancel</button>
                  <button onClick={handleReport} disabled={reportStatus === 'submitting' || !reportReason} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', opacity: (reportStatus === 'submitting' || !reportReason) ? 0.5 : 1 }}>
                    {reportStatus === 'submitting' ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
