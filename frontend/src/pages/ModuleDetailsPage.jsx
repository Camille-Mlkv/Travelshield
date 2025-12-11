import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './ModuleDetailsPage.css'; 

const ModuleDetailsPage = ({ isAuthenticated }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const passedModuleData = location.state?.moduleData;

  const fetchModuleDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/modules/${id}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки модуля: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const enrichedModule = enrichModuleData(data.data);
        setModule(enrichedModule);
      } else {
        throw new Error('Неверный формат данных модуля');
      }
    } catch (err) {
      console.error('Ошибка загрузки модуля:', err);
      setError(err.message);
      
      if (passedModuleData) {
        const enrichedModule = enrichModuleData(passedModuleData);
        setModule(enrichedModule);
      } else {
        setModule(getFallbackModule(id));
      }
    } finally {
      setLoading(false);
    }
  };

  const enrichModuleData = (moduleData) => {
    const { icon, color, conditions, premium } = getModuleMeta(moduleData.name, moduleData.fixed_payout_amount);
    
    return {
      id: moduleData.id,
      title: moduleData.name,
      description: moduleData.description,
      coverage: `$${moduleData.fixed_payout_amount || 0}`,
      premium: premium,
      icon: icon,
      color: color,
      conditions: conditions,
      fixed_payout_amount: moduleData.fixed_payout_amount,
      created_at: moduleData.created_at,
      updated_at: moduleData.updated_at,
      apiData: moduleData
    };
  };

  const getModuleMeta = (moduleName, payoutAmount) => {
    const nameLower = moduleName.toLowerCase();
    
    let icon, color, conditions, premium;
    
    if (nameLower.includes('задержк') || nameLower.includes('рейс')) {
      icon = '🕒';
      color = '#3B82F6';
      conditions = [
        'Задержка рейса более 3 часов',
        'Официальное подтверждение авиакомпании',
        'Действует на все международные рейсы',
        'Выплата в течение 24 часов после предоставления документов',
        'Максимальная сумма выплаты зависит от тарифа'
      ];
    } else if (nameLower.includes('отмен') || nameLower.includes('отмена')) {
      icon = '✈️';
      color = '#8B5CF6';
      conditions = [
        'Отмена рейса по вине авиакомпании',
        'Уведомление от авиакомпании об отмене',
        'Действует за 24 часа до вылета',
        'Работает с большинством авиакомпаний',
        'Выплата полной стоимости билета'
      ];
    } else if (nameLower.includes('багаж') || nameLower.includes('потер')) {
      icon = '🧳';
      color = '#10B981';
      conditions = [
        'Потеря багажа авиакомпанией',
        'Официальная жалоба подана в течение 7 дней',
        'Компенсация за поврежденный багаж',
        'Документальное подтверждение стоимости вещей',
        'Максимальная выплата зависит от тарифа'
      ];
    } else if (nameLower.includes('медицин') || nameLower.includes('здоров')) {
      icon = '🏥';
      color = '#EF4444';
      conditions = [
        'Покрытие медицинских расходов за границей',
        'Экстренная медицинская помощь',
        'Эвакуация в медицинское учреждение',
        'Телемедицинские консультации',
        'Действует во всех странах мира'
      ];
    } else {
      icon = '🛡️';
      color = '#6B7280';
      conditions = [
        'Страховой случай должен быть подтвержден документально',
        'Выплата производится в течение 5 рабочих дней',
        'Действует на территории всех стран',
        '24/7 поддержка клиентов'
      ];
    }
    
    premium = payoutAmount ? `от $${Math.round(payoutAmount * 0.1)}` : 'от $10';
    
    return { icon, color, conditions, premium };
  };

  const getFallbackModule = (moduleId) => {
    const fallbackModules = {
      1: {
        id: '1',
        title: 'Задержка рейса',
        description: 'Страховое покрытие активируется при задержке рейса более 3 часов',
        coverage: '$500',
        premium: 'от $10',
        conditions: [
          'Задержка более 3 часов',
          'Официальное подтверждение авиакомпании',
          'Действует на все рейсы',
          'Выплата в течение 24 часов'
        ],
        icon: '🕒',
        color: '#3B82F6'
      },
      2: {
        id: '2',
        title: 'Потеря багажа',
        description: 'Компенсация при потере или повреждении багажа авиакомпанией',
        coverage: '$1000',
        premium: 'от $15',
        conditions: [
          'Потеря багажа авиакомпанией',
          'Официальная жалоба подана в течение 7 дней',
          'Максимальная выплата $1000',
          'Документальное подтверждение'
        ],
        icon: '🧳',
        color: '#10B981'
      },
      3: {
        id: '3',
        title: 'Отмена рейса',
        description: 'Полный возврат стоимости билета при отмене рейса по вине авиакомпании',
        coverage: '$300',
        premium: 'от $8',
        conditions: [
          'Отмена рейса по вине авиакомпании',
          'Уведомление от авиакомпании',
          'Действует за 24 часа до вылета',
          'Работает с большинством авиакомпаний'
        ],
        icon: '✈️',
        color: '#8B5CF6'
      }
    };
    
    return fallbackModules[moduleId] || fallbackModules[1];
  };

  useEffect(() => {
    if (id) {
      fetchModuleDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="module-details-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка деталей модуля...</p>
        </div>
      </div>
    );
  }

  if (error && !module) {
    return (
      <div className="module-details-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Ошибка загрузки модуля</h3>
          <p>{error}</p>
          <button onClick={fetchModuleDetails} className="btn-primary">
            Попробовать снова
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="module-details-page">
      <div 
        className="hero-section" 
        style={{ 
          background: `linear-gradient(135deg, ${module.color} 0%, ${module.color}80 100%)`,
          color: 'white'
        }}
      >
        <div className="hero-content">
          <div className="module-icon-large">
            {module.icon}
          </div>
          <h1>{module.title}</h1>
          <p className="hero-description">{module.description}</p>
          {isAuthenticated ? (
            <div className="hero-actions">
              <button 
                className="btn-primary btn-large"
                onClick={() => navigate(`/buy/${id}`, { state: { moduleData: module.apiData || module } })}
              >
                🛒 Купить полис
              </button>
            </div>
          ) : (
            <div className="hero-actions">
              <button 
                className="btn-primary btn-large"
                onClick={() => navigate('/login')}
              >
                🔑 Войти для покупки
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="content-section">
        <div className="details-grid">
          <div className="details-card">
            <div className="card-header">
              <h3>Детали покрытия</h3>
            </div>
            <div className="card-content">
              <div className="detail-item">
                <span className="detail-label">Максимальная выплата:</span>
                <span className="detail-value coverage-value">{module.coverage}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Стоимость полиса:</span>
                <span className="detail-value premium-value">{module.premium}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Срок действия полиса:</span>
                <span className="detail-value">30 дней с момента покупки</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Время выплаты:</span>
                <span className="detail-value">24-48 часов после подтверждения</span>
              </div>
              {module.apiData?.created_at && (
                <div className="detail-item">
                  <span className="detail-label">Доступен с:</span>
                  <span className="detail-value">
                    {new Date(module.apiData.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="details-card">
            <div className="card-header">
              <h3>Условия покрытия</h3>
            </div>
            <div className="card-content">
              <ul className="conditions-list">
                {module.conditions.map((condition, index) => (
                  <li key={index} className="condition-item">
                    <span className="condition-icon">✓</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="how-it-works-section">
          <h3>Как работает этот полис?</h3>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Покупка полиса</h4>
              <p>Выберите этот модуль и оплатите полис через подключенный кошелек</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h4>Наступление случая</h4>
              <p>При наступлении страхового случая соберите необходимые документы</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h4>Подача заявки</h4>
              <p>Подайте заявку на выплату через личный кабинет с приложением документов</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h4>Получение выплаты</h4>
              <p>После проверки документов выплата поступит на ваш кошелек автоматически</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetailsPage;