/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, react-hooks/immutability */
import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthForm from './components/AuthForm';
import CreatorDashboard from './components/CreatorDashboard';
import PublicBioPage from './components/PublicBioPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');

  // Sync state on popstate change and handle legacy hashes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    
    // Handle legacy hash routing redirect
    if (window.location.hash) {
      const hash = window.location.hash;
      if (hash.startsWith('#p/')) {
        const username = hash.replace('#p/', '');
        window.history.replaceState(null, '', `/@${username}`);
        setCurrentPath(`/@${username}`);
      } else if (hash === '#auth') {
        window.history.replaceState(null, '', '/auth');
        setCurrentPath('/auth');
      } else if (hash === '#dashboard') {
        window.history.replaceState(null, '', '/dashboard');
        setCurrentPath('/dashboard');
      } else {
        window.history.replaceState(null, '', '/');
        setCurrentPath('/');
      }
    }

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
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateTo = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  const handleAuthSuccess = (username) => {
    const cachedUser = localStorage.getItem('auralink_user');
    let currentRole = 'user';
    if (cachedUser) {
      currentRole = JSON.parse(cachedUser).role || 'user';
    }
    setUser(username);
    setRole(currentRole);
    navigateTo('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auralink_user');
    setUser(null);
    navigateTo('/');
  };

  // Route resolver
  // 1. Check if public profile view: e.g. /@username
  if (currentPath.startsWith('/@')) {
    const username = currentPath.replace('/@', '').trim();
    return <PublicBioPage username={username} />;
  }

  // 2. Check fallback profile path: e.g. /p/username
  if (currentPath.startsWith('/p/')) {
    const username = currentPath.replace('/p/', '').trim();
    return <PublicBioPage username={username} />;
  }

  // 3. Main Views
  switch (currentPath) {
    case '/auth':
      return (
        <AuthForm 
          onAuthSuccess={handleAuthSuccess} 
          onBackToHome={() => navigateTo('/')} 
        />
      );
      
    case '/dashboard':
      if (!user) {
        // Redirect to auth if not logged in
        window.history.replaceState(null, '', '/auth');
        setCurrentPath('/auth');
        return null;
      }
      return (
        <CreatorDashboard 
          username={user} 
          onLogout={handleLogout} 
          isAdmin={role === 'admin'}
          onUsernameChange={(newUsername) => {
            setUser(newUsername);
            const cachedUser = localStorage.getItem('auralink_user');
            if (cachedUser) {
              try {
                const userObj = JSON.parse(cachedUser);
                userObj.username = newUsername;
                localStorage.setItem('auralink_user', JSON.stringify(userObj));
              } catch (e) { /* ignore */ }
            }
            navigateTo('/dashboard');
          }}
        />
      );
    default:
      return <LandingPage onNavigate={navigateTo} />;
  }
}
