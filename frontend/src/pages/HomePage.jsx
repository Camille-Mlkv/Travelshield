import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InsuranceModuleCard from '../components/Cards/InsuranceModuleCard.jsx';
import './HomePage.css';

const HomePage = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [insuranceModules, setInsuranceModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/modules/', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки модулей: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const enrichedModules = data.data.map(module => {
          const { icon, color } = getModuleMeta(module.name);
          
          return {
            id: module.id,
            title: module.name,
            description: module.description,
            coverage: `до $${module.fixed_payout_amount || 0}`,
            premium: calculatePremium(module.fixed_payout_amount),
            icon: icon,
            color: color,
            // Сохраняем оригинальные данные из API
            apiData: module
          };
        });
        
        setInsuranceModules(enrichedModules);
      } else {
        throw new Error('Неверный формат данных модулей');
      }
    } catch (err) {
      console.error('Ошибка загрузки модулей:', err);
      setError(err.message);
      setInsuranceModules(getDefaultModules());
    } finally {
      setLoading(false);
    }
  };

  const getModuleMeta = (moduleName) => {
    const nameLower = moduleName.toLowerCase();
    
    if (nameLower.includes('задержк') || nameLower.includes('рейс')) {
      return { icon: '🕒', color: '#3B82F6' };
    } else if (nameLower.includes('отмен') || nameLower.includes('отмена')) {
      return { icon: '✈️', color: '#8B5CF6' };
    } else if (nameLower.includes('багаж') || nameLower.includes('потер')) {
      return { icon: '🧳', color: '#10B981' };
    } else if (nameLower.includes('медицин') || nameLower.includes('здоров')) {
      return { icon: '🏥', color: '#EF4444' };
    } else if (nameLower.includes('несчаст') || nameLower.includes('случай')) {
      return { icon: '⚠️', color: '#F59E0B' };
    } else {
      return { icon: '🛡️', color: '#6B7280' };
    }
  };

  const calculatePremium = (coverageAmount) => {
    if (!coverageAmount) return 'от $5';
    
    const premium = coverageAmount * 0.1;
    return `от $${Math.round(premium)}`;
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleCardClick = (moduleId, moduleData) => {
    navigate(`/module/${moduleId}`, { state: { moduleData } });
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="hero-section">
          <h1>TravelShield Insurance</h1>
          <p>Децентрализованное страхование путешествий</p>
          <div className="loading-modules">
            <div className="spinner"></div>
            <p>Загрузка страховых модулей...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>TravelShield Insurance</h1>
        <p>Децентрализованное страхование путешествий</p>
        {isAuthenticated ? (
          <div className="quick-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/wallets')}
            >
              Кошельки
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/policies')}
            >
              Мои полисы
            </button>
          </div>
        ) : null}
      </div>
      
      {error && (
        <div className="error-section">
          <div className="error-message">
            {error}
            <button onClick={fetchModules} className="retry-btn">
              Повторить
            </button>
          </div>
        </div>
      )}
      
      <div className="modules-section">
        <h2>Страховые модули</h2>
        <div className="modules-grid">
          {insuranceModules.map(module => (
            <InsuranceModuleCard 
              key={module.id}
              module={module}
              onClick={() => handleCardClick(module.id, module.apiData)}
            />
          ))}
        </div>
      </div>
      
      <div className="how-it-works">
        <h3>Как это работает?</h3>
        <div className="steps">
          <div className="step">
            <div className="step-icon">1️⃣</div>
            <h4>Выберите модуль</h4>
            <p>Выберите страховой модуль и укажите детали рейса</p>
          </div>
          <div className="step">
            <div className="step-icon">2️⃣</div>
            <h4>Оплатите полис</h4>
            <p>Оплатите криптовалютой через подключенный кошелек</p>
          </div>
          <div className="step">
            <div className="step-icon">3️⃣</div>
            <h4>Получите защиту</h4>
            <p>При наступлении страхового случая выплата произойдет автоматически</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;