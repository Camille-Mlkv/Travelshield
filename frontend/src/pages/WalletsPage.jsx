import './HomePage.css';

const WalletsPage = () => {
  return (
    <div className="home-page">
      <h1>Мои кошельки</h1>
      <p>Страница управления кошельками</p>
      <div style={{ 
        padding: '40px', 
        background: '#f8f9fa', 
        borderRadius: '12px',
        textAlign: 'center',
        marginTop: '40px'
      }}>
        <p>Для подключения кошелька нажмите кнопку "Connect Wallet" в шапке сайта</p>
        <p style={{ marginTop: '20px', color: '#666' }}>
          После подключения здесь будут отображаться ваши кошельки и балансы
        </p>
      </div>
    </div>
  );
};

export default WalletsPage;