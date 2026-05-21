import React, { useEffect, useState } from 'react';
import { Link2, User, RefreshCw } from 'lucide-react';

const API_BASE = '/api';

export default function PublicBioPage({ username }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <a href="#" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Create Your Own Bio Page</a>
      </div>
    );
  }

  const isPastelTheme = profile.theme.backgroundValue.includes('pastel') || profile.theme.backgroundValue.includes('#fdf2f8');

  return (
    <div 
      className="public-profile-wrapper"
      style={{ 
        background: profile.theme.backgroundValue, 
        fontFamily: profile.theme.font === 'monospace' ? 'Courier New, monospace' : profile.theme.font,
        color: isPastelTheme ? '#4c0519' : '#ffffff' 
      }}
    >
      <div className="public-profile-container">
        
        {/* Avatar */}
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="Avatar" className="bio-avatar" />
        ) : (
          <div className="bio-avatar-placeholder">
            <User size={30} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}

        {/* Info */}
        <h1 className="bio-name">{profile.name}</h1>
        <p className="bio-description" style={{ color: isPastelTheme ? 'rgba(76,5,25,0.7)' : 'rgba(255,255,255,0.7)' }}>
          {profile.bio}
        </p>

        {/* Links list */}
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
                onClick={() => handleLinkClick(link.id)}
                className={buttonClass}
                style={computedStyles}
              >
                {link.title}
              </a>
            );
          })}
        </div>

        {/* Brand stamp */}
        {!isPastelTheme && (
          <div className="branding-tag" style={{ color: 'rgba(255,255,255,0.4)', marginTop: '4rem' }}>
            <Link2 size={12} /> Powered by <a href="#" style={{ color: '#fff', textDecoration: 'underline', fontWeight: '600' }}>AuraLink</a>
          </div>
        )}

      </div>
    </div>
  );
}
