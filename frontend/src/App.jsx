import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthForm from './components/AuthForm';
import CreatorDashboard from './components/CreatorDashboard';
import PublicBioPage from './components/PublicBioPage';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');

  // Sync state on hash change
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#');
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Check if session exists on load
    const cachedUser = localStorage.getItem('auralink_user');
    if (cachedUser) {
      try {
        const userObj = JSON.parse(cachedUser);
        setUser(userObj.username);
        setRole(userObj.role || 'user');
      } catch (e) {
        localStorage.removeItem('auralink_user');
      }
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateTo = (hash) => {
    window.location.hash = hash;
    setCurrentHash(hash);
  };

  const handleAuthSuccess = (username) => {
    const cachedUser = localStorage.getItem('auralink_user');
    let currentRole = 'user';
    if (cachedUser) {
      currentRole = JSON.parse(cachedUser).role || 'user';
    }
    setUser(username);
    setRole(currentRole);
    if (currentRole === 'admin') navigateTo('#admin');
    else navigateTo('#dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auralink_user');
    setUser(null);
    navigateTo('#');
  };

  // Route resolver
  // 1. Check if public profile view: e.g. #p/username or #p/creator1
  if (currentHash.startsWith('#p/')) {
    const username = currentHash.replace('#p/', '').trim();
    return <PublicBioPage username={username} />;
  }

  // 2. Check path names as fallback (supports localhost/p/username)
  const pathname = window.location.pathname;
  if (pathname.startsWith('/p/')) {
    const username = pathname.replace('/p/', '').trim();
    return <PublicBioPage username={username} />;
  }

  // 3. Main Views
  switch (currentHash) {
    case '#auth':
      return (
        <AuthForm 
          onAuthSuccess={handleAuthSuccess} 
          onBackToHome={() => navigateTo('#')} 
        />
      );
      
    case '#dashboard':
      if (!user) {
        // Redirect to auth if not logged in
        window.location.hash = '#auth';
        return null;
      }
      return (
        <CreatorDashboard 
          username={user} 
          onLogout={handleLogout} 
        />
      );
      
    case '#admin':
      if (!user || role !== 'admin') {
        window.location.hash = '#auth';
        return null;
      }
      return (
        <AdminDashboard 
          onLogout={handleLogout} 
        />
      );
      
    default:
      return <LandingPage onNavigate={navigateTo} />;
  }
}
