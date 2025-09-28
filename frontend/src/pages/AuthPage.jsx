// Authentication Page - handles both login and register
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/forms/LoginForm';
import RegisterForm from '../components/forms/RegisterForm';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="logo-container">
            <img src="/libco_logo.png" alt="LibCo Logo" className="logo-image" />
            <h1>LibCo</h1>
          </div>
          <p>Sistema de Gestión de Libros</p>
        </div>

        {isLogin ? (
          <LoginForm onToggleForm={toggleForm} />
        ) : (
          <RegisterForm onToggleForm={toggleForm} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;