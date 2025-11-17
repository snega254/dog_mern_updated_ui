import React, { useState, useEffect } from 'react';
import './SellerProducts.css';

const API_BASE = 'http://localhost:5000/api';

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Debug authentication
  useEffect(() => {
    console.log('🔐 DEBUG AUTHENTICATION:');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('Token:', token);
    console.log('User:', user);
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        console.log('User Data:', userData);
        setIsAuthenticated(true);
        fetchSellerProducts();
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    } else {
      console.log('❌ No token or user found in localStorage');
      alert('Please login first');
      window.location.href = '/login';
    }
  }, []);

  // Get token with debug
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    console.log('🔑 Getting token:', token);
    return token;
  };

  const fetchSellerProducts = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No token found');
      }

      console.log('📡 Fetching products with token:', token);

      const response = await fetch(`${API_BASE}/products/seller/my-products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (response.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Products fetched:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert(error.message);
      if (error.message.includes('Session expired')) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Please login to add products');
      }

      console.log('🔄 Submitting product with token:', token);

      // Create FormData
      const formData = new FormData();
      formData.append('name', 'Test Product');
      formData.append('description', 'Test Description');
      formData.append('price', '100');
      formData.append('category', 'Toys');
      formData.append('stock', '10');
      formData.append('brand', 'Test Brand');

      // For testing, let's first try without image
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData
      });

      console.log('Submit response status:', response.status);
      console.log('Submit response headers:', response.headers);

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to save product: ${response.status}`);
      }

      const result = await response.json();
      alert('Product added successfully!');
      setShowAddForm(false);
      fetchSellerProducts();

    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.message);
      if (error.message.includes('Session expired')) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="loading">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="seller-products-container">
      <div className="seller-products-header">
        <h1>🛍️ Seller Products</h1>
        <p>Manage your product listings</p>
        
        <div className="debug-panel">
          <h3>🔧 Debug Information</h3>
          <button onClick={() => {
            console.log('Current token:', localStorage.getItem('token'));
            console.log('Current user:', localStorage.getItem('user'));
            alert('Check console for debug info');
          }}>
            Show Debug Info
          </button>
          
          <button onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}>
            Clear Storage & Login
          </button>
        </div>

        <button 
          onClick={() => setShowAddForm(true)} 
          className="add-product-btn"
        >
          + Add New Product
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="product-form-modal">
          <div className="product-form-content">
            <h2>Add New Product</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue="Test Product"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  defaultValue="Test Description"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  name="price"
                  defaultValue="100"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select name="category" defaultValue="Toys">
                  <option value="Toys">Toys</option>
                  <option value="Food">Food</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  defaultValue="10"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Brand</label>
                <input
                  type="text"
                  name="brand"
                  defaultValue="Test Brand"
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Product'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="products-section">
        <h2>Your Products ({products.length})</h2>
        
        {loading && <div className="loading">Loading products...</div>}

        {!loading && products.length === 0 && (
          <div className="empty-products">
            <p>No products found. Add your first product!</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product._id} className="product-card">
                <img 
                  src={`http://localhost:5000${product.image}`} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = '/placeholder-product.jpg';
                  }}
                />
                <h3>{product.name}</h3>
                <p className="price">₹{product.price}</p>
                <p className="stock">Stock: {product.stock}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;