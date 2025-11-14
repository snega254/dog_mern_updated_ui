import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ManageDogOrders.css';

const ManageDogOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      ));

      alert(`Order ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'pending', label: 'Pending' },
      confirmed: { class: 'confirmed', label: 'Confirmed' },
      completed: { class: 'completed', label: 'Completed' },
      cancelled: { class: 'cancelled', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getFilteredOrders = () => {
    if (statusFilter === 'all') return orders;
    return orders.filter(order => order.status === statusFilter);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const getStatusActions = (order) => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="order-actions">
            <button
              onClick={() => updateOrderStatus(order._id, 'confirmed')}
              className="btn-confirm"
            >
              Confirm Adoption
            </button>
            <button
              onClick={() => updateOrderStatus(order._id, 'cancelled')}
              className="btn-cancel"
            >
              Cancel
            </button>
          </div>
        );
      case 'confirmed':
        return (
          <div className="order-actions">
            <button
              onClick={() => updateOrderStatus(order._id, 'completed')}
              className="btn-complete"
            >
              Mark as Completed
            </button>
            <button
              onClick={() => updateOrderStatus(order._id, 'cancelled')}
              className="btn-cancel"
            >
              Cancel
            </button>
          </div>
        );
      case 'completed':
        return (
          <div className="order-actions">
            <span className="completed-text">Adoption Completed</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="order-actions">
            <span className="cancelled-text">Order Cancelled</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading adoption requests...</p>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="manage-orders-container">
      <header className="orders-header">
        <div className="header-content">
          <h1>🐕 Manage Adoption Requests</h1>
          <p>Review and manage incoming dog adoption requests</p>
        </div>
        <button onClick={() => navigate('/dashboard_seller')} className="back-btn">
          Back to Dashboard
        </button>
      </header>

      {/* Stats Overview */}
      <div className="orders-stats">
        <div className="stat-card">
          <div className="stat-number">{orders.length}</div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {orders.filter(o => o.status === 'confirmed').length}
          </div>
          <div className="stat-label">Confirmed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {orders.filter(o => o.status === 'completed').length}
          </div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📋</div>
            <h3>No adoption requests found</h3>
            <p>When you receive adoption requests, they will appear here.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>{order.dogId?.breed || 'Unknown Breed'}</h3>
                  <p className="order-id">Request ID: {order._id}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="order-details">
                <div className="detail-row">
                  <span className="detail-label">Dog ID:</span>
                  <span className="detail-value">{order.dogId?.dogId || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Requested by:</span>
                  <span className="detail-value">
                    {order.userId?.name} ({order.userId?.email})
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Contact:</span>
                  <span className="detail-value">{order.userId?.contact || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Requested on:</span>
                  <span className="detail-value">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {order.message && (
                  <div className="detail-row">
                    <span className="detail-label">Message:</span>
                    <span className="detail-value message-text">{order.message}</span>
                  </div>
                )}
              </div>

              <div className="order-footer">
                <button
                  onClick={() => handleViewDetails(order)}
                  className="btn-details"
                >
                  View Details
                </button>
                {getStatusActions(order)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Adoption Request Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="close-modal"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Dog Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Breed:</span>
                    <span>{selectedOrder.dogId?.breed}</span>
                  </div>
                  <div className="detail-item">
                    <span>Dog ID:</span>
                    <span>{selectedOrder.dogId?.dogId}</span>
                  </div>
                  <div className="detail-item">
                    <span>Age:</span>
                    <span>{selectedOrder.dogId?.age}</span>
                  </div>
                  <div className="detail-item">
                    <span>Gender:</span>
                    <span>{selectedOrder.dogId?.gender}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Adopter Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Name:</span>
                    <span>{selectedOrder.userId?.name}</span>
                  </div>
                  <div className="detail-item">
                    <span>Email:</span>
                    <span>{selectedOrder.userId?.email}</span>
                  </div>
                  <div className="detail-item">
                    <span>Contact:</span>
                    <span>{selectedOrder.userId?.contact || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.message && (
                <div className="detail-section">
                  <h3>Adopter's Message</h3>
                  <div className="message-box">
                    {selectedOrder.message}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>Request Timeline</h3>
                <div className="timeline">
                  <div className="timeline-item">
                    <span className="timeline-date">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </span>
                    <span className="timeline-event">Adoption Request Submitted</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-close"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDogOrders;