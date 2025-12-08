import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const PoliciesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <h1>Мои полисы</h1>
      <p>Здесь будут отображаться ваши страховые полисы</p>
      <div style={{ 
        padding: '40px', 
        background: '#f8f9fa', 
        borderRadius: '12px',
        textAlign: 'center',
        marginTop: '40px'
      }}>
        <p>У вас пока нет активных полисов</p>
        <button 
          onClick={() => navigate('/')}
          className="btn-primary"
          style={{ marginTop: '20px' }}
        >
          Купить первый полис
        </button>
      </div>
    </div>
  );
};

export default PoliciesPage;