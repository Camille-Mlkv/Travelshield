import { Link } from 'react-router-dom';
import './Layout.css';

const Header = ({ currentUserId }) => {
  return (
    <header className="header">
      <div className="logo-container">
        <h1 className="logo">🛡️ TravelShield</h1>
        <nav className="nav">
          <Link to="/" className="nav-link">Главная</Link>
          <Link to="/wallets" className="nav-link">Кошельки</Link>
          <Link to="/policies" className="nav-link">Полисы</Link>
        </nav>
      </div>
      
      <div className="user-info">
        <div className="user-id">
          <span className="user-id-label">User ID:</span>
          <span className="user-id-value">
            {currentUserId ? currentUserId.substring(0, 10) + '...' : 'Loading...'}
          </span>
        </div>
        
        <button 
          className="connect-button"
          onClick={() => alert('Для подключения кошелька установите Web3 пакеты')}
        >
          Connect Wallet
        </button>
      </div>
    </header>
  );
};

export default Header;