import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './HomePage.css';

const BuyPolicyPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    flightNumber: '',
    startDate: '',
    endDate: '',
    coverageAmount: '100',
    premium: '10'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Полис куплен! Номер рейса: ${formData.flightNumber}`);
    navigate('/policies');
  };

  return (
    <div className="home-page">
      <h1>Покупка страхового полиса</h1>
      
      <form onSubmit={handleSubmit} style={{ 
        maxWidth: '600px', 
        margin: '40px auto',
        padding: '30px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Номер рейса *
          </label>
          <input
            type="text"
            name="flightNumber"
            value={formData.flightNumber}
            onChange={handleInputChange}
            placeholder="SU1234"
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Дата вылета *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Дата возвращения
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          background: '#f8f9fa', 
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Итог</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Страховой модуль:</span>
            <span>Задержка рейса</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Покрытие:</span>
            <span>{formData.coverageAmount} USDC</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
            <span>Стоимость:</span>
            <span>{formData.premium} ETH</span>
          </div>
        </div>

        <button 
          type="submit"
          className="btn-primary"
          style={{ width: '100%' }}
        >
          🛒 Купить полис
        </button>
      </form>
    </div>
  );
};

export default BuyPolicyPage;