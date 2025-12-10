import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage';
import WalletsPage from './pages/WalletsPage.jsx';
import PoliciesPage from './pages/PoliciesPage';
import ModuleDetailsPage from './pages/ModuleDetailsPage.jsx';
import BuyPolicyPage from './pages/BuyPolicyPage';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      setIsAuthenticated(true);
      setCurrentUserId(userId);
      
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName');
      setUserData({
        id: userId,
        email: userEmail,
        name: userName
      });
    }
  }, []);

  const handleLogin = (userId, user = null) => {
    console.log('handleLogin called with:', userId, user);
    setIsAuthenticated(true);
    setCurrentUserId(userId);
    
    if (user) {
      setUserData(user);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userName', user.name || '');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setCurrentUserId('');
    setUserData(null);
  };

  return (
    <Router>
      <Layout
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
        onLogout={handleLogout}
        userData={userData}
      >  
        <Routes>
          <Route path="/" element={<HomePage isAuthenticated={isAuthenticated} />} />
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? 
                <LoginPage onLogin={handleLogin} /> : 
                <Navigate to="/" />
            } 
          />
          <Route 
            path="/register" 
            element={
              !isAuthenticated ? 
                <RegisterPage onRegister={handleLogin} /> : 
                <Navigate to="/" />
            } 
          />
          <Route 
            path="/wallets" 
            element={
              <WalletsPage />
            } 
          />
          <Route 
            path="/policies" 
            element={
              <PoliciesPage />
            } 
          />
          <Route 
            path="/module/:id" 
            element={
              <ModuleDetailsPage isAuthenticated={isAuthenticated} />
            } 
          />
          <Route 
            path="/buy/:moduleId" 
            element={
                <BuyPolicyPage />
            } 
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;