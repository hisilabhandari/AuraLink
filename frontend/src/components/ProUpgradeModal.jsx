import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProUpgradeModal({ isOpen, onClose, username, onUpgradeSuccess }) {
  const [view, setView] = useState('pitch'); // 'pitch' or 'payment'
  const [paymentMade, setPaymentMade] = useState(false);
  const [txnId, setTxnId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRequestPremium = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/profile/${username}/request-pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId })
      });
      if (res.ok) {
        alert('Pro request submitted! Admin will verify your payment shortly.');
        onUpgradeSuccess();
        onClose();
      } else {
        alert('Failed to request pro upgrade. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        
        {view === 'pitch' && (
          <div style={contentStyle}>
            <div style={iconBadgeStyle}><Star size={32} color="#f59e0b" fill="#f59e0b" /></div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>Upgrade to AuraLink Pro</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Rs. 100 / year for ultimate creator tools.</p>
            
            <div style={tableContainerStyle}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '0.5rem' }}>Feature</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Free</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#f59e0b' }}>Pro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.5rem' }}>Username Change</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>30 Days</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>24 Hours</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.5rem' }}>Short Username</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>Min 5 chars</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>Min 3 chars</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.5rem' }}>Premium Themes</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>-</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}><CheckCircle size={16} color="#10b981" style={{ margin: '0 auto' }}/></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem' }}>Pro Profile Badge</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>-</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}><CheckCircle size={16} color="#10b981" style={{ margin: '0 auto' }}/></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
              <Link to="/pro" onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem 1rem', textDecoration: 'none' }}>Learn More</Link>
              <button onClick={() => setView('payment')} className="btn-primary" style={{ padding: '0.5rem 1.5rem', background: '#f59e0b', color: '#000', border: 'none' }}>
                Get Premium <ArrowRight size={16} style={{ marginLeft: '0.5rem', display: 'inline' }} />
              </button>
            </div>
          </div>
        )}

        {view === 'payment' && (
          <div style={contentStyle}>
            <ShieldCheck size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Secure Checkout</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Send exactly Rs. 100 and write <strong>{username} auralink</strong> in the remarks.
            </p>

            {/* QR Code Placeholder */}
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', display: 'inline-block', marginBottom: '1rem' }}>
              <img src="https://placehold.co/200x200?text=QR+Code" alt="Payment QR Code" style={{ width: '150px', height: '150px' }} />
            </div>

            <a 
              href={`https://wa.me/9779844245717?text=Payment%20proof%20for%20auralink%20upgrade.%20Username:%20${username}`}
              target="_blank" 
              rel="noreferrer"
              className="btn-secondary"
              style={{ display: 'block', width: '100%', marginBottom: '1.5rem', padding: '0.75rem', textDecoration: 'none' }}
            >
              Send Proof via WhatsApp (+977 9844245717)
            </a>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer', textAlign: 'left', background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '6px' }}>
              <input 
                type="checkbox" 
                checked={paymentMade} 
                onChange={(e) => setPaymentMade(e.target.checked)} 
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>I have made the payment</span>
            </label>

            {paymentMade && (
              <div style={{ textAlign: 'left', marginBottom: '1.5rem', width: '100%' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'block' }}>Transaction Reference ID (Optional)</label>
                <input 
                  type="text" 
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="input-control"
                  placeholder="e.g. TXN123456"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <button onClick={() => setView('pitch')} className="btn-secondary" style={{ flex: 1 }}>Back</button>
              <button 
                onClick={handleRequestPremium} 
                disabled={!paymentMade || submitting} 
                className="btn-primary" 
                style={{ flex: 2, background: paymentMade ? '#10b981' : 'var(--bg-tertiary)', color: paymentMade ? '#000' : 'var(--text-muted)' }}
              >
                {submitting ? 'Submitting...' : 'Request Premium'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '1rem'
};

const modalStyle = {
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '450px',
  position: 'relative',
  border: '1px solid var(--border-light)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

const closeBtnStyle = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '0.2rem'
};

const contentStyle = {
  padding: '2.5rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center'
};

const iconBadgeStyle = {
  width: '64px', height: '64px',
  borderRadius: '50%',
  background: 'rgba(245, 158, 11, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1rem'
};

const tableContainerStyle = {
  width: '100%',
  background: 'var(--bg-tertiary)',
  borderRadius: '8px',
  padding: '0.5rem',
  border: '1px solid var(--border-light)'
};
