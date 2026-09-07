import React, { useState } from 'react';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = ({ onLogin }) => {
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      // Call authentication login API
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email,
          email: email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Populate AuthContext synchronously with access context & token
      await loginUser(data.token, data.user);

      setLoading(false);
      onLogin();
    } catch (err) {
      setError('Unable to reach the server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decorative ambient background blobs */}
      <div className="login-blob-1" />
      <div className="login-blob-2" />

      <div className="login-card">
        {/* Left branding panel */}
        <div className="login-left-panel">
          <div className="login-logo-wrap">
            <span className="login-logo-text">T</span>
          </div>
          <h2 className="login-brand-title">TeamHub</h2>
          <p className="login-brand-sub">Human Resource Management System</p>

          <div className="login-feature-list">
            {['Attendance & Leave Tracking', 'Payroll & EPFO Management', 'HR Onboarding & MIS Reports'].map((f, i) => (
              <div key={i} className="login-feature-item">
                <span className="login-feature-dot">✓</span>
                <span className="login-feature-text">{f}</span>
              </div>
            ))}
          </div>

          <div className="login-stats-row">
            <div className="login-stat-box">
              <span className="login-stat-num">500+</span>
              <span className="login-stat-label">Employees</span>
            </div>
            <div className="login-stat-box">
              <span className="login-stat-num">98%</span>
              <span className="login-stat-label">Uptime</span>
            </div>
            <div className="login-stat-box">
              <span className="login-stat-num">24/7</span>
              <span className="login-stat-label">Support</span>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-right-panel">
          <div className="login-form-header">
            <h3 className="login-form-title">Welcome back 👋</h3>
            <p className="login-form-sub">Sign in to your HRMS account</p>
          </div>

          {error && (
            <div className="login-alert-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Address */}
            <div className="login-field-group">
              <label className="login-label" htmlFor="login-email">
                Email Address
              </label>
              <div className="login-input-wrap">
                <FaUser className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field-group">
              <label className="login-label" htmlFor="login-password">
                Password
              </label>
              <div className="login-input-wrap">
                <FaLock className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="login-input password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPass((p) => !p)}
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="login-forgot-wrap">
              <button
                type="button"
                className="login-forgot-btn"
                onClick={() => setError('Please contact your HR administrator to reset your credentials.')}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner" aria-label="Loading..." />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="login-footer-note">
            © {new Date().getFullYear()} FlareMindsTech · HRMS Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;