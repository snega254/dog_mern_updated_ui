import React, { useState, useEffect } from 'react';
import './SellerOrders.css';

const API_BASE = 'http://localhost:5000/api';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
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
        setSelectedOrder(null); // Close details
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

  // Confirm Payment Received
  const confirmPayment = async (orderId) => {
    if (!window.confirm('Are you sure you have received the payment for this order?')) return;
    
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/accessory-orders/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          paymentStatus: 'paid',
          paymentConfirmedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('✅ Payment confirmed successfully! Order can now be processed.');
        fetchSellerOrders(); // Refresh orders
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Error confirming payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark Payment as Failed
  const cancelPayment = async (orderId) => {
    if (!window.confirm('Mark this payment as not received? The order will be cancelled.')) return;
    
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/accessory-orders/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          paymentStatus: 'failed',
          status: 'cancelled'
        })
      });

      if (response.ok) {
        alert('Payment marked as failed. Order cancelled.');
        fetchSellerOrders(); // Refresh orders
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = (order) => {
    if (selectedOrder && selectedOrder._id === order._id) {
      setSelectedOrder(null);
    } else {
      setSelectedOrder(order);
    }
  };

  // Calculate total earnings
  const calculateTotalEarnings = () => {
    return orders.reduce((total, order) => {
      if (order.paymentStatus === 'paid' || order.paymentMethod === 'cod') {
        return total + order.totalAmount;
      }
      return total;
    }, 0);
  };

  // Filter orders by status
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const confirmedOrders = orders.filter(order => order.status === 'confirmed');
  const shippedOrders = orders.filter(order => order.status === 'shipped');
  const deliveredOrders = orders.filter(order => order.status === 'delivered');
  const pendingPaymentOrders = orders.filter(order => 
    order.paymentMethod === 'online' && (!order.paymentStatus || order.paymentStatus === 'pending')
  );

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
        <div className="empty-state-with-header">
          <div className="empty-header">
            <h2>📦 Product Orders</h2>
            <p>Manage your product sales and orders</p>
          </div>
          <div className="empty-body">
            <div className="empty-icon">📦</div>
            <h3>No Orders Yet</h3>
            <p>Your product orders will appear here when customers place orders</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-orders-container">
      <div className="seller-orders-header">
        <h1>📦 Product Orders</h1>
        <p>Manage your product sales and orders</p>
        
        {/* Stats Overview */}
        <div className="orders-stats">
          <div className="stat-card">
            <span className="stat-number">{orders.length}</span>
            <span className="stat-label">Total Orders</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">₹{calculateTotalEarnings()}</span>
            <span className="stat-label">Total Earnings</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{pendingPaymentOrders.length}</span>
            <span className="stat-label">Pending Payment</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{deliveredOrders.length}</span>
            <span className="stat-label">Delivered</span>
          </div>
        </div>
      </div>

      <div className="orders-content">
        {/* Orders List - Scrollable */}
        <div className="orders-list-scrollable">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.orderId}</h3>
                  <span className={`status-badge ${order.status}`}>
                    {order.status}
                  </span>
                  {order.paymentMethod === 'online' && (!order.paymentStatus || order.paymentStatus === 'pending') && (
                    <span className="payment-pending-badge">💰 Payment Pending</span>
                  )}
                </div>
                <div className="order-meta">
                  <div className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => toggleOrderDetails(order)}
                    className="details-btn"
                  >
                    {selectedOrder && selectedOrder._id === order._id ? '▲ Hide' : '▼ Details'}
                  </button>
                </div>
              </div>

              <div className="order-preview">
                <div className="order-customer">
                  <strong>Customer:</strong> {order.userId?.name || 'Customer'} 
                  {order.userId?.email && ` (${order.userId.email})`}
                </div>

                <div className="order-summary">
                  <span>{order.products.length} item(s)</span>
                  <span className="order-total-preview">₹{order.totalAmount}</span>
                </div>

                <div className={`payment-badge ${order.paymentMethod} ${order.paymentStatus}`}>
                  {order.paymentMethod === 'cod' ? '💰 COD' : 
                   order.paymentStatus === 'paid' ? '💳 Paid' :
                   order.paymentStatus === 'failed' ? '❌ Payment Failed' :
                   '💳 Payment Pending'}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedOrder && selectedOrder._id === order._id && (
                <div className="order-details-expanded">
                  <div className="order-items">
                    <h4>📦 Order Items:</h4>
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

                  <div className="order-total-full">
                    <strong>Total Amount: ₹{order.totalAmount}</strong>
                  </div>

                  <div className="shipping-address">
                    <h4>🏠 Shipping Address:</h4>
                    <p><strong>{order.shippingAddress?.name}</strong></p>
                    <p>{order.shippingAddress?.address}</p>
                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                    <p>📞 Phone: {order.shippingAddress?.phone}</p>
                  </div>

                  {/* Enhanced Payment Info */}
                  <div className={`payment-info-full ${order.paymentMethod} ${order.paymentStatus}`}>
                    <div className="payment-header">
                      <h4>💳 Payment Information</h4>
                      <span className={`payment-status ${order.paymentStatus || 'pending'}`}>
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                         order.paymentStatus === 'paid' ? 'Online Payment - PAID' :
                         order.paymentStatus === 'failed' ? 'Online Payment - FAILED' :
                         'Online Payment - PENDING CONFIRMATION'}
                      </span>
                    </div>
                    
                    {order.paymentMethod === 'online' && (
                      <div className="online-payment-details">
                        <div className="payment-detail">
                          <span>Payment Status:</span>
                          <span className={`status-${order.paymentStatus || 'pending'}`}>
                            {order.paymentStatus === 'paid' ? '✅ Payment Received' : 
                             order.paymentStatus === 'failed' ? '❌ Payment Failed' : 
                             '⏳ Waiting for Your Confirmation'}
                          </span>
                        </div>
                        <div className="payment-detail">
                          <span>Amount:</span>
                          <span className="amount">₹{order.totalAmount}</span>
                        </div>
                        
                        {/* Payment Confirmation Date */}
                        {order.paymentConfirmedAt && (
                          <div className="payment-detail">
                            <span>Payment Confirmed:</span>
                            <span>{new Date(order.paymentConfirmedAt).toLocaleString()}</span>
                          </div>
                        )}
                        
                        {/* MANUAL PAYMENT CONFIRMATION BUTTONS */}
                        {order.paymentMethod === 'online' && (!order.paymentStatus || order.paymentStatus === 'pending') && (
                          <div className="payment-actions">
                            <button 
                              onClick={() => confirmPayment(order._id)}
                              className="confirm-payment-btn"
                              disabled={loading}
                            >
                              ✅ Confirm Payment Received
                            </button>
                            <button 
                              onClick={() => cancelPayment(order._id)}
                              className="cancel-payment-btn"
                              disabled={loading}
                            >
                              ❌ Payment Not Received
                            </button>
                          </div>
                        )}
                        
                        <div className="payment-note">
                          💡 <strong>Note:</strong> {order.paymentStatus === 'paid' 
                            ? 'Payment confirmed. You can now process and ship the order.' 
                            : 'Check your bank account and confirm payment only after verifying the receipt.'}
                        </div>
                      </div>
                    )}
                    
                    {order.paymentMethod === 'cod' && (
                      <div className="cod-payment-details">
                        <div className="payment-detail">
                          <span>Payment Status:</span>
                          <span className="status-pending">⏳ Pay on Delivery</span>
                        </div>
                        <div className="payment-detail">
                          <span>Amount to Collect:</span>
                          <span className="amount-pending">₹{order.totalAmount}</span>
                        </div>
                        <div className="payment-note">
                          💡 <strong>Note:</strong> Collect payment when delivering the order.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div className="order-actions">
                    {order.status === 'pending' && order.paymentStatus !== 'failed' && (
                      <>
                        <button 
                          onClick={() => updateOrderStatus(order._id, 'confirmed')}
                          className="confirm-btn"
                          disabled={loading || (order.paymentMethod === 'online' && order.paymentStatus !== 'paid')}
                        >
                          {order.paymentMethod === 'online' && order.paymentStatus !== 'paid' 
                            ? '⏳ Confirm Payment First' 
                            : '✅ Confirm Order'}
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order._id, 'cancelled')}
                          className="cancel-btn"
                          disabled={loading}
                        >
                          ❌ Cancel Order
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button 
                        onClick={() => updateOrderStatus(order._id, 'shipped')}
                        className="ship-btn"
                        disabled={loading}
                      >
                        🚚 Mark as Shipped
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button 
                        onClick={() => updateOrderStatus(order._id, 'delivered')}
                        className="deliver-btn"
                        disabled={loading}
                      >
                        📦 Mark as Delivered
                      </button>
                    )}
                    {(order.status === 'delivered' || order.status === 'cancelled') && (
                      <span className={`final-status ${order.status}`}>
                        {order.status === 'delivered' ? '✅ Order Delivered' : '❌ Order Cancelled'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerOrders;