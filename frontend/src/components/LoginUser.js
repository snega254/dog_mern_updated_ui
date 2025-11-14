import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginUser.css';

const LoginUser = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/auth/user/login', { 
        email, 
        password 
      });
      
      if (res.data.success && res.data.userType === 'user') {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userType', res.data.userType);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        alert('Login successful! Welcome back!');
        navigate('/dashboard_user');
      } else {
        setError('Invalid credentials or wrong user type');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-user-container">
      <div className="login-user-form">
        <div className="login-user-header">
          <h2>User Login</h2>
          <p>Welcome back to Dog World!</p>
        </div>

        {error && (
          <div className="user-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="user-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="user-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="user-login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="user-spinner"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="user-login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register_user" className="user-link">
              Register here
            </Link>
          </p>
          <p>
            Are you a seller?{' '}
            <Link to="/login_seller" className="user-link">
              Seller login
            </Link>
          </p>
        </div>

        <div className="user-demo-credentials">
          <h4>Demo Credentials:</h4>
          <p>Email: user@example.com</p>
          <p>Password: user123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginUser;