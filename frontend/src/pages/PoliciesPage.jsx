import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PoliciesPage.css';

const PoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
          setPolicies([]); // У пользователя нет полисов
          return;
        }
        throw new Error(`Ошибка загрузки полисов: ${response.status}`);
      }

      const data = await response.json();
      console.log('Полученные данные полисов:', data);
      
      // Проверяем структуру ответа
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

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Неверная дата';
      
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
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
  const getPolicyStatus = (status) => {
    if (!status) return { text: 'Неизвестно', className: 'unknown' };
    
    const statusLower = status.toLowerCase();
    const statusMap = {
      'active': { text: 'Активен', className: 'active' },
      'pending': { text: 'Ожидает', className: 'pending' },
      'expired': { text: 'Истек', className: 'expired' },
      'claimed': { text: 'Выплачен', className: 'claimed' },
      'cancelled': { text: 'Отменен', className: 'cancelled' },
      'issued': { text: 'Выдан', className: 'active' },
      'awaiting_payment': { text: 'Ожидает оплаты', className: 'pending' }
    };
    
    return statusMap[statusLower] || { text: status, className: 'unknown' };
  };

  // Функция для определения типа полиса
  const getPolicyType = (type) => {
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
      'default': 'Стандартный полис'
    };
    
    return typeMap[typeLower] || type;
  };

  // Функция для получения иконки типа полиса
  const getPolicyIcon = (type) => {
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
      'default': '📄'
    };
    
    return iconMap[typeLower] || '📄';
  };

  // Функция для получения названия полиса
  const getPolicyTitle = (policy) => {
    if (policy.title) return policy.title;
    if (policy.name) return policy.name;
    
    const type = getPolicyType(policy.type);
    const destination = policy.destination ? ` - ${policy.destination}` : '';
    return `Полис ${type}${destination}`;
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

  return (
    <div className="policies-page">
      <div className="page-header">
        <h1>Мои полисы</h1>
        <button 
          className="btn-primary"
          onClick={() => navigate('/')}
        >
          Купить новый полис
        </button>
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
        </div>
      ) : (
        <div className="policies-container">
          <div className="stats-summary">
            <div className="stat-card">
              <div className="stat-value">{policies.length}</div>
              <div className="stat-label">Всего полисов</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {policies.filter(p => {
                  const status = getPolicyStatus(p.status);
                  return status.className === 'active';
                }).length}
              </div>
              <div className="stat-label">Активные</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {policies.filter(p => {
                  const status = getPolicyStatus(p.status);
                  return status.className === 'expired';
                }).length}
              </div>
              <div className="stat-label">Истекли</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {policies.reduce((sum, p) => {
                  const amount = p.coverage_amount || p.sum_insured || p.amount || 0;
                  return sum + parseFloat(amount);
                }, 0).toLocaleString('ru-RU', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })} ₽
              </div>
              <div className="stat-label">Общая сумма покрытия</div>
            </div>
          </div>

          <div className="policies-grid">
            {policies.map((policy) => {
              const status = getPolicyStatus(policy.status);
              const policyType = getPolicyType(policy.type);
              const policyIcon = getPolicyIcon(policy.type);
              const policyTitle = getPolicyTitle(policy);
              
              // Получаем суммы из разных возможных полей
              const coverageAmount = policy.coverage_amount || policy.sum_insured || policy.amount || 0;
              const premiumAmount = policy.premium_amount || policy.premium || policy.price || 0;
              
              return (
                <div key={policy.id || policy.policy_id} className="policy-card">
                  <div className="policy-header">
                    <div className="policy-icon">
                      {policyIcon}
                    </div>
                    <div className="policy-info">
                      <h3>{policyTitle}</h3>
                      <span className={`policy-status ${status.className}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                  
                  <div className="policy-details">
                    <div className="detail-row">
                      <span className="detail-label">Тип полиса:</span>
                      <span className="detail-value">{policyType}</span>
                    </div>
                    
                    {coverageAmount > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">Сумма покрытия:</span>
                        <span className="detail-value coverage-amount">
                          {formatAmount(coverageAmount)} ₽
                        </span>
                      </div>
                    )}
                    
                    {premiumAmount > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">Страховая премия:</span>
                        <span className="detail-value premium-amount">
                          {formatAmount(premiumAmount)} ₽
                        </span>
                      </div>
                    )}
                    
                    {policy.start_date && (
                      <div className="detail-row">
                        <span className="detail-label">Действует с:</span>
                        <span className="detail-value">
                          {formatDate(policy.start_date)}
                        </span>
                      </div>
                    )}
                    
                    {policy.end_date && (
                      <div className="detail-row">
                        <span className="detail-label">Действует до:</span>
                        <span className="detail-value">
                          {formatDate(policy.end_date)}
                        </span>
                      </div>
                    )}
                    
                    {policy.destination && (
                      <div className="detail-row">
                        <span className="detail-label">Направление:</span>
                        <span className="detail-value">
                          {policy.destination}
                        </span>
                      </div>
                    )}
                    
                    {policy.policy_number && (
                      <div className="detail-row">
                        <span className="detail-label">Номер полиса:</span>
                        <span className="detail-value policy-number">
                          {policy.policy_number}
                        </span>
                      </div>
                    )}
                    
                    {policy.insurance_company && (
                      <div className="detail-row">
                        <span className="detail-label">Страховая компания:</span>
                        <span className="detail-value">
                          {policy.insurance_company}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="policy-meta">
                    <span className="meta-item">
                      ID: {(policy.id || policy.policy_id || '').substring(0, 8)}...
                    </span>
                    <span className="meta-item">
                      {policy.created_at ? `Создан: ${formatDate(policy.created_at)}` : ''}
                    </span>
                  </div>
                  
                  <div className="policy-actions">
                    <button 
                      className="action-btn details-btn"
                      onClick={() => {
                        if (policy.id) {
                          navigate(`/policies/${policy.id}`);
                        } else {
                          alert('Детальная информация о полисе');
                        }
                      }}
                    >
                      Подробнее
                    </button>
                    
                    {status.className === 'active' && (
                      <button 
                        className="action-btn claim-btn"
                        onClick={() => {
                          if (policy.id) {
                            navigate(`/policies/${policy.id}/claim`);
                          } else {
                            alert('Функция подачи заявки');
                          }
                        }}
                      >
                        Подать заявку
                      </button>
                    )}
                    
                    {policy.document_url && (
                      <button 
                        className="action-btn download-btn"
                        onClick={() => window.open(policy.document_url, '_blank')}
                      >
                        Скачать PDF
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliciesPage;