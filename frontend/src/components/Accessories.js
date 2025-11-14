import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Accessories.css';

const Accessories = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const addToCart = (product) => {
    const exists = cart.find((item) => item.productId === product._id);
    if (exists) {
      setCart(cart.map(item =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { 
        productId: product._id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        image: product.image 
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const orderData = {
        products: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        shippingAddress: {
          name: 'John Doe',
          address: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          phone: '9876543210'
        }
      };

      await axios.post(
        'http://localhost:5000/api/orders/accessories',
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Order placed successfully!');
      setCart([]);
      setShowCart(false);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="accessories-container">
      <div className="accessories-header">
        <h1>🛍️ Dog Accessories Shop</h1>
        <p>Premium products for your furry friends</p>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <div className="product-image">
              <img 
                src={product.image ? `http://localhost:5000${product.image}` : 'http://localhost:5000/uploads/placeholder-product.jpg'} 
                alt={product.name}
                onError={(e) => {
                  e.target.src = 'http://localhost:5000/uploads/placeholder-product.jpg';
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
              </div>
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

      {/* Cart Toggle Button */}
      <button onClick={() => setShowCart(true)} className="cart-toggle-btn">
        🛒
        {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
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
                  src={item.image ? `http://localhost:5000${item.image}` : 'http://localhost:5000/uploads/placeholder-product.jpg'} 
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
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accessories;