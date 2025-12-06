import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

import Home from './pages/Home.jsx';
import Wallets from './pages/Wallets.jsx';
import Policies from './pages/Policies.jsx';
import ModuleDetail from './pages/ModuleDetail.jsx';

function App() {
  const [count, setCount] = useState(0);

  // Установка фиктивного currentUserId
  document.cookie = "currentUserId=12345";

  return (
    <Router>
      <div className="app-container">

        {/* Хедер */}
        <header className="header">
          <div className="header-content">
            <div className="logo-container">
              <a href="https://vite.dev" target="_blank" rel="noreferrer">
                <img src={viteLogo} className="logo" alt="Vite logo" />
              </a>
              <a href="https://react.dev" target="_blank" rel="noreferrer">
                <img src={reactLogo} className="logo react" alt="React logo" />
              </a>
            </div>
            <h1 className="app-title">TravelShield</h1>
          </div>

          {/* Навигация прямо в хедере */}
          <nav className="header-nav">
            <Link to="/"><button>Главная</button></Link>
            <Link to="/wallets"><button>Кошельки</button></Link>
            <Link to="/policies"><button>Полисы</button></Link>
          </nav>
        </header>

        {/* Основной контент */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/module/:id" element={<ModuleDetail />} />
          </Routes>
          <p className="read-the-docs">
            Click on the Vite and React logos to learn more
          </p>
        </main>

      </div>
    </Router>
  );
}

export default App;
