import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ManageDogOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const confirmOrder = async (index) => {
    const order = orders[index];
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order._id}`,
        { status: 'confirmed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedOrders = orders.map((o, i) =>
        i === index ? { ...o, status: 'confirmed' } : o
      );
      setOrders(updatedOrders);
      alert(`${order.dogId.breed}'s order is confirmed!`);
    } catch (err) {
      console.error(err);
      alert('Error confirming order');
    }
  };

  const markSold = async (index) => {
    const order = orders[index];
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${order._id}`,
        { status: 'sold' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedOrders = orders.map((o, i) =>
        i === index ? { ...o, status: 'sold' } : o
      );
      setOrders(updatedOrders);
      alert(`${order.dogId.breed} is marked as Sold!`);
    } catch (err) {
      console.error(err);
      alert('Error marking as sold');
    }
  };

  const cancelOrder = async (index) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      const order = orders[index];
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`http://localhost:5000/api/orders/${order._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedOrders = orders.filter((_, i) => i !== index);
        setOrders(updatedOrders);
        alert(`${order.dogId.breed} order deleted.`);
      } catch (err) {
        console.error(err);
        alert('Error deleting order');
      }
    }
  };

  if (loading) return (
    <div className="orders-container">
      <div className="loading-spinner"></div>
      <p>Loading orders...</p>
    </div>
  );
  
  if (error) return (
    <div className="orders-container">
      <div className="error-message">{error}</div>
    </div>
  );
  
  if (orders.length === 0) return (
    <div className="orders-container">
      <div className="no-orders">
        <svg viewBox="0 0 24 24" width="64" height="64">
          <path fill="#ccc" d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/>
        </svg>
        <h3>No orders found</h3>
        <p>There are currently no dog orders to manage.</p>
        <button className="back-button" onClick={() => navigate('/sell-dog')}>
          Back to Sell Dog
        </button>
      </div>
    </div>
  );

  return (
    <div className="orders-container">
      <header className="orders-header">
        <h1>Manage Dog Orders</h1>
        <p>Review and manage all dog adoption orders</p>
      </header>

      <div className="orders-grid">
        {orders.map((order, index) => (
          <div className="order-card" key={order._id}>
            <div className="order-image">
              <img
                src={
                  order.dogId?.image && order.dogId.image.trim() !== ''
                    ? `http://localhost:5000/uploads/${order.dogId.image.split('/').pop()}`
                    : 'http://localhost:5000/uploads/placeholder-image.jpg'
                }
                alt={order.dogId?.breed || 'Dog'}
                onError={(e) => {
                  e.target.src = 'http://localhost:5000/uploads/placeholder-image.jpg';
                }}
              />
              <div className={`status-badge ${order.status}`}>
                {order.status}
              </div>
            </div>
            
            <div className="order-details">
              <h3>{order.dogId?.breed || 'Unknown Breed'}</h3>
              <p className="dog-id">ID: {order.dogId?.dogId || 'N/A'}</p>
              
              <div className="customer-info">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>{order.customerName || 'Unknown Customer'}</span>
              </div>
              
              <div className="order-date">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="order-actions">
              {order.status === 'pending' && (
                <>
                  <button 
                    className="btn-confirm"
                    onClick={() => confirmOrder(index)}
                  >
                    Confirm Order
                  </button>
                  <button 
                    className="btn-sold"
                    onClick={() => markSold(index)}
                  >
                    Mark as Sold
                  </button>
                  <button 
                    className="btn-cancel"
                    onClick={() => cancelOrder(index)}
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {order.status === 'confirmed' && (
                <>
                  <button 
                    className="btn-sold"
                    onClick={() => markSold(index)}
                  >
                    Mark as Sold
                  </button>
                  <button 
                    className="btn-cancel"
                    onClick={() => cancelOrder(index)}
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {order.status === 'sold' && (
                <div className="sold-badge">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Sold
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="footer-actions">
        <button className="back-button" onClick={() => navigate('/sell-dog')}>
          Back to Sell Dog
        </button>
      </div>

      <style jsx>{`
        .orders-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
        }
        
        .orders-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .orders-header h1 {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .orders-header p {
          font-size: 1.1rem;
          color: #7f8c8d;
          margin: 0;
        }
        
        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 25px;
          margin-bottom: 40px;
        }
        
        .order-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        
        .order-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        
        .order-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        
        .order-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .status-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-badge.pending {
          background: #fff4e6;
          color: #e67700;
        }
        
        .status-badge.confirmed {
          background: #d3f9d8;
          color: #2b8a3e;
        }
        
        .status-badge.sold {
          background: #d0ebff;
          color: #1971c2;
        }
        
        .order-details {
          padding: 20px;
          flex-grow: 1;
        }
        
        .order-details h3 {
          margin: 0 0 5px 0;
          font-size: 1.3rem;
          color: #2c3e50;
        }
        
        .dog-id {
          color: #7f8c8d;
          margin: 0 0 15px 0;
          font-size: 0.9rem;
        }
        
        .customer-info, .order-date {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 0.9rem;
          color: #5c6b7e;
        }
        
        .order-actions {
          padding: 0 20px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .order-actions button {
          padding: 10px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-confirm {
          background: #40c057;
          color: white;
        }
        
        .btn-confirm:hover {
          background: #2f9e44;
        }
        
        .btn-sold {
          background: #228be6;
          color: white;
        }
        
        .btn-sold:hover {
          background: #1c7ed6;
        }
        
        .btn-cancel {
          background: #fa5252;
          color: white;
        }
        
        .btn-cancel:hover {
          background: #e03131;
        }
        
        .sold-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: #d3f9d8;
          color: #2b8a3e;
          border-radius: 6px;
          font-weight: 600;
        }
        
        .footer-actions {
          text-align: center;
          margin-top: 30px;
        }
        
        .back-button {
          padding: 12px 24px;
          background: #495057;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        
        .back-button:hover {
          background: #343a40;
        }
        
        .no-orders {
          text-align: center;
          padding: 60px 20px;
          color: #95a5a6;
        }
        
        .no-orders h3 {
          margin: 20px 0 10px 0;
          font-size: 1.5rem;
        }
        
        .loading-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        .error-message {
          background: #ffecec;
          color: #e74c3c;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .orders-grid {
            grid-template-columns: 1fr;
          }
          
          .order-card {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ManageDogOrders;