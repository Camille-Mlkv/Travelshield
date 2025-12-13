import { Link, useNavigate } from 'react-router-dom';
import './Layout.css';

const Header = ({ currentUserId, isAuthenticated, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="logo-container">
        <h1 className="logo">🛡️ TravelShield</h1>
        <nav className="nav">
          <Link to="/" className="nav-link">Главная</Link>
          {isAuthenticated && (
            <>
              <Link to="/wallets" className="nav-link">Кошельки</Link>
              <Link to="/policies" className="nav-link">Полисы</Link>
            </>
          )}
        </nav>
      </div>
      
      <div className="user-info">
        {isAuthenticated ? (
          <>
            {currentUserId && (
              <div className="user-id">
                <span className="user-id-label">User ID:</span>
                <span className="user-id-value">
                  {currentUserId.substring(0, 10) + '...'}
                </span>
              </div>
            )}
            <button 
              className="logout-button"
              onClick={onLogout}
            >
              Выйти
            </button>
          </>
        ) : (
          <button 
            className="login-button"
            onClick={() => navigate('/login')}
          >
            Войти
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;