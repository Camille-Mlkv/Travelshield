import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    let userId = Cookies.get('currentUserId');
    
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      Cookies.set('currentUserId', userId, { expires: 7 });
    }
    
    setCurrentUserId(userId);
  }, []);

  return (
    <div className="layout">
      <Header currentUserId={currentUserId} />
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>TravelShield © 2024</p>
        <p>User ID: {currentUserId ? currentUserId.substring(0, 10) + '...' : ''}</p>
      </footer>
    </div>
  );
};

export default Layout;