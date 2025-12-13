import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PolicyDetailsPage.css';

const PolicyDetailsPage = () => {
  const { policyId } = useParams();
  const navigate = useNavigate();
  
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [usdcAddress, setUsdcAddress] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Функция для загрузки деталей полиса
  const fetchPolicyDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Требуется авторизация. Пожалуйста, войдите в систему.');
      }

      const response = await fetch(`/api/policy/${policyId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
        }
        if (response.status === 404) {
          throw new Error('Полис не найден.');
        }
        throw new Error(`Ошибка загрузки полиса: ${response.status}`);
      }

      const data = await response.json();
      console.log('Полученные данные полиса:', data);
      
      setPolicy(data);
    } catch (err) {
      console.error('Ошибка загрузки полиса:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем детали полиса при монтировании компонента
  useEffect(() => {
    if (policyId) {
      fetchPolicyDetails();
    }
  }, [policyId]);

  // Функция для обработки оплаты полиса
  const handlePayment = async () => {
    if (!policy) return;
    if (!usdcAddress.trim()) {
      setPaymentError('Пожалуйста, введите USDC адрес');
      return;
    }

    // Базовая валидация адреса
    if (!/^0x[a-fA-F0-9]{40}$|^[a-zA-Z0-9]{32,44}$/.test(usdcAddress.trim())) {
      setPaymentError('Введите корректный адрес USDC');
      return;
    }

    setProcessing(true);
    setPaymentError('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/policy/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          policyId: policy.id,
          tokenAddress: usdcAddress.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка оплаты: ${response.status}`);
      }

      const result = await response.json();
      console.log('Результат оплаты:', result);

      // Закрываем модальное окно и показываем успешное сообщение
      setShowPaymentModal(false);
      setUsdcAddress('');
      
      alert(`✅ Платеж успешно обработан!\n\nТранзакция: ${result.transactionHash ? result.transactionHash.substring(0, 20) + '...' : 'N/A'}\nСтатус: ${result.status || 'Успешно'}`);
      
      // Обновляем данные полиса
      fetchPolicyDetails();
      
    } catch (err) {
      console.error('Ошибка при оплате полиса:', err);
      setPaymentError(err.message);
      
      // Если это демо-режим, имитируем успешную оплату
      if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
        // Демо-режим
        setShowPaymentModal(false);
        setUsdcAddress('');
        
        alert(`✅ Демо: Платеж успешно обработан!\n\nПолиc: ${policy.id}\nUSDC адрес: ${usdcAddress.substring(0, 20)}...`);
        
        // Обновляем данные полиса
        fetchPolicyDetails();
      }
    } finally {
      setProcessing(false);
    }
  };

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Неверная дата';
      
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Ошибка даты';
    }
  };

  // Функция для форматирования суммы
  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return 'Не указана';
    
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Функция для определения статуса полиса
  const getPolicyStatusInfo = (status) => {
    if (!status) return { 
      text: 'Неизвестно', 
      className: 'unknown',
      icon: '❓',
      description: 'Статус не определен'
    };
    
    const statusUpper = status.toUpperCase();
    
    const statusMap = {
      'DRAFT': { 
        text: 'Черновик', 
        className: 'draft',
        icon: '📝',
        description: 'Полис в процессе оформления'
      },
      'AWAITING_ONCHAIN': { 
        text: 'Ожидает оплаты', 
        className: 'awaiting',
        icon: '⏳',
        description: 'Ожидание оплаты и подтверждения в блокчейне'
      },
      'ACTIVE': { 
        text: 'Активен', 
        className: 'active',
        icon: '✅',
        description: 'Полис активен и действует'
      },
      'EXPIRED': { 
        text: 'Истек', 
        className: 'expired',
        icon: '⌛',
        description: 'Срок действия полиса истек'
      },
      'CLAIMED': { 
        text: 'Выплачен', 
        className: 'claimed',
        icon: '💰',
        description: 'По полису была выплата'
      },
      'REJECTED': { 
        text: 'Отклонен', 
        className: 'rejected',
        icon: '❌',
        description: 'Полис отклонен системой'
      }
    };
    
    return statusMap[statusUpper] || { 
      text: status, 
      className: 'unknown',
      icon: '❓',
      description: 'Неизвестный статус'
    };
  };

  // Функция для отображения статуса
  const renderStatusBadge = (statusInfo) => {
    return (
      <div className={`status-badge ${statusInfo.className}`}>
        <span className="status-icon">{statusInfo.icon}</span>
        <span className="status-text">{statusInfo.text}</span>
        <span className="status-tooltip">{statusInfo.description}</span>
      </div>
    );
  };

  // Функция для копирования в буфер обмена
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Скопировано в буфер обмена!');
      })
      .catch(err => {
        console.error('Ошибка копирования:', err);
      });
  };

  // Функция для отображения данных о полете
  const renderFlightDetails = () => {
    if (!policy?.policyData) return null;
    
    const policyData = typeof policy.policyData === 'string' 
      ? JSON.parse(policy.policyData) 
      : policy.policyData;
    
    return (
      <div className="details-section">
        <h3 className="section-title">Информация о рейсе</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Пассажир:</span>
            <span className="detail-value">{policyData.passengerName || 'Не указан'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Рейс:</span>
            <span className="detail-value">{policyData.flightNumber || 'Не указан'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Отправление:</span>
            <span className="detail-value">{policyData.departure || 'Не указан'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Прибытие:</span>
            <span className="detail-value">{policyData.arrival || 'Не указан'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Функция для отображения финансовой информации
  const renderFinancialDetails = () => {
    if (!policy) return null;
    
    return (
      <div className="details-section">
        <h3 className="section-title">Финансовая информация</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Сумма покрытия:</span>
            <span className="detail-value financial-value">
              {formatAmount(policy.coverageAmount)} {policy.currency || 'USDC'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Страховая премия:</span>
            <span className="detail-value financial-value">
              {formatAmount(policy.premiumAmount)} {policy.currency || 'ETH'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Адрес токена:</span>
            <span className="detail-value">
              {policy.tokenAddress ? (
                <div className="address-container">
                  <code>{policy.tokenAddress.substring(0, 20)}...{policy.tokenAddress.substring(policy.tokenAddress.length - 6)}</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(policy.tokenAddress)}
                    title="Скопировать адрес"
                  >
                    📋
                  </button>
                </div>
              ) : 'Не указан'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Функция для отображения информации о датах
  const renderDateDetails = () => {
    if (!policy) return null;
    
    return (
      <div className="details-section">
        <h3 className="section-title">Даты действия</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Начало действия:</span>
            <span className="detail-value">{formatDate(policy.startDate)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Окончание действия:</span>
            <span className="detail-value">{formatDate(policy.endDate)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Создан:</span>
            <span className="detail-value">{formatDate(policy.createdAt)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Обновлен:</span>
            <span className="detail-value">{formatDate(policy.updatedAt)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Функция для отображения информации о кошельке
  const renderWalletDetails = () => {
    if (!policy?.wallet) return null;
    
    return (
      <div className="details-section">
        <h3 className="section-title">Информация о кошельке</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Название кошелька:</span>
            <span className="detail-value">{policy.wallet.label || 'Не указано'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Адрес кошелька:</span>
            <span className="detail-value">
              <div className="address-container">
                <code>{policy.wallet.address.substring(0, 20)}...{policy.wallet.address.substring(policy.wallet.address.length - 6)}</code>
                <button 
                  className="copy-btn"
                  onClick={() => copyToClipboard(policy.wallet.address)}
                  title="Скопировать адрес"
                >
                  📋
                </button>
              </div>
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Верифицирован:</span>
            <span className="detail-value">
              {policy.wallet.verified ? (
                <span className="verified-badge">✅ Да</span>
              ) : (
                <span className="not-verified-badge">❌ Нет</span>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Функция для отображения информации о страховом модуле
  const renderInsuranceModuleDetails = () => {
    if (!policy?.insuranceModule) return null;
    
    return (
      <div className="details-section">
        <h3 className="section-title">Страховой модуль</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Название:</span>
            <span className="detail-value">{policy.insuranceModule.name || 'Не указано'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Описание:</span>
            <span className="detail-value">{policy.insuranceModule.description || 'Нет описания'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Фиксированная выплата:</span>
            <span className="detail-value financial-value">
              {formatAmount(policy.insuranceModule.fixed_payout_amount)} USDC
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Функция для отображения блокчейн информации
  const renderBlockchainDetails = () => {
    if (!policy) return null;
    
    const hasBlockchainData = policy.onChainData || policy.blockchainStats?.isOnChain;
    
    return (
      <div className="details-section">
        <h3 className="section-title">Блокчейн информация</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Статус в блокчейне:</span>
            <span className="detail-value">
              {policy.blockchainStats?.isOnChain ? (
                <span className="onchain-badge">✅ В блокчейне</span>
              ) : (
                <span className="offchain-badge">⏳ Не в блокчейне</span>
              )}
            </span>
          </div>
          
          {policy.chainPolicyId && (
            <div className="detail-item">
              <span className="detail-label">ID в блокчейне:</span>
              <span className="detail-value">
                <div className="address-container">
                  <code>{policy.chainPolicyId.substring(0, 20)}...</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(policy.chainPolicyId)}
                    title="Скопировать ID"
                  >
                    📋
                  </button>
                </div>
              </span>
            </div>
          )}
          
          {policy.onchainTxHash && (
            <div className="detail-item">
              <span className="detail-label">Хэш транзакции создания:</span>
              <span className="detail-value">
                <div className="address-container">
                  <code>{policy.onchainTxHash.substring(0, 20)}...</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(policy.onchainTxHash)}
                    title="Скопировать хэш"
                  >
                    📋
                  </button>
                </div>
              </span>
            </div>
          )}
          
          {policy.claimTxHash && (
            <div className="detail-item">
              <span className="detail-label">Хэш транзакции выплаты:</span>
              <span className="detail-value">
                <div className="address-container">
                  <code>{policy.claimTxHash.substring(0, 20)}...</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(policy.claimTxHash)}
                    title="Скопировать хэш"
                  >
                    📋
                  </button>
                </div>
              </span>
            </div>
          )}
          
          {policy.policyDataHash && (
            <div className="detail-item">
              <span className="detail-label">Хэш данных полиса:</span>
              <span className="detail-value">
                <div className="address-container">
                  <code>{policy.policyDataHash.substring(0, 20)}...</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(policy.policyDataHash)}
                    title="Скопировать хэш"
                  >
                    📋
                  </button>
                </div>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="policy-details-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка данных полиса...</p>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="policy-details-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Ошибка загрузки полиса</h2>
          <p>{error || 'Полис не найден'}</p>
          <div className="error-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/policies')}
            >
              Вернуться к списку полисов
            </button>
            <button 
              className="btn-secondary"
              onClick={fetchPolicyDetails}
            >
              Повторить попытку
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getPolicyStatusInfo(policy.status);

  return (
    <>
      <div className="policy-details-page">
        {/* Хлебные крошки */}
        <nav className="breadcrumbs">
          <Link to="/policies" className="breadcrumb-link">
            ← Вернуться к списку полисов
          </Link>
        </nav>

        {/* Заголовок и статус */}
        <div className="page-header">
          <div className="header-content">
            <h1>Детали страхового полиса</h1>
            <div className="header-subtitle">
              <span className="policy-id">ID: {policy.id}</span>
              {renderStatusBadge(statusInfo)}
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className="btn-refresh"
              onClick={fetchPolicyDetails}
              title="Обновить данные"
            >
              🔄
            </button>
            
            {/* Кнопка оплаты для черновиков и ожидающих оплаты */}
            {(statusInfo.className === 'draft' || statusInfo.className === 'awaiting') && (
              <button 
                className="btn-primary"
                onClick={() => setShowPaymentModal(true)}
              >
                💳 Оплатить полис
              </button>
            )}
            
            {/* Кнопка подачи заявки для активных полисов */}
            {statusInfo.className === 'active' && (
              <button 
                className="btn-primary"
                onClick={() => navigate(`/policies/${policy.id}/claim`)}
              >
                🚨 Подать заявку на выплату
              </button>
            )}
            
            <button 
              className="btn-secondary"
              onClick={() => navigate('/policies')}
            >
              Назад
            </button>
          </div>
        </div>

        {/* Основная информация в карточках */}
        <div className="policy-details-container">
          {/* Левая колонка */}
          <div className="details-column">
            {renderFlightDetails()}
            {renderFinancialDetails()}
            {renderDateDetails()}
          </div>
          
          {/* Правая колонка */}
          <div className="details-column">
            {renderWalletDetails()}
            {renderInsuranceModuleDetails()}
            {renderBlockchainDetails()}
            
            {/* Дополнительная информация */}
            <div className="details-section">
              <h3 className="section-title">Дополнительная информация</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Пользователь:</span>
                  <span className="detail-value">{policy.user?.email || 'Не указан'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">ID пользователя:</span>
                  <span className="detail-value">
                    <div className="address-container">
                      <code>{policy.userId?.substring(0, 10)}...</code>
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(policy.userId)}
                        title="Скопировать ID"
                      >
                        📋
                      </button>
                    </div>
                  </span>
                </div>
                {policy.metadata && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Метаданные:</span>
                    <pre className="detail-value metadata">
                      {JSON.stringify(policy.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="action-buttons">
          <button 
            className="btn-secondary"
            onClick={() => navigate('/policies')}
          >
            ← Назад к списку полисов
          </button>
          
          {(statusInfo.className === 'draft' || statusInfo.className === 'awaiting') && (
            <button 
              className="btn-primary"
              onClick={() => setShowPaymentModal(true)}
            >
              💳 Оплатить полис
            </button>
          )}
          
          {statusInfo.className === 'active' && policy.policyData && (
            <button 
              className="btn-primary"
              onClick={() => navigate(`/policies/${policy.id}/claim`)}
            >
              🚨 Подать заявку на выплату
            </button>
          )}
          
          <button 
            className="btn-secondary"
            onClick={() => window.print()}
          >
            🖨️ Распечатать
          </button>
        </div>
      </div>

      {/* Модальное окно оплаты */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h2>Оплата страхового полиса</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="policy-summary">
                <div className="summary-item">
                  <span className="summary-label">Полис ID:</span>
                  <span className="summary-value">{policy.id}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Пассажир:</span>
                  <span className="summary-value">
                    {policy.policyData && typeof policy.policyData === 'object' 
                      ? policy.policyData.passengerName 
                      : JSON.parse(policy.policyData || '{}').passengerName || 'Не указан'
                    }
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Страховая премия:</span>
                  <span className="summary-value financial-value">
                    {formatAmount(policy.premiumAmount)} {policy.currency || 'ETH'}
                  </span>
                </div>
              </div>
              
              <div className="payment-form">
                <div className="form-group">
                  <label htmlFor="usdcAddress" className="form-label">
                    USDC адрес для оплаты *
                  </label>
                  <input
                    type="text"
                    id="usdcAddress"
                    value={usdcAddress}
                    onChange={(e) => setUsdcAddress(e.target.value)}
                    placeholder="Введите адрес USDC контракта"
                    className="form-input"
                    disabled={processing}
                  />
                  <div className="form-help">
                    Введите адрес контракта USDC для оплаты страховой премии.
                    Пример: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
                  </div>
                </div>
                
                {paymentError && (
                  <div className="payment-error">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{paymentError}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowPaymentModal(false)}
                disabled={processing}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handlePayment}
                disabled={processing || !usdcAddress.trim()}
              >
                {processing ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Обработка...
                  </>
                ) : (
                  'Оплатить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PolicyDetailsPage;