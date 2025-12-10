import { useParams, useNavigate } from 'react-router-dom';
import './HomePage.css';

const ModuleDetailsPage = ({isAuthenticated}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const modules = {
    1: {
      title: 'Задержка рейса',
      description: 'Страховое покрытие активируется при задержке рейса более 3 часов',
      coverage: 'до $500',
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
      title: 'Потеря багажа',
      description: 'Компенсация при потере или повреждении багажа авиакомпанией',
      coverage: 'до $1000',
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
      title: 'Отмена рейса',
      description: 'Полный возврат стоимости билета при отмене рейса по вине авиакомпании',
      coverage: 'до $300',
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

  const module = modules[id] || modules[1];

  return (
    <div className="home-page">
      <div className="hero-section" style={{ background: `linear-gradient(135deg, ${module.color} 0%, ${module.color}80 100%)` }}>
        <h1>{module.title}</h1>
        <p>{module.description}</p>
        {isAuthenticated ? (
          <>
          <button 
            className="btn-primary"
            onClick={() => navigate(`/buy/${id}`)}
            >
            🛒 Купить покрытие
          </button>
        </> 
        ) : null}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        marginTop: '40px'
      }}>
        <div style={{ 
          padding: '30px', 
          background: 'white', 
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h3>Детали покрытия</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <span>Максимальная выплата:</span>
              <strong>{module.coverage}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <span>Стоимость полиса:</span>
              <strong>{module.premium}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span>Срок действия:</span>
              <strong>30 дней</strong>
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '30px', 
          background: 'white', 
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h3>Условия покрытия</h3>
          <ul style={{ marginTop: '20px', paddingLeft: '20px' }}>
            {module.conditions.map((condition, index) => (
              <li key={index} style={{ marginBottom: '10px', lineHeight: '1.5' }}>
                {condition}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetailsPage;