import React, { useState, useEffect } from 'react';
import { Shield, Users, Flag, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const API_BASE = '/api';

export default function AdminDashboard({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/admin/users`),
        fetch(`${API_BASE}/admin/reports`)
      ]);
      if (!uRes.ok || !rRes.ok) throw new Error('Failed to fetch admin data');
      setUsers(await uRes.json());
      setReports(await rRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProAction = async (username, status) => {
    try {
      await fetch(`${API_BASE}/admin/approve-pro/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccountStatus = async (username, status) => {
    try {
      const reason = status === 'suspended' ? prompt('Enter suspension reason:') : null;
      if (status === 'suspended' && !reason) return;
      await fetch(`${API_BASE}/admin/suspend-user/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportAction = async (id, status) => {
    try {
      await fetch(`${API_BASE}/admin/reports/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && users.length === 0) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070913', color: '#fff' }}><RefreshCw className="animate-spin" size={24} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#070913', color: '#fff', padding: '2rem' }}>
      <Helmet><title>Admin Dashboard | AuraLink</title></Helmet>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><Shield className="text-primary" /> Admin Control Panel</h1>
          <button onClick={onLogout} className="btn-text">Sign Out</button>
        </header>

        {error && <div style={{ background: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* Pro Requests & Users */}
          <section style={{ background: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid #1e293b' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1rem', margin: 0 }}>
              <Users size={20} /> Users & Pro Requests
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
                    <th style={{ padding: '0.5rem' }}>Username</th>
                    <th style={{ padding: '0.5rem' }}>Pro Status</th>
                    <th style={{ padding: '0.5rem' }}>Account Status</th>
                    <th style={{ padding: '0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '0.5rem' }}>@{u.username} <br/><span style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</span></td>
                      <td style={{ padding: '0.5rem' }}>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', 
                          background: u.pro_status === 'approved' ? '#166534' : u.pro_status === 'pending' ? '#854d0e' : '#1e293b',
                          color: u.pro_status === 'approved' ? '#4ade80' : u.pro_status === 'pending' ? '#facc15' : '#94a3b8'
                        }}>
                          {u.pro_status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', 
                          background: u.account_status === 'active' ? '#166534' : '#7f1d1d',
                          color: u.account_status === 'active' ? '#4ade80' : '#f87171'
                        }}>
                          {u.account_status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        {u.pro_status === 'pending' && (
                          <>
                            <button onClick={() => handleProAction(u.username, 'approved')} style={{ background: '#22c55e', color: '#000', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Approve Pro</button>
                            <button onClick={() => handleProAction(u.username, 'none')} style={{ background: '#334155', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Deny</button>
                          </>
                        )}
                        {u.account_status === 'active' ? (
                          <button onClick={() => handleAccountStatus(u.username, 'suspended')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Suspend</button>
                        ) : (
                          <button onClick={() => handleAccountStatus(u.username, 'active')} style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Restore</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Profile Reports */}
          <section style={{ background: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid #1e293b' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1rem', margin: 0 }}>
              <Flag size={20} /> Profile Reports
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reports.length === 0 ? <p style={{ color: '#64748b' }}>No reports pending.</p> : reports.map(r => (
                <div key={r.id} style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${r.status === 'pending' ? '#facc15' : r.status === 'resolved' ? '#4ade80' : '#94a3b8'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <strong>Target: </strong> <a href={`/${r.reported_username}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>@{r.reported_username}</a>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '1rem' }}>By: {r.reporter_id || 'Anonymous'}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>{r.status}</span>
                  </div>
                  <p style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', margin: 0, border: '1px solid #334155' }}>{r.reason}</p>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => handleReportAction(r.id, 'resolved')} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', color: '#4ade80', border: '1px solid #4ade80', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}><CheckCircle size={14} /> Mark Resolved</button>
                        <button onClick={() => handleReportAction(r.id, 'dismissed')} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', color: '#94a3b8', border: '1px solid #94a3b8', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}><XCircle size={14} /> Dismiss</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
