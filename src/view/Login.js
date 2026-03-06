import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaUser, FaLock } from 'react-icons/fa';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    } else {
      alert("Please enter your email and password.");
    }
  };

  return (
    <div style={styles.container}>
      <div className="card shadow-lg" style={styles.card}>
        <div className="p-4 p-md-5 d-flex flex-column justify-content-center">
          <h3 className="fw-bold mb-4 text-center text-dark">Welcome Back</h3>
          <p className="text-muted text-center mb-4">Please enter your credentials to log in.</p>

          <form onSubmit={handleLoginSubmit}>
            <div className="mb-3 input-group">
              <span className="input-group-text bg-light border-end-0">
                <FaUser className="text-muted" />
              </span>
              <input
                type="email"
                className="form-control border-start-0 bg-light shadow-none"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4 input-group">
              <span className="input-group-text bg-light border-end-0">
                <FaLock className="text-muted" />
              </span>
              <input
                type="password"
                className="form-control border-start-0 bg-light shadow-none"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
              style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #054242 0%, #10b981 100%)', border: 'none' }}
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#054242',
    padding: '20px'
  },
  card: {
    borderRadius: '20px',
    overflow: 'hidden',
    maxWidth: '500px',
    width: '100%',
    border: 'none',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
  }
};

export default Login;