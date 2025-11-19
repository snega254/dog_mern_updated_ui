import React, { useState, useEffect } from 'react';
import './Accessories.css';

const API_BASE = 'http://localhost:5000/api';

const Accessories = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSellerDetails, setShowSellerDetails] = useState(false);
  const [selectedSellers, setSelectedSellers] = useState([]);
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
  const [formErrors, setFormErrors] = useState({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

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
        sellerId: product.sellerId?._id || product.sellerId,
        sellerName: product.sellerId?.name || 'Seller'
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

  // Get unique sellers from cart
  const getUniqueSellers = () => {
    const sellers = cart.map(item => ({
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      products: cart.filter(cartItem => cartItem.sellerId === item.sellerId)
    }));
    return sellers.filter((seller, index, self) => 
      index === self.findIndex(s => s.sellerId === seller.sellerId)
    );
  };

  // Validate shipping address
  const validateShippingAddress = () => {
    const errors = {};
    
    if (!shippingAddress.name?.trim()) errors.name = 'Full name is required';
    if (!shippingAddress.address?.trim()) errors.address = 'Address is required';
    if (!shippingAddress.city?.trim()) errors.city = 'City is required';
    if (!shippingAddress.state?.trim()) errors.state = 'State is required';
    if (!shippingAddress.pincode?.trim()) errors.pincode = 'Pincode is required';
    if (!shippingAddress.phone?.trim()) errors.phone = 'Phone number is required';
    
    if (shippingAddress.phone && !/^\d{10}$/.test(shippingAddress.phone)) {
      errors.phone = 'Phone number must be 10 digits';
    }
    
    if (shippingAddress.pincode && !/^\d{6}$/.test(shippingAddress.pincode)) {
      errors.pincode = 'Pincode must be 6 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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

    // Show seller details for online payment confirmation
    setSelectedSellers(getUniqueSellers());
    setShowSellerDetails(true);
  };

  const handlePayment = async (paymentMethod) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to place an order');
        return;
      }

      // VALIDATE SHIPPING ADDRESS BEFORE PROCEEDING
      if (!validateShippingAddress()) {
        alert('Please fix the shipping address errors before placing order');
        setLoading(false);
        return;
      }

      // Create order payload
      const orderData = {
        products: cart.map(item => ({
          productId: item.productDbId,
          productDbId: item.productDbId,
          quantity: item.quantity,
          sellerId: item.sellerId
        })),
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'online' ? 'pending' : 'cod'
      };

      console.log('📦 Order payload:', orderData);

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
        
        if (paymentMethod === 'online') {
          alert(`✅ Order placed successfully!\nOrder ID: ${result.order.orderId}\n\n📧 Sellers have been notified. They will confirm payment and process your order.`);
        } else {
          alert(`✅ Order placed successfully!\nOrder ID: ${result.order.orderId}\n\n💰 Pay ₹${total} when your order is delivered.`);
        }
        
        saveCart([]);
        setShowCart(false);
        setShowPaymentModal(false);
        setShowSellerDetails(false);
        setShippingAddress({
          name: '', address: '', city: '', state: '', pincode: '', phone: ''
        });
        setFormErrors({});
        
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
                      <div className="seller-info-small">
                        Seller: {item.sellerName}
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

          {/* Seller Details Modal */}
          {showSellerDetails && (
            <div className="modal-overlay">
              <div className="modal-content seller-details-modal">
                <h2>🛒 Order Confirmation</h2>
                <p>You are purchasing from {selectedSellers.length} seller(s):</p>
                
                <div className="sellers-list">
                  {selectedSellers.map((seller, index) => (
                    <div key={seller.sellerId} className="seller-card">
                      <h4>Seller {index + 1}: {seller.sellerName}</h4>
                      <div className="seller-products">
                        {seller.products.map(item => (
                          <div key={item.productId} className="seller-product-item">
                            <span>{item.name} x {item.quantity}</span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="seller-total">
                        Total: ₹{seller.products.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="total-amount">
                  <h3>Grand Total: ₹{total}</h3>
                </div>

                <div className="payment-options">
                  <h3>Choose Payment Method</h3>
                  <div className="payment-buttons">
                    <button 
                      onClick={() => {
                        setShowSellerDetails(false);
                        setShowPaymentModal(true);
                        setSelectedPaymentMethod('online');
                      }}
                      className="payment-btn online-btn"
                    >
                      💳 Pay Online
                    </button>
                    <button 
                      onClick={() => {
                        setShowSellerDetails(false);
                        setShowPaymentModal(true);
                        setSelectedPaymentMethod('cod');
                      }}
                      className="payment-btn cod-btn"
                    >
                      💰 Cash on Delivery
                    </button>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    onClick={() => setShowSellerDetails(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payment Modal */}
          {showPaymentModal && (
            <div className="modal-overlay">
              <div className="modal-content payment-modal">
                <h2>Complete Your Order</h2>
                
                <div className="shipping-form">
                  <h3>📬 Shipping Address <span className="required-star">* Required</span></h3>
                  
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={shippingAddress.name}
                      onChange={(e) => {
                        setShippingAddress({...shippingAddress, name: e.target.value});
                        if (formErrors.name) setFormErrors({...formErrors, name: ''});
                      }}
                      className={`form-input ${formErrors.name ? 'error' : ''}`}
                    />
                    {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                  </div>
                  
                  <div className="form-group">
                    <textarea
                      placeholder="Full Address * (House No, Street, Area)"
                      value={shippingAddress.address}
                      onChange={(e) => {
                        setShippingAddress({...shippingAddress, address: e.target.value});
                        if (formErrors.address) setFormErrors({...formErrors, address: ''});
                      }}
                      className={`form-textarea ${formErrors.address ? 'error' : ''}`}
                      rows="3"
                    />
                    {formErrors.address && <span className="field-error">{formErrors.address}</span>}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="City *"
                        value={shippingAddress.city}
                        onChange={(e) => {
                          setShippingAddress({...shippingAddress, city: e.target.value});
                          if (formErrors.city) setFormErrors({...formErrors, city: ''});
                        }}
                        className={`form-input ${formErrors.city ? 'error' : ''}`}
                      />
                      {formErrors.city && <span className="field-error">{formErrors.city}</span>}
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="State *"
                        value={shippingAddress.state}
                        onChange={(e) => {
                          setShippingAddress({...shippingAddress, state: e.target.value});
                          if (formErrors.state) setFormErrors({...formErrors, state: ''});
                        }}
                        className={`form-input ${formErrors.state ? 'error' : ''}`}
                      />
                      {formErrors.state && <span className="field-error">{formErrors.state}</span>}
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Pincode *"
                        value={shippingAddress.pincode}
                        onChange={(e) => {
                          setShippingAddress({...shippingAddress, pincode: e.target.value});
                          if (formErrors.pincode) setFormErrors({...formErrors, pincode: ''});
                        }}
                        className={`form-input ${formErrors.pincode ? 'error' : ''}`}
                        maxLength="6"
                      />
                      {formErrors.pincode && <span className="field-error">{formErrors.pincode}</span>}
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Phone Number *"
                        value={shippingAddress.phone}
                        onChange={(e) => {
                          setShippingAddress({...shippingAddress, phone: e.target.value});
                          if (formErrors.phone) setFormErrors({...formErrors, phone: ''});
                        }}
                        className={`form-input ${formErrors.phone ? 'error' : ''}`}
                        maxLength="10"
                      />
                      {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
                    </div>
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

                {selectedPaymentMethod === 'online' && (
                  <div className="payment-instructions">
                    <h4>💡 Online Payment Instructions:</h4>
                    <p>After placing order, sellers will:</p>
                    <ul>
                      <li>✅ Verify payment receipt</li>
                      <li>✅ Confirm your order</li>
                      <li>🚚 Ship your products</li>
                    </ul>
                    <p>You'll receive notifications at each step!</p>
                  </div>
                )}

                {selectedPaymentMethod === 'cod' && (
                  <div className="payment-instructions cod-instructions">
                    <h4>💰 Cash on Delivery Instructions:</h4>
                    <p>With COD, you can:</p>
                    <ul>
                      <li>✅ Pay when your order arrives</li>
                      <li>✅ Check products before payment</li>
                      <li>✅ No online payment required</li>
                    </ul>
                    <p>Simply pay ₹{total} to the delivery person!</p>
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    onClick={() => {
                      setShowPaymentModal(false);
                      setShowSellerDetails(true);
                    }}
                    className="back-btn"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={() => handlePayment(selectedPaymentMethod)}
                    className={`confirm-payment-btn ${selectedPaymentMethod}`}
                    disabled={loading}
                  >
                    {loading ? 'Placing Order...' : 
                     selectedPaymentMethod === 'online' ? '💳 Place Online Order' : 
                     '💰 Place COD Order'}
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