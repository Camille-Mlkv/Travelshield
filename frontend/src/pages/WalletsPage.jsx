import React, { useState, useEffect } from 'react';
import './WalletsPage.css';

const WalletsPage = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWallet, setNewWallet] = useState({
    label: '',
    address: ''
  });

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/wallets/', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setWallets(data.data);
      } else {
        setWallets([]);
      }
    } catch (err) {
      console.error('Ошибка загрузки кошельков:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleAddWallet = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/wallets/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          label: newWallet.label,
          address: newWallet.address,
          type: newWallet.type
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 500) { 
          throw new Error('Кошелек с таким адресом уже добавлен в ваш аккаунт');
        }

        throw new Error(data.message || 'Ошибка добавления кошелька');
      }

      setNewWallet({ label: '', address: '' });
      setShowAddForm(false);
      fetchWallets(); 
      
    } catch (err) {
      console.error('Ошибка добавления кошелька:', err);
      setError(err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Адрес скопирован в буфер обмена!');
      })
      .catch(err => {
        console.error('Ошибка копирования:', err);
      });
  };

  if (loading) {
    return (
      <div className="wallets-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка кошельков...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallets-page">
      <div className="page-header">
        <h1>Мои кошельки</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Отмена' : '+ Добавить кошелек'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchWallets} className="retry-btn">
            Повторить
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="add-wallet-form">
          <form onSubmit={handleAddWallet}>
            <div className="form-group">
              <label>Название кошелька</label>
              <input
                type="text"
                value={newWallet.label}
                onChange={(e) => setNewWallet({...newWallet, label: e.target.value})}
                placeholder="Например: Основной кошелек"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Адрес кошелька</label>
              <input
                type="text"
                value={newWallet.address}
                onChange={(e) => setNewWallet({...newWallet, address: e.target.value})}
                placeholder="0x..."
                required
                pattern="^0x[a-fA-F0-9]{40}$"
              />
              <small className="form-help">Введите корректный адрес Ethereum (42 символа, начинается с 0x)</small>
            </div>
            
            <div className="form-group">
              <label>Тип кошелька</label>
              <select
                value={newWallet.type}
                onChange={(e) => setNewWallet({...newWallet, type: e.target.value})}
              >
                <option value="ethereum">Ethereum</option>
                <option value="binance">Binance Smart Chain</option>
                <option value="polygon">Polygon</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="other">Другой</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Добавить кошелек
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {wallets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <h3>У вас еще нет кошельков</h3>
          <p>Добавьте свой первый кошелек, чтобы начать работу</p>
        </div>
      ) : (
        <div className="wallets-grid">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="wallet-card">
              <div className="wallet-header">
                <div className="wallet-icon">
                  {wallet.type === 'ethereum' ? 'Ξ' : 
                   wallet.type === 'binance' ? '⎔' : 
                   wallet.type === 'polygon' ? '⬣' : '💰'}
                </div>
                <div className="wallet-info">
                  <h3>{wallet.label}</h3>
                </div>
              </div>
              
              <div className="wallet-address">
                <span className="address-label">Адрес:</span>
                <div className="address-value">
                  <code>{wallet.address.substring(0, 20)}...{wallet.address.substring(wallet.address.length - 6)}</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(wallet.address)}
                    title="Скопировать адрес"
                  >
                    📋
                  </button>
                </div>
              </div>
              
              {wallet.balance && (
                <div className="wallet-balance">
                  <span className="balance-label">Баланс:</span>
                  <span className="balance-value">
                    {parseFloat(wallet.balance).toFixed(4)} ETH
                  </span>
                </div>
              )}
              
              <div className="wallet-meta">
                <span className="meta-item">
                  Добавлен: {new Date(wallet.created_at).toLocaleDateString()}
                </span>
                {wallet.is_default && (
                  <span className="default-badge">Основной</span>
                )}
              </div>
              
              <div className="wallet-actions">
                <button 
                  className="action-btn view-btn"
                  onClick={() => copyToClipboard(wallet.address)}
                >
                  Копировать адрес
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletsPage;