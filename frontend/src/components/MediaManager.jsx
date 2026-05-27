/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Image, Upload, Trash2, X, RefreshCw, CheckCircle2 } from 'lucide-react';

const API_BASE = '/api';

export default function MediaManager({ username, isPro, onSelectImage, onClose }) {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/media/${username}`);
      if (!res.ok) throw new Error('Failed to fetch media files');
      const data = await res.json();
      setMediaFiles(data.files || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [username]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);

    try {
      setUploading(true);
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        await fetchMedia();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading:', err);
      alert('An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e, fileKey) => {
    e.stopPropagation(); // Prevent selection
    if (!confirm('Are you sure you want to permanently delete this image?')) return;

    // fileKey is typically "User/username/uuid.ext". We just need the filename.
    const filename = fileKey.split('/').pop();

    try {
      const res = await fetch(`${API_BASE}/media/${username}/${filename}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMediaFiles(prev => prev.filter(f => f.key !== fileKey));
      } else {
        alert('Failed to delete file');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting.');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#0f172a', width: '90%', maxWidth: '800px', height: '80vh',
        borderRadius: '16px', display: 'flex', flexDirection: 'column',
        border: '1px solid #1e293b', overflow: 'hidden', color: '#fff'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
            <Image className="text-primary" size={24} /> My Media Library
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Storage usage meter */}
        {(() => {
          const totalSizeBytes = mediaFiles.reduce((sum, f) => sum + (f.size || 0), 0);
          const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
          const limitMB = isPro ? 100 : 15;
          const percentage = Math.min((totalSizeBytes / (limitMB * 1024 * 1024)) * 100, 100).toFixed(1);

          return (
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1e293b', background: '#0b0f19' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span>Storage Used: <strong style={{ color: '#fff' }}>{totalSizeMB} MB</strong> / {limitMB} MB ({percentage}%)</span>
                {!isPro && (
                  <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Upgrade to Pro for 100MB</span>
                )}
              </div>
              <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${percentage}%`, 
                  height: '100%', 
                  background: parseFloat(percentage) > 90 ? 'var(--danger)' : parseFloat(percentage) > 70 ? 'var(--warning)' : 'var(--accent-primary)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          );
        })()}

        {/* Upload Bar */}
        <div style={{ padding: '1.5rem', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#e2e8f0' }}>Upload New Image</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Max size 5MB. JPG, PNG, GIF, WebP.</p>
          </div>
          <label className="btn btn-primary" style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
            {uploading ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />}
            {uploading ? 'Uploading...' : 'Browse Files'}
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/gif, image/webp" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Media Grid */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <RefreshCw className="animate-spin text-primary" size={32} />
            </div>
          ) : error ? (
            <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '2rem' }}>{error}</div>
          ) : mediaFiles.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '4rem' }}>
              <Image size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Your media library is empty.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {mediaFiles.map((file) => (
                <div 
                  key={file.key} 
                  onClick={() => onSelectImage(file.url)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#1e293b',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <img 
                    src={file.url} 
                    alt="Media upload" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  
                  {/* Hover Overlay */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.2s',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0.5rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                  >
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={(e) => handleDelete(e, file.key)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none',
                          padding: '0.3rem', borderRadius: '4px', cursor: 'pointer'
                        }}
                        title="Delete permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div style={{ textAlign: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem auto', color: '#4ade80' }} />
                      Click to use
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
