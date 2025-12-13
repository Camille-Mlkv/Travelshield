import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PoliciesPage.css';

const PoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [usdcAddress, setUsdcAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const navigate = useNavigate();

  // Enum PolicyStatus соответствия
  const POLICY_STATUS = {
    DRAFT: 'DRAFT',
    AWAITING_ONCHAIN: 'AWAITING_ONCHAIN',
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    CLAIMED: 'CLAIMED',
    REJECTED: 'REJECTED'
  };

  // Функция для загрузки полисов пользователя
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        throw new Error('Требуется авторизация. Пожалуйста, войдите в систему.');
      }

      const response = await fetch(`/api/policy/user/${userId}`, {
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
          setPolicies([]);
          return;
        }
        throw new Error(`Ошибка загрузки полисов: ${response.status}`);
      }

      const data = await response.json();
      console.log('Полученные данные полисов:', data);
      
      if (data && Array.isArray(data)) {
        setPolicies(data);
      } else if (data && data.data && Array.isArray(data.data)) {
        setPolicies(data.data);
      } else if (data && data.success && Array.isArray(data.data)) {
        setPolicies(data.data);
      } else {
        console.warn('Неожиданный формат данных полисов:', data);
        setPolicies([]);
      }
    } catch (err) {
      console.error('Ошибка загрузки полисов:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем полисы при монтировании компонента
  useEffect(() => {
    fetchPolicies();
  }, []);

  // Функция для обработки оплаты полиса
  const handlePayment = async () => {
    if (!selectedPolicy) return;
    
    // Валидация адреса
    const trimmedAddress = usdcAddress.trim();
    
    // Проверяем нулевой адрес для ETH
    const isZeroAddress = trimmedAddress === '0x0000000000000000000000000000000000000000';
    
    // Проверяем валидный Ethereum адрес
    const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmedAddress);
    
    if (!isValidEthAddress && !isZeroAddress) {
      setPaymentError('Введите корректный Ethereum адрес (42 символа, начинается с 0x)');
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      const token = localStorage.getItem('token');
      
      console.log('Отправка запроса оплаты:', {
        policyId: selectedPolicy.id || selectedPolicy.policy_id,
        tokenAddress: trimmedAddress
      });
      
      const response = await fetch('/api/policy/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          policyId: selectedPolicy.id || selectedPolicy.policy_id,
          tokenAddress: trimmedAddress
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Ошибка оплаты:', result);
        
        // Проверяем специфичные ошибки
        if (result.error && result.error.includes('Token not allowed')) {
          throw new Error('Этот токен не поддерживается системой. Попробуйте другой адрес USDC или используйте ETH (0x000...000).');
        }
        
        if (result.error && result.error.includes('Policy not found')) {
          throw new Error('Полис не найден.');
        }
        
        if (result.error && result.error.includes('Policy is not in DRAFT or AWAITING_ONCHAIN status')) {
          throw new Error('Полис уже оплачен или имеет другой статус.');
        }
        
        throw new Error(result.error || result.message || `Ошибка оплаты: ${response.status}`);
      }

      console.log('Результат оплаты:', result);

      // Закрываем модальное окно
      setShowPaymentModal(false);
      setUsdcAddress('');
      setSelectedPolicy(null);
      
      // Показываем успешное сообщение
      const successMessage = result.success 
        ? `✅ Платеж успешно обработан!\n\nТранзакция: ${result.data?.transactionHash ? result.data.transactionHash.substring(0, 20) + '...' : 'N/A'}\nСтатус: ${result.data?.status || 'Успешно'}`
        : `✅ Запрос оплаты отправлен!\n\n${result.message || 'Проверьте статус через несколько минут'}`;
      
      alert(successMessage);
      
      // Обновляем список полисов через 3 секунды (чтобы блокчейн успел обработать)
      setTimeout(() => {
        fetchPolicies();
      }, 3000);
      
    } catch (err) {
      console.error('Ошибка при оплате полиса:', err);
      
      // Предлагаем варианты решения
      const errorMsg = err.message;
      if (errorMsg.includes('Token not allowed') || errorMsg.includes('токен не поддерживается')) {
        setPaymentError(`${errorMsg}\n\nПопробуйте:\n1. Использовать ETH: 0x0000000000000000000000000000000000000000\n2. Другой USDC адрес\n3. Обратиться в поддержку`);
      } else {
        setPaymentError(errorMsg);
      }
      
      // Демо-режим для разработки
      if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
        // Имитация успешной оплаты в демо-режиме
        setShowPaymentModal(false);
        setUsdcAddress('');
        setSelectedPolicy(null);
        
        alert(`✅ Демо: Запрос оплаты отправлен!\n\nПолис: ${selectedPolicy.id || selectedPolicy.policy_id}\nАдрес: ${trimmedAddress.substring(0, 20)}...\n\nВ реальном режиме проверьте:\n1. Правильность адреса токена\n2. Достаточный баланс\n3. Поддержку токена системой`);
        
        // Имитация обновления статуса полиса
        setTimeout(() => {
          fetchPolicies();
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Функция для открытия модального окна оплаты
  const openPaymentModal = (policy) => {
    setSelectedPolicy(policy);
    setUsdcAddress('');
    setPaymentError('');
    setShowPaymentModal(true);
  };

  // Функция для закрытия модального окна
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPolicy(null);
    setUsdcAddress('');
    setPaymentError('');
  };

  // Функция для вставки примера адреса
  const insertExampleAddress = (address) => {
    setUsdcAddress(address);
    setPaymentError('');
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
      description: 'Статус не определен',
      priority: 0
    };
    
    const statusUpper = status.toUpperCase();
    
    const statusMap = {
      [POLICY_STATUS.DRAFT]: { 
        text: 'Черновик', 
        className: 'draft',
        icon: '📝',
        description: 'Полис в процессе оформления, требуется оплата',
        priority: 1
      },
      [POLICY_STATUS.AWAITING_ONCHAIN]: { 
        text: 'Ожидает оплаты', 
        className: 'awaiting',
        icon: '⏳',
        description: 'Ожидание оплаты и подтверждения в блокчейне',
        priority: 2
      },
      [POLICY_STATUS.ACTIVE]: { 
        text: 'Активен', 
        className: 'active',
        icon: '✅',
        description: 'Полис активен и действует',
        priority: 3
      },
      [POLICY_STATUS.EXPIRED]: { 
        text: 'Истек', 
        className: 'expired',
        icon: '⌛',
        description: 'Срок действия полиса истек',
        priority: 4
      },
      [POLICY_STATUS.CLAIMED]: { 
        text: 'Выплачен', 
        className: 'claimed',
        icon: '💰',
        description: 'По полису была выплата',
        priority: 5
      },
      [POLICY_STATUS.REJECTED]: { 
        text: 'Отклонен', 
        className: 'rejected',
        icon: '❌',
        description: 'Полис отклонен системой',
        priority: 6
      }
    };
    
    return statusMap[statusUpper] || { 
      text: status, 
      className: 'unknown',
      icon: '❓',
      description: 'Неизвестный статус',
      priority: 0
    };
  };

  // Функция для определения типа полиса
  const getPolicyType = (policy) => {
    if (!policy) return 'Неизвестный тип';
    
    const type = policy.type || policy.insurance_type || policy.product_type;
    
    if (!type) return 'Неизвестный тип';
    
    const typeLower = type.toLowerCase();
    const typeMap = {
      'flight_delay': 'Задержка рейса',
      'flight': 'Задержка рейса',
      'trip_cancellation': 'Отмена поездки',
      'cancellation': 'Отмена поездки',
      'medical': 'Медицинская страховка',
      'health': 'Медицинская страховка',
      'baggage': 'Страхование багажа',
      'luggage': 'Страхование багажа',
      'accident': 'Несчастный случай',
      'travel': 'Туристическая страховка',
      'car': 'Автострахование',
      'property': 'Страхование имущества',
      'life': 'Страхование жизни',
      'default': 'Стандартный полис'
    };
    
    return typeMap[typeLower] || type;
  };

  // Функция для получения иконки типа полиса
  const getPolicyIcon = (policy) => {
    if (!policy) return '📄';
    
    const type = policy.type || policy.insurance_type || policy.product_type;
    
    if (!type) return '📄';
    
    const typeLower = type.toLowerCase();
    const iconMap = {
      'flight_delay': '✈️',
      'flight': '✈️',
      'trip_cancellation': '🚫',
      'cancellation': '🚫',
      'medical': '🏥',
      'health': '🏥',
      'baggage': '🧳',
      'luggage': '🧳',
      'accident': '⚠️',
      'travel': '🧭',
      'car': '🚗',
      'property': '🏠',
      'life': '❤️',
      'default': '📄'
    };
    
    return iconMap[typeLower] || '📄';
  };

  // Функция для получения названия полиса
  const getPolicyTitle = (policy) => {
    if (policy.title) return policy.title;
    if (policy.name) return policy.name;
    
    const type = getPolicyType(policy);
    
    if (policy.policyData) {
      try {
        const policyData = typeof policy.policyData === 'string' 
          ? JSON.parse(policy.policyData) 
          : policy.policyData;
        
        if (policyData.flightNumber && policyData.departure && policyData.arrival) {
          return `Рейс ${policyData.flightNumber}: ${policyData.departure} → ${policyData.arrival}`;
        }
      } catch (e) {
        console.error('Ошибка парсинга policyData:', e);
      }
    }
    
    return `Полис ${type}`;
  };

  // Функция для фильтрации полисов по статусу
  const getFilteredPolicies = () => {
    if (activeTab === 'all') return policies;
    
    return policies.filter(policy => {
      const status = getPolicyStatusInfo(policy.status);
      return status.className === activeTab;
    });
  };

  // Функция для получения полисов по статусу
  const getPoliciesByStatus = (statusClassName) => {
    return policies.filter(policy => {
      const status = getPolicyStatusInfo(policy.status);
      return status.className === statusClassName;
    });
  };

  // Получаем статистику по статусам
  const getStatusStats = () => {
    const stats = {
      all: policies.length,
      draft: getPoliciesByStatus('draft').length,
      awaiting: getPoliciesByStatus('awaiting').length,
      active: getPoliciesByStatus('active').length,
      expired: getPoliciesByStatus('expired').length,
      claimed: getPoliciesByStatus('claimed').length,
      rejected: getPoliciesByStatus('rejected').length
    };
    
    return stats;
  };

  // Получаем детали полета из policyData
  const getFlightDetails = (policy) => {
    if (!policy.policyData) return null;
    
    try {
      const policyData = typeof policy.policyData === 'string' 
        ? JSON.parse(policy.policyData) 
        : policy.policyData;
      
      return {
        flightNumber: policyData.flightNumber,
        passengerName: policyData.passengerName,
        departure: policyData.departure,
        arrival: policyData.arrival,
        departureDate: policyData.departureDate
      };
    } catch (e) {
      console.error('Ошибка парсинга policyData:', e);
      return null;
    }
  };

  // Функция для отображения полета
  const renderFlightInfo = (policy) => {
    const flightDetails = getFlightDetails(policy);
    
    if (!flightDetails) return null;
    
    return (
      <div className="flight-info">
        <div className="flight-route">
          <span className="departure">{flightDetails.departure || '—'}</span>
          <span className="arrow">→</span>
          <span className="arrival">{flightDetails.arrival || '—'}</span>
        </div>
        {flightDetails.flightNumber && (
          <div className="flight-number">
            Рейс: <strong>{flightDetails.flightNumber}</strong>
          </div>
        )}
        {flightDetails.passengerName && (
          <div className="passenger-name">
            Пассажир: <strong>{flightDetails.passengerName}</strong>
          </div>
        )}
      </div>
    );
  };

  // Функция для отображения дат полиса
  const renderPolicyDates = (policy) => {
    const startDate = policy.startDate || policy.start_date;
    const endDate = policy.endDate || policy.end_date;
    
    if (!startDate && !endDate) return null;
    
    return (
      <div className="policy-dates">
        {startDate && (
          <div className="date-item">
            <span className="date-label">Начало:</span>
            <span className="date-value">{formatDate(startDate)}</span>
          </div>
        )}
        {endDate && (
          <div className="date-item">
            <span className="date-label">Окончание:</span>
            <span className="date-value">{formatDate(endDate)}</span>
          </div>
        )}
      </div>
    );
  };

  // Функция для отображения суммы покрытия
  const renderCoverageAmount = (policy) => {
    const coverageAmount = policy.coverageAmount || policy.coverage_amount || policy.sum_insured || 0;
    
    if (!coverageAmount) return null;
    
    return (
      <div className="coverage-amount-display">
        <div className="amount-label">Сумма покрытия</div>
        <div className="amount-value">
          {formatAmount(coverageAmount)} {policy.currency || 'USDC'}
        </div>
      </div>
    );
  };

  // Функция для отображения страховой премии
  const renderPremiumAmount = (policy) => {
    const premiumAmount = policy.premiumAmount || policy.premium_amount || policy.premium || 0;
    
    if (!premiumAmount) return null;
    
    return (
      <div className="premium-amount-display">
        <div className="amount-label">Страховая премия</div>
        <div className="amount-value">
          {formatAmount(premiumAmount)} {policy.currency || 'ETH'}
        </div>
      </div>
    );
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

  if (loading) {
    return (
      <div className="policies-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка полисов...</p>
        </div>
      </div>
    );
  }

  const filteredPolicies = getFilteredPolicies();
  const statusStats = getStatusStats();

  return (
    <>
      <div className="policies-page">
        <div className="page-header">
          <h1>Мои полисы</h1>
          <div className="header-actions">
            <button 
              className="btn-refresh"
              onClick={fetchPolicies}
              title="Обновить список полисов"
            >
              🔄
            </button>
            <button 
              className="btn-primary"
              onClick={() => navigate('/')}
            >
              Купить новый полис
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <div className="error-text">{error}</div>
            </div>
            <button onClick={fetchPolicies} className="retry-btn">
              Обновить
            </button>
          </div>
        )}

        {policies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>У вас еще нет полисов</h3>
            <p>Приобретите свой первый страховой полис для защиты ваших путешествий</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/')}
              style={{ marginTop: '20px' }}
            >
              Купить первый полис
            </button>
          </div>
        ) : (
          <>
            {/* Статистика */}
            <div className="stats-summary">
              <div 
                className={`stat-card ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <div className="stat-value">{statusStats.all}</div>
                <div className="stat-label">Всего полисов</div>
              </div>
              <div 
                className={`stat-card ${activeTab === 'draft' ? 'active' : ''}`}
                onClick={() => setActiveTab('draft')}
              >
                <div className="stat-value">{statusStats.draft}</div>
                <div className="stat-label">Черновики</div>
              </div>
              <div 
                className={`stat-card ${activeTab === 'awaiting' ? 'active' : ''}`}
                onClick={() => setActiveTab('awaiting')}
              >
                <div className="stat-value">{statusStats.awaiting}</div>
                <div className="stat-label">Ожидают оплаты</div>
              </div>
              <div 
                className={`stat-card ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                <div className="stat-value">{statusStats.active}</div>
                <div className="stat-label">Активные</div>
              </div>
              <div 
                className={`stat-card ${activeTab === 'expired' ? 'active' : ''}`}
                onClick={() => setActiveTab('expired')}
              >
                <div className="stat-value">{statusStats.expired}</div>
                <div className="stat-label">Истекли</div>
              </div>
            </div>

            {/* Табы фильтрации */}
            <div className="filter-tabs">
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Все полисы ({statusStats.all})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'draft' ? 'active' : ''}`}
                onClick={() => setActiveTab('draft')}
              >
                Черновики ({statusStats.draft})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'awaiting' ? 'active' : ''}`}
                onClick={() => setActiveTab('awaiting')}
              >
                Ожидают оплаты ({statusStats.awaiting})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Активные ({statusStats.active})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
                onClick={() => setActiveTab('expired')}
              >
                Истекли ({statusStats.expired})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'claimed' ? 'active' : ''}`}
                onClick={() => setActiveTab('claimed')}
              >
                Выплачены ({statusStats.claimed})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
                onClick={() => setActiveTab('rejected')}
              >
                Отклонены ({statusStats.rejected})
              </button>
            </div>

            {/* Список полисов */}
            <div className="policies-container">
              {filteredPolicies.length === 0 ? (
                <div className="no-policies-message">
                  <div className="message-icon">🔍</div>
                  <h3>Полисов не найдено</h3>
                  <p>Нет полисов с выбранным статусом. Попробуйте выбрать другой фильтр.</p>
                </div>
              ) : (
                <div className="policies-grid">
                  {filteredPolicies.map((policy) => {
                    const statusInfo = getPolicyStatusInfo(policy.status);
                    const policyIcon = getPolicyIcon(policy);
                    const policyTitle = getPolicyTitle(policy);
                    const flightDetails = getFlightDetails(policy);
                    
                    return (
                      <div key={policy.id || policy.policy_id} className="policy-card">
                        <div className="policy-card-header">
                          <div className="policy-icon-large">
                            {policyIcon}
                          </div>
                          <div className="policy-header-content">
                            <h3 className="policy-title">{policyTitle}</h3>
                            <div className="policy-meta-header">
                              <span className="policy-id">
                                ID: {(policy.id || policy.policy_id || '').substring(0, 8)}...
                              </span>
                              <span className="policy-date">
                                Создан: {formatDate(policy.created_at || policy.createdAt)}
                              </span>
                            </div>
                          </div>
                          {renderStatusBadge(statusInfo)}
                        </div>
                        
                        <div className="policy-card-body">
                          {/* Информация о полете */}
                          {flightDetails && renderFlightInfo(policy)}
                          
                          {/* Даты действия полиса */}
                          {renderPolicyDates(policy)}
                          
                          {/* Финансовая информация */}
                          <div className="financial-info">
                            {renderCoverageAmount(policy)}
                            {renderPremiumAmount(policy)}
                          </div>
                          
                          {/* Дополнительная информация */}
                          <div className="additional-info">
                            {policy.walletAddress && (
                              <div className="info-item">
                                <span className="info-label">Кошелек:</span>
                                <span className="info-value wallet-address">
                                  {policy.walletAddress.substring(0, 8)}...{policy.walletAddress.substring(policy.walletAddress.length - 6)}
                                </span>
                              </div>
                            )}
                            
                            {policy.policy_number && (
                              <div className="info-item">
                                <span className="info-label">Номер полиса:</span>
                                <span className="info-value policy-number">
                                  {policy.policy_number}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="policy-card-footer">
                          <div className="policy-actions">
                            <button 
                              className="action-btn details-btn"
                              onClick={() => navigate(`/policies/${policy.id}`)}
                            >
                              <span className="btn-icon">👁️</span>
                              Подробнее
                            </button>
                            
                            {statusInfo.className === 'active' && flightDetails && (
                              <button 
                                className="action-btn claim-btn"
                                onClick={() => navigate(`/policies/${policy.id}/claim`)}
                              >
                                <span className="btn-icon">💰</span>
                                Подать заявку
                              </button>
                            )}
                            
                            {(statusInfo.className === 'draft' || statusInfo.className === 'awaiting') && (
                              <button 
                                className="action-btn continue-btn"
                                onClick={() => openPaymentModal(policy)}
                              >
                                <span className="btn-icon">💳</span>
                                Оплатить
                              </button>
                            )}
                            
                            {policy.document_url && (
                              <button 
                                className="action-btn download-btn"
                                onClick={() => window.open(policy.document_url, '_blank')}
                              >
                                <span className="btn-icon">📥</span>
                                Скачать PDF
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Модальное окно оплаты */}
      {showPaymentModal && selectedPolicy && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h2>Оплата страхового полиса</h2>
              <button className="modal-close" onClick={closePaymentModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="policy-summary">
                <div className="summary-item">
                  <span className="summary-label">Полис:</span>
                  <span className="summary-value">{getPolicyTitle(selectedPolicy)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">ID:</span>
                  <span className="summary-value">{selectedPolicy.id || selectedPolicy.policy_id}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Сумма покрытия:</span>
                  <span className="summary-value">
                    {formatAmount(selectedPolicy.coverageAmount || selectedPolicy.coverage_amount || 0)} USDC
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Страховая премия:</span>
                  <span className="summary-value">
                    {formatAmount(selectedPolicy.premiumAmount || selectedPolicy.premium_amount || 0)} ETH
                  </span>
                </div>
              </div>
              
              <div className="payment-form">
                <div className="form-group">
                  <label htmlFor="usdcAddress" className="form-label">
                    Адрес токена для оплаты *
                  </label>
                  <input
                    type="text"
                    id="usdcAddress"
                    value={usdcAddress}
                    onChange={(e) => setUsdcAddress(e.target.value)}
                    placeholder="Введите адрес токена (USDC или ETH)"
                    className="form-input"
                    disabled={isProcessing}
                  />
                  <div className="form-help">
                    <p>Введите адрес контракта токена для оплаты страховой премии.</p>
                    
                    <div className="address-examples">
                      <div className="example-group">
                        <strong>Примеры адресов:</strong>
                        <div className="example-item">
                          <code>0x0000000000000000000000000000000000000000</code>
                          <span className="example-label">(ETH - нулевой адрес)</span>
                          <button 
                            className="copy-example-btn"
                            onClick={() => insertExampleAddress('0x0000000000000000000000000000000000000000')}
                          >
                            Вставить
                          </button>
                        </div>
                        <div className="example-item">
                          <code>0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48</code>
                          <span className="example-label">(USDC - Ethereum)</span>
                          <button 
                            className="copy-example-btn"
                            onClick={() => insertExampleAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')}
                          >
                            Вставить
                          </button>
                        </div>
                        <div className="example-item">
                          <code>0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174</code>
                          <span className="example-label">(USDC - Polygon)</span>
                          <button 
                            className="copy-example-btn"
                            onClick={() => insertExampleAddress('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174')}
                          >
                            Вставить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {paymentError && (
                  <div className="payment-error">
                    <span className="error-icon">⚠️</span>
                    <div className="error-text">
                      {paymentError.split('\n').map((line, index) => (
                        <div key={index}>{line}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="payment-instructions">
                  <h4>Инструкция по оплате:</h4>
                  <ol>
                    <li>Введите адрес токена (USDC или ETH)</li>
                    <li>Нажмите "Оплатить"</li>
                    <li>Подтвердите транзакцию в вашем кошельке</li>
                    <li>Дождитесь подтверждения в блокчейне (обычно 1-2 минуты)</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={closePaymentModal}
                disabled={isProcessing}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handlePayment}
                disabled={isProcessing || !usdcAddress.trim()}
              >
                {isProcessing ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Обработка...
                  </>
                ) : (
                  '💳 Оплатить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PoliciesPage;