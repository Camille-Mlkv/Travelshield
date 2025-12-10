import Header from './Header';
import './Layout.css';

const Layout = ({ 
  children, 
  isAuthenticated, 
  currentUserId, 
  onLogout, 
  userData 
}) => {
  return (
    <div className="layout">
      <Header 
        currentUserId={currentUserId}
        isAuthenticated={isAuthenticated}
        onLogout={onLogout}
        userData={userData}
      />
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>TravelShield © 2024</p>
        {currentUserId && (
          <p>User ID: {currentUserId.substring(0, 10) + '...'}</p>
        )}
      </footer>
    </div>
  );
};

export default Layout;