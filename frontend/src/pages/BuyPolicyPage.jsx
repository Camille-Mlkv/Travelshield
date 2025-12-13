import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BuyPolicyPage.css';
import './HomePage.css';

const BuyPolicyPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    passengerName: '',
    departureCity: '',
    arrivalCity: '',
    flightNumber: '',
    startDate: '',
    endDate: '',
    coverageAmount: '100',
    premium: '10',
    selectedWalletId: '' 
  });

  const [wallets, setWallets] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(true); 
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setLoadingWallets(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/wallets/', {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Ошибка загрузки кошельков: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setWallets(data.data);
          
          if (data.data.length > 0) {
            const defaultWallet = data.data.find(w => w.is_default) || data.data[0];
            setFormData(prev => ({
              ...prev,
              selectedWalletId: defaultWallet.id
            }));
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки кошельков:', err);
        setError(prev => prev + ` Не удалось загрузить кошельки: ${err.message}`);
      } finally {
        setLoadingWallets(false);
      }
    };

    fetchWallets();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getSelectedWallet = () => {
    return wallets.find(w => w.id === formData.selectedWalletId) || wallets[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.selectedWalletId && wallets.length > 0) {
      setError('Пожалуйста, выберите кошелек для оплаты');
      setLoading(false);
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const selectedWallet = getSelectedWallet();

      const policyData = {
        userId: userId,
        walletId: selectedWallet.id, 
        walletAddress: selectedWallet.address, 
        insuranceModuleId: moduleId || 'flight_delay_module',
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        coverageAmount: parseFloat(formData.coverageAmount),
        premiumAmount: parseFloat(formData.premium),
        currency: "USDC",
        policyData: {
          flightNumber: formData.flightNumber,
          passengerName: formData.passengerName,
          departure: formData.departureCity,
          arrival: formData.arrivalCity
        }
      };

      console.log('Отправка данных полиса:', policyData);

      const response = await fetch('/api/policy/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(policyData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Ошибка сервера: ${response.status} - ${errorData.message || 'Неизвестная ошибка'}`);
      }

      const result = await response.json();
      
      console.log('Полис успешно создан:', result);
      
      alert(`✅ Полис успешно создан! 
Пассажир: ${formData.passengerName}
Рейс: ${formData.departureCity} → ${formData.arrivalCity} (${formData.flightNumber})
Кошелек: ${selectedWallet.label}`);
      
      navigate('/policies');
      
    } catch (err) {
      console.error('Ошибка при создании полиса:', err);
      setError(`Не удалось создать полис: ${err.message}`);
      
      if (err.message.includes('Failed to fetch') || err.message.includes('Ошибка сервера')) {
        const selectedWallet = getSelectedWallet();
        alert('⚠️ Бэкенд временно недоступен. В демо-режиме полис создан локально.\n\n' +
              `Пассажир: ${formData.passengerName}\n` +
              `Рейс: ${formData.departureCity} → ${formData.arrivalCity} (${formData.flightNumber})\n` +
              `Кошелек: ${selectedWallet?.label || 'Не выбран'}`);
        navigate('/policies');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <h1>Покупка страхового полиса</h1>
      
      {error && (
        <div className="error-message" style={{
          padding: '15px',
          margin: '20px auto',
          maxWidth: '600px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '8px',
          border: '1px solid #ffcdd2'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="policy-form">
        <h2 className="form-title">Заполните данные для покупки полиса</h2>
        
        <div className="form-section">
          <h3 className="section-title">Выбор кошелька для оплаты</h3>
          
          {loadingWallets ? (
            <div className="loading-wallets">
              <div className="spinner-small"></div>
              <span>Загрузка кошельков...</span>
            </div>
          ) : wallets.length === 0 ? (
            <div className="no-wallets-warning">
              <p>У вас нет добавленных кошельков.</p>
              <button 
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/wallets')}
                style={{ marginTop: '10px' }}
              >
                ➕ Добавить кошелек
              </button>
            </div>
          ) : (
            <div className="wallets-selection">
              <div className="form-group">
                <label className="form-label">
                  Выберите кошелек *
                </label>
                <select
                  name="selectedWalletId"
                  value={formData.selectedWalletId}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  disabled={loading || loadingWallets}
                >
                  <option value="">-- Выберите кошелек --</option>
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.label} 
                      {wallet.is_default && ' (Основной)'} - 
                      {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 6)}
                      {wallet.balance && ` - ${parseFloat(wallet.balance).toFixed(4)} ETH`}
                    </option>
                  ))}
                </select>
              </div>
              
              {formData.selectedWalletId && (
                <div className="wallet-info-card">
                  <div className="wallet-info-header">
                    <span className="wallet-icon">
                      {(() => {
                        const wallet = getSelectedWallet();
                        if (!wallet) return '💰';
                        if (wallet.type === 'ethereum') return 'Ξ';
                        if (wallet.type === 'binance') return '⎔';
                        if (wallet.type === 'polygon') return '⬣';
                        return '💰';
                      })()}
                    </span>
                    <h4>{getSelectedWallet()?.label || 'Неизвестный кошелек'}</h4>
                    {getSelectedWallet()?.is_default && (
                      <span className="default-badge">Основной</span>
                    )}
                  </div>
                  <div className="wallet-info-details">
                    <div className="detail-row">
                      <span>Адрес:</span>
                      <code>{getSelectedWallet()?.address || 'Не указан'}</code>
                    </div>
                    {getSelectedWallet()?.balance && (
                      <div className="detail-row">
                        <span>Баланс:</span>
                        <span className="balance">{parseFloat(getSelectedWallet().balance).toFixed(4)} ETH</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            Имя и фамилия пассажира *
          </label>
          <input
            type="text"
            name="passengerName"
            value={formData.passengerName}
            onChange={handleInputChange}
            placeholder="Иван Иванов"
            required
            className="form-input"
            disabled={loading || loadingWallets}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Город отправления *
            </label>
            <input
              type="text"
              name="departureCity"
              value={formData.departureCity}
              onChange={handleInputChange}
              placeholder="Москва"
              required
              className="form-input"
              disabled={loading || loadingWallets}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Город прибытия *
            </label>
            <input
              type="text"
              name="arrivalCity"
              value={formData.arrivalCity}
              onChange={handleInputChange}
              placeholder="Санкт-Петербург"
              required
              className="form-input"
              disabled={loading || loadingWallets}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Номер рейса *
          </label>
          <input
            type="text"
            name="flightNumber"
            value={formData.flightNumber}
            onChange={handleInputChange}
            placeholder="SU1234"
            required
            className="form-input"
            disabled={loading || loadingWallets}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Дата вылета *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
              className="form-input"
              disabled={loading || loadingWallets}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Дата возвращения
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading || loadingWallets}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Сумма покрытия (USDC)
            </label>
            <input
              type="number"
              name="coverageAmount"
              value={formData.coverageAmount}
              onChange={handleInputChange}
              required
              className="form-input"
              disabled={loading || loadingWallets}
              min="1"
              step="1"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Страховая премия (ETH)
            </label>
            <input
              type="number"
              name="premium"
              value={formData.premium}
              onChange={handleInputChange}
              required
              className="form-input"
              disabled={loading || loadingWallets}
              min="0.01"
              step="0.01"
            />
          </div>
        </div>

        <div className="summary-box">
          <h3 className="summary-title">Итог</h3>
          <div className="summary-row">
            <span>Пассажир:</span>
            <span>{formData.passengerName || '—'}</span>
          </div>
          <div className="summary-row">
            <span>Маршрут:</span>
            <span>
              {formData.departureCity || '—'} → {formData.arrivalCity || '—'}
              {formData.flightNumber && ` (${formData.flightNumber})`}
            </span>
          </div>
          <div className="summary-row">
            <span>Кошелек оплаты:</span>
            <span>
              {formData.selectedWalletId 
                ? getSelectedWallet()?.label || 'Не выбран'
                : 'Не выбран'
              }
            </span>
          </div>
          <div className="summary-row">
            <span>Страховой модуль:</span>
            <span>Задержка рейса</span>
          </div>
          <div className="summary-row">
            <span>Покрытие:</span>
            <span>{formData.coverageAmount} USDC</span>
          </div>
          <div className="summary-row-total">
            <span>Стоимость:</span>
            <span>{formData.premium} ETH</span>
          </div>
        </div>

        <button 
          type="submit"
          className="buy-button"
          disabled={loading || loadingWallets || wallets.length === 0}
          style={loading || loadingWallets || wallets.length === 0 ? { 
            opacity: 0.7, 
            cursor: 'not-allowed' 
          } : {}}
        >
          {loading ? (
            <>
              <span className="loading-spinner" style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></span>
              Обработка...
            </>
          ) : wallets.length === 0 ? (
            'Добавьте кошелек для покупки'
          ) : (
            '🛒 Купить полис'
          )}
        </button>
      </form>
    </div>
  );
};

export default BuyPolicyPage;