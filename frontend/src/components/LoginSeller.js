import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginSeller.css';

const LoginSeller = () => {
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
      const res = await axios.post('http://localhost:5000/auth/seller/login', { 
        email, 
        password 
      });
      
      if (res.data.success && res.data.userType === 'seller') {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userType', res.data.userType);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        alert('Login successful! Welcome to your seller dashboard!');
        navigate('/dashboard_seller');
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
    <div className="login-seller-container">
      <div className="login-seller-form">
        <div className="login-seller-header">
          <h2>Seller Login</h2>
          <p>Manage your dog listings and products</p>
        </div>

        {error && (
          <div className="seller-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="seller-form-group">
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

          <div className="seller-form-group">
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
            className="seller-login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="seller-spinner"></div>
                Signing In...
              </>
            ) : (
              'Sign In as Seller'
            )}
          </button>
        </form>

        <div className="seller-login-footer">
          <p>
            Don't have a seller account?{' '}
            <Link to="/register_seller" className="seller-link">
              Register here
            </Link>
          </p>
          <p>
            Are you a user?{' '}
            <Link to="/login_user" className="seller-link">
              User login
            </Link>
          </p>
        </div>

        <div className="seller-demo-credentials">
          <h4>Demo Credentials:</h4>
          <p>Email: seller@paws.com</p>
          <p>Password: seller123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginSeller;