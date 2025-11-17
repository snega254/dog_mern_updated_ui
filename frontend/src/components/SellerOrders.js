import React, { useState, useEffect } from 'react';
import './SellerOrders.css';

const API_BASE = 'http://localhost:5000/api';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Load orders from API
  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const fetchSellerOrders = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/accessory-orders/seller/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/accessory-orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert(`Order ${newStatus} successfully!`);
        fetchSellerOrders(); // Refresh orders
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert(error.message || 'Error updating order');
    } finally {
      setLoading(false);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="seller-orders-container">
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="seller-orders-container">
        <div className="seller-orders-header">
          <h1>📦 Product Orders</h1>
          <p>Manage your product sales and orders</p>
        </div>

        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>Your product orders will appear here when customers place orders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-orders-container">
      <div className="seller-orders-header">
        <h1>📦 Product Orders</h1>
        <p>Manage your product sales and orders</p>
      </div>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order._id} className="order-card">
            <div className="order-header">
              <div className="order-info">
                <h3>Order #{order.orderId}</h3>
                <span className={`status-badge ${order.status}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-date">
                {new Date(order.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="order-customer">
              <strong>Customer:</strong> {order.userId?.name || 'Customer'} 
              {order.userId?.email && ` (${order.userId.email})`}
            </div>

            <div className="order-items">
              <h4>Order Items:</h4>
              {order.products.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-details">
                    <div className="item-name">
                      <strong>{item.name}</strong>
                      <span className="product-id">ID: {item.productDbId}</span>
                    </div>
                    <div className="item-quantity-price">
                      <span>Qty: {item.quantity}</span>
                      <span>₹{item.price} each</span>
                    </div>
                  </div>
                  <div className="item-total">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-total">
              <strong>Total Amount: ₹{order.totalAmount}</strong>
            </div>

            <div className="shipping-address">
              <h4>Shipping Address:</h4>
              <p>{order.shippingAddress?.name}</p>
              <p>{order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
              <p>Phone: {order.shippingAddress?.phone}</p>
            </div>

            <div className="payment-info">
              <strong>Payment Method:</strong> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
            </div>

            <div className="order-actions">
              {order.status === 'pending' && (
                <>
                  <button 
                    onClick={() => updateOrderStatus(order._id, 'confirmed')}
                    className="confirm-btn"
                    disabled={loading}
                  >
                    Confirm Order
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order._id, 'cancelled')}
                    className="cancel-btn"
                    disabled={loading}
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {order.status === 'confirmed' && (
                <button 
                  onClick={() => updateOrderStatus(order._id, 'shipped')}
                  className="ship-btn"
                  disabled={loading}
                >
                  Mark as Shipped
                </button>
              )}
              {order.status === 'shipped' && (
                <button 
                  onClick={() => updateOrderStatus(order._id, 'delivered')}
                  className="deliver-btn"
                  disabled={loading}
                >
                  Mark as Delivered
                </button>
              )}
              {(order.status === 'delivered' || order.status === 'cancelled') && (
                <span className="final-status">Order {order.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerOrders;