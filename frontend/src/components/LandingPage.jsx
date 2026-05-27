/* eslint-disable no-unused-vars */
import { Link2, Sparkles, BarChart3, Palette, ShieldCheck, ArrowRight, Check } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="landing-page">
      <div className="gradient-bg-effect"></div>
      
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <Link2 size={24} />
          <span>AuraLink</span>
        </div>
        <div className="nav-links">
          <button onClick={() => onNavigate('/auth')} className="btn btn-secondary">Sign In</button>
          <button onClick={() => onNavigate('/auth')} className="btn btn-primary">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-tagline">
          <Sparkles size={14} style={{ marginRight: '4px' }} />
          The Ultimate Link-in-Bio Platform
        </div>
        <h1 className="hero-title">
          One Link. Premium Styles.<br />
          <span>Ultimate Creator Analytics.</span>
        </h1>
        <p className="hero-desc">
          Build a gorgeous, personalized link page for your social bios. Track affiliate clicks, monitor views in real-time, and customize every pixel with designer themes.
        </p>
        <div className="hero-ctas">
          <button onClick={() => onNavigate('/auth')} className="btn btn-primary">
            Create Your Page <ArrowRight size={16} />
          </button>
          <a href="#pricing" className="btn btn-secondary">View Pricing</a>
        </div>

        {/* Floating Mockup Showcase */}
        <div className="mockup-showcase">
          <div className="phone-mockup">
            <div className="phone-speaker"></div>
            <div className="phone-screen" style={{ background: 'linear-gradient(135deg, #1e1b4b, #311042)', color: '#fff' }}>
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80" 
                alt="Avatar" 
                className="bio-avatar" 
              />
              <h2 className="bio-name">Alex Rivers</h2>
              <p className="bio-description" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Digital Creator & Tech Reviewer</p>
              
              <div className="bio-links-container">
                <div className="bio-link-button theme-glassmorphic-btn">🎥 My YouTube Channel</div>
                <div className="bio-link-button theme-glassmorphic-btn">💻 Premium Notion Workspaces</div>
                <div className="bio-link-button theme-glassmorphic-btn">🛍️ Shop Setup & Gear</div>
              </div>
              
              <div className="branding-tag">
                <Link2 size={12} /> Powered by <span>AuraLink</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pricing-section" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '6rem' }}>
        <h2 className="pricing-title">Everything you need to grow</h2>
        <div className="pricing-grid features-grid">
          <div className="price-card" style={{ padding: '2rem' }}>
            <div className="stat-icon" style={{ marginBottom: '1rem' }}><Palette size={24} /></div>
            <h3>Premium Themes</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Choose from gorgeous pre-built presets or customize colors, gradients, fonts, and buttons to match your brand style.
            </p>
          </div>
          <div className="price-card" style={{ padding: '2rem' }}>
            <div className="stat-icon" style={{ marginBottom: '1rem' }}><BarChart3 size={24} /></div>
            <h3>Real-Time Analytics</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Track views, link clicks, CTR, timeline records, and referral sources in a responsive dashboard environment.
            </p>
          </div>
          <div className="price-card" style={{ padding: '2rem' }}>
            <div className="stat-icon" style={{ marginBottom: '1rem' }}><ShieldCheck size={24} /></div>
            <h3>Affiliate Optimization</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Optimized for affiliate marketers. Create clean, high-CTR link descriptions to boost your sales.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="pricing-section" style={{ borderTop: '1px solid var(--border-light)', paddingBottom: '8rem' }}>
        <h2 className="pricing-title">Simple, transparent pricing</h2>
        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="price-card">
            <h3 className="price-name">Basic Creator</h3>
            <div className="price-num">$0<span>/ month</span></div>
            <ul className="price-features">
              <li><Check size={16} /> Unlimited active links</li>
              <li><Check size={16} /> Standard theme options</li>
              <li><Check size={16} /> Basic view count tracking</li>
              <li><Check size={16} /> AuraLink branding on page</li>
            </ul>
            <button onClick={() => onNavigate('/auth')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Start for Free
            </button>
          </div>

          {/* Premium Tier */}
          <div className="price-card premium">
            <div className="badge-popular">Popular</div>
            <h3 className="price-name">Aura Pro</h3>
            <div className="price-num">$9<span>/ month</span></div>
            <ul className="price-features">
              <li><Check size={16} /> Everything in Basic</li>
              <li><Check size={16} /> All Premium gradient & glass themes</li>
              <li><Check size={16} /> Advanced Analytics (referrers, link CTR, timeline charts)</li>
              <li><Check size={16} /> Custom fonts and button shapes</li>
              <li><Check size={16} /> Remove AuraLink branding</li>
            </ul>
            <button onClick={() => onNavigate('/auth')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Go Premium Pro
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-light)', padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>&copy; 2026 AuraLink. All rights reserved. Created for digital leaders.</p>
      </footer>
    </div>
  );
}
