import './InsuranceModuleCard.css';

const InsuranceModuleCard = ({ module, onClick }) => {
  return (
    <div 
      className="module-card"
      style={{ borderTopColor: module.color }}
      onClick={onClick}
    >
      <div className="module-icon">{module.icon}</div>
      <h3>{module.title}</h3>
      <p className="module-description">{module.description}</p>
      
      <div className="module-details">
        <div className="detail-item">
          <span className="label">Покрытие:</span>
          <span className="value">{module.coverage}</span>
        </div>
        <div className="detail-item">
          <span className="label">Стоимость:</span>
          <span className="value">{module.premium}</span>
        </div>
      </div>
      
      <button className="module-button">Подробнее</button>
    </div>
  );
};

export default InsuranceModuleCard;