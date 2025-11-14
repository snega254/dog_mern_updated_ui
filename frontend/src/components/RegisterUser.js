import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegisterUser.css';

const RegisterUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contact: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(formData.contact)) {
      setError('Contact must be a 10-digit number');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...submitData } = formData;
      
      const res = await axios.post('http://localhost:5000/auth/user/register', submitData);
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userType', 'user');
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        alert('Registration successful! Welcome to Dog World!');
        navigate('/dashboard_user');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-user-container">
      <div className="register-user-form">
        <div className="register-user-header">
          <h2>User Registration</h2>
          <p>Join our community of dog lovers</p>
        </div>

        {error && (
          <div className="user-register-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="user-register-form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
          </div>

          <div className="user-register-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="user-register-form-group">
            <label htmlFor="contact">Contact Number</label>
            <input
              type="tel"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              required
              disabled={loading}
            />
          </div>

          <div className="user-register-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password (min. 6 characters)"
              required
              disabled={loading}
            />
          </div>

          <div className="user-register-form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="user-register-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="user-register-spinner"></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="user-register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login_user" className="user-register-link">
              Login here
            </Link>
          </p>
          <p>
            Want to sell dogs or products?{' '}
            <Link to="/register_seller" className="user-register-link">
              Register as seller
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterUser;