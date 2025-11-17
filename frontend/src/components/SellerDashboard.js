import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    dogsListed: 0,
    productsListed: 0,
    pendingOrders: 0,
    totalSales: 0
  });

  useEffect(() => {
    fetchUserData();
    fetchSellerStats();
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

  const fetchSellerStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch dogs count
      const dogsRes = await axios.get('http://localhost:5000/api/dogs', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch products count
      const productsRes = await axios.get('http://localhost:5000/api/products/seller/my-products', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch orders count
      const ordersRes = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch accessory orders
      const accessoryOrdersRes = await axios.get('http://localhost:5000/api/orders/seller/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const pendingAdoptionOrders = ordersRes.data.filter(order => order.status === 'pending').length;
      const pendingProductOrders = accessoryOrdersRes.data.filter(order => order.status === 'pending').length;

      setStats({
        dogsListed: dogsRes.data.length,
        productsListed: productsRes.data.length,
        pendingOrders: pendingAdoptionOrders + pendingProductOrders,
        totalSales: accessoryOrdersRes.data.reduce((total, order) => total + order.totalAmount, 0)
      });
    } catch (error) {
      console.error('Error fetching seller stats:', error);
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
    <div className="seller-dashboard-container">
      <header className="seller-dashboard-header">
        <div className="seller-header-content">
          <h1>Welcome back, {user.name}! 🐾</h1>
          <p>Manage your dog listings and product sales</p>
        </div>
        <button className="seller-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Quick Actions */}
      <section className="seller-quick-actions">
        <div className="seller-actions-grid">
          <div className="seller-action-card" onClick={() => navigate('/sell_dog')}>
            <div className="seller-action-icon">🐕</div>
            <h3>Sell Dog</h3>
            <p>List dogs for adoption</p>
          </div>

          <div className="seller-action-card" onClick={() => navigate('/manage_dog_orders')}>
            <div className="seller-action-icon">📋</div>
            <h3>View Dog Orders</h3>
            <p>Manage adoption requests</p>
          </div>

          <div className="seller-action-card" onClick={() => navigate('/seller/products')}>
            <div className="seller-action-icon">🛍️</div>
            <h3>Sell Products</h3>
            <p>Add pet accessories</p>
          </div>

          <div className="seller-action-card" onClick={() => navigate('/seller/orders')}>
            <div className="seller-action-icon">📦</div>
            <h3>View Product Orders</h3>
            <p>Manage product sales</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SellerDashboard;