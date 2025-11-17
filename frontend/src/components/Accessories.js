import React, { useState, useEffect } from 'react';
import './Accessories.css';

const API_BASE = 'http://localhost:5000/api';

const Accessories = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    brand: 'all'
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Check if user is authenticated
  useEffect(() => {
    const token = getAuthToken();
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategoriesAndBrands();
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('userCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Fetch products from API with authentication
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const queryParams = new URLSearchParams();
      if (filters.category !== 'all') queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.sort) queryParams.append('sort', filters.sort);
      if (filters.brand !== 'all') queryParams.append('brand', filters.brand);

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/products?${queryParams}`, {
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, redirect to login
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          throw new Error('Please login to access products');
        }
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert(error.message || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndBrands = async () => {
    try {
      const token = getAuthToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/products/categories/all`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setBrands(data.brands || []);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      search: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      brand: 'all'
    });
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  // Save cart to localStorage
  const saveCart = (cartItems) => {
    localStorage.setItem('userCart', JSON.stringify(cartItems));
    setCart(cartItems);
  };

  const addToCart = (product) => {
    if (product.stock === 0) return;
    
    const exists = cart.find((item) => item.productId === product.productId);
    if (exists) {
      if (exists.quantity >= product.stock) {
        alert('Cannot add more than available stock');
        return;
      }
      const updatedCart = cart.map(item =>
        item.productId === product.productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(updatedCart);
    } else {
      const newCartItem = { 
        productId: product.productId,
        productDbId: product._id,
        name: product.name, 
        price: product.price, 
        quantity: 1,
        image: product.image,
        sellerId: product.sellerId?._id || product.sellerId
      };
      saveCart([...cart, newCartItem]);
    }
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item.productId !== productId);
    saveCart(updatedCart);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.productId === productId);
    if (product && newQuantity > product.stock) {
      alert('Cannot add more than available stock');
      return;
    }
    
    const updatedCart = cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    saveCart(updatedCart);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      alert('Please login to place an order');
      return;
    }
    
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePayment = async (paymentMethod) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to place an order');
        return;
      }
      
      // Create order payload
      const orderData = {
        products: cart.map(item => ({
          productId: item.productDbId,
          quantity: item.quantity
        })),
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod
      };

      const response = await fetch(`${API_BASE}/accessory-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        
        alert(`Order placed successfully! Order ID: ${result.order.orderId}`);
        saveCart([]);
        setShowCart(false);
        setShowPaymentModal(false);
        setShippingAddress({
          name: '', address: '', city: '', state: '', pincode: '', phone: ''
        });
        
        // Refresh products to update stock
        fetchProducts();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert(error.message || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Add login prompt component
  const LoginPrompt = () => (
    <div className="login-prompt">
      <div className="login-prompt-content">
        <h3>🔐 Login Required</h3>
        <p>Please login to browse and shop for accessories</p>
        <button 
          onClick={() => window.location.href = '/login'} 
          className="login-btn"
        >
          Go to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="accessories-container">
      <div className="accessories-header">
        <h1>🛍️ Dog Accessories Shop</h1>
        <p>Premium products for your furry friends</p>
        {!isAuthenticated && (
          <div className="auth-alert">
            <span>Please login to shop</span>
          </div>
        )}
      </div>

      {!isAuthenticated ? (
        <LoginPrompt />
      ) : (
        <>
          {/* Filters Section */}
          <div className="filters-section">
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
            </div>

            <div className="filters-grid">
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Brand</label>
                <select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Min Price</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="filter-select"
                />
              </div>

              <div className="filter-group">
                <label>Max Price</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="filter-select"
                />
              </div>

              <div className="filter-group">
                <label>Sort By</label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="filter-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <button onClick={clearFilters} className="clear-filters-btn">
                Clear Filters
              </button>
            </div>
          </div>

          {loading && <div className="loading">Loading products...</div>}

          {/* Products Grid */}
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-image">
                  <img 
                    src={`http://localhost:5000${product.image}` || '/placeholder-product.jpg'} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = '/placeholder-product.jpg';
                    }}
                  />
                  {product.stock === 0 && <div className="out-of-stock">Out of Stock</div>}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  
                  <div className="product-meta">
                    <span className="product-category">{product.category}</span>
                    {product.brand && <span className="product-brand">{product.brand}</span>}
                    <span className="product-id-small">ID: {product.productId}</span>
                  </div>

                  {/* Seller Info */}
                  {product.sellerId && (
                    <div className="seller-info">
                      <small>Sold by: {product.sellerId.name || 'Seller'}</small>
                    </div>
                  )}

                  {/* Specifications */}
                  {product.specifications && (
                    <div className="specifications-preview">
                      {product.specifications.material && (
                        <span className="spec-badge">{product.specifications.material}</span>
                      )}
                      {product.specifications.size && (
                        <span className="spec-badge">{product.specifications.size}</span>
                      )}
                      {product.specifications.color && (
                        <span className="spec-badge">{product.specifications.color}</span>
                      )}
                    </div>
                  )}

                  <div className="product-price">₹{product.price}</div>
                  <div className="product-stock">
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </div>
                  <button 
                    onClick={() => addToCart(product)}
                    className="add-to-cart-btn"
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && !loading && (
            <div className="empty-products">
              <div className="empty-icon">🛍️</div>
              <h3>No Products Found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear All Filters
              </button>
            </div>
          )}

          {/* Cart Toggle Button */}
          <button onClick={() => setShowCart(true)} className="cart-toggle-btn">
            🛒
            {cart.length > 0 && <span className="cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
          </button>

          {/* Cart Sidebar */}
          <div className={`cart-sidebar ${showCart ? 'active' : ''}`}>
            <div className="cart-header">
              <h3>Your Cart</h3>
              <button onClick={() => setShowCart(false)} className="close-cart">
                ×
              </button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Your cart is empty</p>
                  <button onClick={() => setShowCart(false)} className="continue-shopping">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <img 
                      src={`http://localhost:5000${item.image}` || '/placeholder-product.jpg'} 
                      alt={item.name}
                      className="cart-item-image"
                    />
                    <div className="cart-item-details">
                      <h4>{item.name}</h4>
                      <div className="cart-item-price">₹{item.price}</div>
                      <div className="quantity-controls">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      className="remove-item-btn"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span>₹{total}</span>
                </div>
                <button onClick={handleCheckout} className="checkout-btn">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>

          {/* Payment Modal */}
          {showPaymentModal && (
            <div className="modal-overlay">
              <div className="modal-content payment-modal">
                <h2>Complete Your Order</h2>
                
                <div className="shipping-form">
                  <h3>Shipping Address</h3>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                    className="form-input"
                    required
                  />
                  <textarea
                    placeholder="Full Address"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                    className="form-textarea"
                    rows="3"
                    required
                  />
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      className="form-input"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={shippingAddress.pincode}
                      onChange={(e) => setShippingAddress({...shippingAddress, pincode: e.target.value})}
                      className="form-input"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="order-summary">
                  <h3>Order Summary</h3>
                  <div className="order-items">
                    {cart.map(item => (
                      <div key={item.productId} className="order-item">
                        <span>{item.name} x {item.quantity}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-total">
                    <span>Total Amount:</span>
                    <span>₹{total}</span>
                  </div>
                </div>

                <div className="payment-options">
                  <h3>Payment Method</h3>
                  <div className="payment-buttons">
                    <button 
                      onClick={() => handlePayment('cod')}
                      className="payment-btn cod-btn"
                      disabled={loading}
                    >
                      💰 Cash on Delivery
                    </button>
                    <button 
                      onClick={() => handlePayment('online')}
                      className="payment-btn online-btn"
                      disabled={loading}
                    >
                      💳 Pay Online
                    </button>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="cancel-btn"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Accessories;