import { useNavigate } from 'react-router-dom';
import InsuranceModuleCard from '../components/Cards/InsuranceModuleCard.jsx';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  
  const insuranceModules = [
    {
      id: 1,
      title: 'Задержка рейса',
      description: 'Покрытие при задержке рейса более 3 часов',
      coverage: 'до $500',
      premium: 'от $10',
      icon: '🕒',
      color: '#3B82F6'
    },
    {
      id: 2,
      title: 'Потеря багажа',
      description: 'Компенсация при потере или повреждении багажа',
      coverage: 'до $1000',
      premium: 'от $15',
      icon: '🧳',
      color: '#10B981'
    },
    {
      id: 3,
      title: 'Отмена рейса',
      description: 'Возврат средств при отмене рейса',
      coverage: 'до $300',
      premium: 'от $8',
      icon: '✈️',
      color: '#8B5CF6'
    }
  ];

  const handleCardClick = (moduleId) => {
    navigate(`/module/${moduleId}`);
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>TravelShield Insurance</h1>
        <p>Децентрализованное страхование путешествий</p>
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
      </div>
      
      <div className="modules-section">
        <h2>Страховые модули</h2>
        <div className="modules-grid">
          {insuranceModules.map(module => (
            <InsuranceModuleCard 
              key={module.id}
              module={module}
              onClick={() => handleCardClick(module.id)}
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