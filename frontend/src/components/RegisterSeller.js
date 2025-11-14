import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegisterSeller.css';

const RegisterSeller = () => {
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
      
      // Add userType to the submitted data
      const finalData = {
        ...submitData,
        userType: 'seller'
      };
      
      const res = await axios.post('http://localhost:5000/auth/seller/register', finalData);
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userType', 'seller');
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        alert('Seller registration successful! Welcome to Dog World!');
        navigate('/dashboard_seller');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-seller-container">
      <div className="register-seller-form">
        <div className="register-seller-header">
          <h2>Seller Registration</h2>
          <p>Start selling dogs and pet products</p>
        </div>

        {error && (
          <div className="seller-register-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="seller-register-form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              disabled={loading}
            />
          </div>

          <div className="seller-register-form-group">
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

          <div className="seller-register-form-group">
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

          <div className="seller-register-form-group">
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

          <div className="seller-register-form-group">
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
            className="seller-register-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="seller-register-spinner"></div>
                Creating Seller Account...
              </>
            ) : (
              'Create Seller Account'
            )}
          </button>
        </form>

        <div className="seller-register-footer">
          <p>
            Already have a seller account?{' '}
            <Link to="/login_seller" className="seller-register-link">
              Login here
            </Link>
          </p>
          <p>
            Want to adopt or buy products?{' '}
            <Link to="/register_user" className="seller-register-link">
              Register as user
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterSeller;