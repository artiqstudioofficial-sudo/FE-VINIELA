import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslations } from '../contexts/i18n';

const LoginPage: React.FC = () => {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If user is already authenticated, redirect them
    if (sessionStorage.getItem('viniela-auth') === 'true') {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simple hardcoded credentials
    if (username === 'admin' && password === 'password') {
      sessionStorage.setItem('viniela-auth', 'true');
      navigate(from, { replace: true });
    } else {
      setError(t.login.errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] bg-viniela-silver p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg m-4 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-center text-viniela-dark">{t.login.title}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="form-label">{t.login.username}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="form-label">{t.login.password}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pr-10"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-viniela-dark transition-colors duration-200"
                aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
              >
                <i
                  className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                  aria-hidden="true"
                ></i>
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-center text-red-600 animate-shake">{error}</p>}
          <div>
            <button type="submit" className="w-full btn-primary">
              {t.login.loginButton}
            </button>
          </div>
        </form>
      </div>
      <style>{`
          .form-label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #4d4d4d; }
          .form-input { display: block; width: 100%; border-radius: 0.5rem; border: 1px solid #d1d5db; padding: 0.75rem 1rem; transition: border-color 0.2s, box-shadow 0.2s; }
          .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #c09a58; box-shadow: 0 0 0 2px #c09a58; }
          .btn-primary { padding: 0.75rem 1.5rem; background-color: #c09a58; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s, transform 0.2s; border: none; cursor: pointer; }
          .btn-primary:hover { background-color: #b08b49; transform: translateY(-1px); }
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
      `}</style>
    </div>
  );
};

export default LoginPage;
