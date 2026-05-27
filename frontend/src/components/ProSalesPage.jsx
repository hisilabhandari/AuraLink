import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowLeft, Star } from 'lucide-react';

export default function ProSalesPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            <Star size={18} fill="#f59e0b" /> AuraLink Pro
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(to right, #f59e0b, #facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Unleash Your Profile's Potential
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Get exclusive themes, premium features, and unparalleled flexibility for only Rs. 100 per year.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
          
          {/* Free Tier */}
          <div style={pricingCardStyle}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Free</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Rs. 0 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/forever</span></div>
            <ul style={featureListStyle}>
              <li style={featureItemStyle}><Check size={18} color="#10b981" /> Unlimited Standard Links</li>
              <li style={featureItemStyle}><Check size={18} color="#10b981" /> Basic Analytics (Views & Clicks)</li>
              <li style={featureItemStyle}><Check size={18} color="#10b981" /> 5 Standard Themes</li>
              <li style={featureItemStyle}><Check size={18} color="#10b981" /> 15MB Image Storage</li>
              <li style={{ ...featureItemStyle, color: 'var(--text-muted)' }}><Check size={18} color="transparent" /> Username changes (Every 30 Days)</li>
              <li style={{ ...featureItemStyle, color: 'var(--text-muted)' }}><Check size={18} color="transparent" /> Minimum 5 character username</li>
            </ul>
          </div>

          {/* Pro Tier */}
          <div style={{ ...pricingCardStyle, border: '2px solid #f59e0b', transform: 'scale(1.05)' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#000', padding: '0.2rem 1rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>MOST POPULAR</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f59e0b' }}>Pro</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Rs. 100 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/year</span></div>
            <ul style={featureListStyle}>
              <li style={featureItemStyle}><Check size={18} color="#10b981" /> <strong>Everything in Free, plus:</strong></li>
              <li style={featureItemStyle}><Check size={18} color="#10b981" /> 15+ Premium Designer Themes</li>
              <li style={featureItemStyle}><Check size={18} color="#10b981" /> 100MB Image Storage</li>
              <li style={featureItemStyle}><Check size={18} color="#10b981" /> Username changes (Every 24 Hours)</li>
              <li style={featureItemStyle}><Check size={18} color="#10b981" /> Premium Short Usernames (3-4 chars)</li>
              <li style={featureItemStyle}><Check size={18} color="#10b981" /> Animated Pro Avatar Ring</li>
              <li style={featureItemStyle}><Check size={18} color="#10b981" /> Priority Support</li>
            </ul>
            <Link to="/auth" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: '2rem', background: '#f59e0b', color: '#000', border: 'none', textDecoration: 'none' }}>
              Upgrade Now
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

const pricingCardStyle = {
  flex: '1 1 300px',
  background: 'var(--bg-secondary)',
  borderRadius: '16px',
  padding: '2.5rem 2rem',
  border: '1px solid var(--border-light)',
  position: 'relative'
};

const featureListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const featureItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  fontSize: '0.95rem'
};
