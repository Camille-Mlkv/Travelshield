import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const RegisterPage = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    walletAddress: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
        setError('Пароли не совпадают');
        return;
    }

    if (!formData.walletAddress.trim()) {
        setError('Адрес кошелька обязателен');
        return;
    }

    if (formData.password.length < 8) {
        setError('Пароль должен содержать минимум 8 символов');
        return;
    }

    setLoading(true);

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: JSON.stringify({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                walletAddress: formData.walletAddress
            }),
        });

        const responseText = await response.text();
        
        if (!responseText || responseText.trim() === '') {
        throw new Error('Сервер вернул пустой ответ');
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error('Ошибка формата ответа от сервера');
        }

        if (!response.ok) {
        
        throw new Error(data.message || `Ошибка регистрации (${response.status})`);
        }
        
        if (data.data && data.data.token && data.data.user) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userId', data.data.user.id);
        localStorage.setItem('userEmail', data.data.user.email);
        localStorage.setItem('userName', data.data.user.name || '');
        
        if (onRegister && typeof onRegister === 'function') {
            onRegister(data.data.user.id, data.data.user);
        }
        
        navigate('/');
        } else {
        throw new Error('Некорректные данные в ответе сервера');
        }
        
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Создание аккаунта</h2>
          <p className="auth-subtitle">Присоединяйтесь к TravelShield!</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="name" className="form-label">Имя</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="Ваше имя"
              required
              disabled={loading}
            />
          </div>

        <div className="form-group">
        <label htmlFor="password" className="form-label">Пароль</label>
        <input
            type="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            placeholder="Придумайте пароль (минимум 8 символов)"
            required
            minLength="8"
            disabled={loading}
        />
        <small className="form-help">
            Минимум 8 символов
        </small>
        </div>

          <div className="form-group">
            <label htmlFor="walletAddress" className="form-label">Адрес кошелька</label>
            <input
              type="text"
              id="walletAddress"
              value={formData.walletAddress}
              onChange={handleChange}
              className="form-input"
              placeholder="0x..."
              required
              disabled={loading}
              pattern="^0x[a-fA-F0-9]{40}$"
              title="Введите корректный адрес Ethereum кошелька (начинается с 0x, 40 символов)"
            />
            <small className="form-help">
              Введите адрес Ethereum кошелька (начинается с 0x)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Пароль</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Придумайте пароль"
              required
              minLength="6"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Подтвердите пароль</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              placeholder="Повторите пароль"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-link-text">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="auth-link">
              Войти
            </Link>
          </p>
          <Link to="/" className="auth-link">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;