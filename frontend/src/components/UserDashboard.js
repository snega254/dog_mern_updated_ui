import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    adoptions: 0,
    orders: 0,
    appointments: 0,
    posts: 0
  });

  useEffect(() => {
    fetchUserData();
    fetchUserStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch adoption requests
      const adoptionsRes = await axios.get('http://localhost:5000/api/my-adoptions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch accessory orders
      const ordersRes = await axios.get('http://localhost:5000/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch appointments
      const appointmentsRes = await axios.get('http://localhost:5000/api/doctors/my-appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats({
        adoptions: adoptionsRes.data.length,
        orders: ordersRes.data.length,
        appointments: appointmentsRes.data.length,
        posts: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use default stats when endpoints don't exist yet
      setStats({
        adoptions: 0,
        orders: 0,
        appointments: 0,
        posts: 0
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Fixed Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, {user.name}! 🐾</h1>
          <p>Manage your pets, appointments, and orders</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Quick Actions - COMPLETE SECTION WITH PROPER CLASSNAME */}
        <section className="quick-actions">
          <div className="actions-grid">
            <div className="action-card" onClick={() => navigate('/adoption')}>
              <div className="action-icon">🐕</div>
              <h3>Adopt a Dog</h3>
              <p>Find your perfect furry companion</p>
            </div>

            <div className="action-card" onClick={() => navigate('/accessories')}>
              <div className="action-icon">🛒</div>
              <h3>Shop Accessories</h3>
              <p>Food, toys, and care products</p>
            </div>

            <div className="action-card" onClick={() => navigate('/doctor-booking')}>
              <div className="action-icon">🏥</div>
              <h3>Book Vet</h3>
              <p>Schedule health checkups</p>
            </div>

            <div className="action-card" onClick={() => navigate('/dogchat')}>
              <div className="action-icon">🤖</div>
              <h3>AI Assistant</h3>
              <p>Get expert dog care advice</p>
            </div>

            <div className="action-card" onClick={() => navigate('/dog-posts')}>
              <div className="action-icon">📷</div>
              <h3>Community</h3>
              <p>Share your dog's photos</p>
            </div>

            <div className="action-card" onClick={() => navigate('/health-records')}>
              <div className="action-icon">📋</div>
              <h3>Health Records</h3>
              <p>Manage medical history</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserDashboard;