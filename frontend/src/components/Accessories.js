import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Accessories = () => {
  const navigate = useNavigate();

  // Sample accessories data
  const accessoriesList = [
    { id: 1, name: "Dog Collar", price: 250, img: "/logo/collor.jpg" },
    { id: 2, name: "Dog Toy", price: 150, img: "/logo/toy.jpg" },
    { id: 3, name: "Dog Food Pack", price: 500, img: "/logo/food.jpg" },
    { id: 4, name: "Dog Bed", price: 1200, img: "/logo/bed.jpg" },
    { id: 5, name: "Leash", price: 300, img: "/logo/leash.jpg" },
    { id: 6, name: "Grooming Kit", price: 800, img: "/logo/grooming.jpg" },
    { id: 7, name: "Food Bowl", price: 350, img: "/logo/bowl.jpg" },
    { id: 8, name: "Dog Shampoo", price: 280, img: "/logo/shampoo.jpg" },
  ];

  const [cart, setCart] = useState([]);
  const [showPayment, setShowPayment] = useState(false);

  // Add item to cart
  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart(cart.filter((item, idx) => idx !== id));
  };

  // Place order
  const placeOrder = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    setShowPayment(true);
  };

  // Calculate total
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="accessories-container">
      <header className="accessories-header">
        <h1>Premium Dog Accessories</h1>
        <p>Everything your furry friend needs for a happy life</p>
      </header>

      {/* Accessories Grid */}
      <section className="accessories-grid">
        {accessoriesList.map((item) => (
          <div className="product-card" key={item.id}>
            <div className="product-image">
              <img
                src={item.img}
                alt={item.name}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150?text=Product+Image";
                }}
              />
              <button 
                className="add-to-cart-btn"
                onClick={() => addToCart(item)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                </svg>
                Add to Cart
              </button>
            </div>
            
            <div className="product-info">
              <h3>{item.name}</h3>
              <p className="product-price">₹{item.price}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Cart Section */}
      <aside className="cart-section">
        <h2>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
          Your Cart ({cart.length})
        </h2>
        
        {cart.length === 0 ? (
          <div className="empty-cart">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="#ccc" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            <p>Your cart is empty</p>
          </div>
        ) : (
          <div className="cart-items">
            {cart.map((item, idx) => (
              <div className="cart-item" key={idx}>
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">₹{item.price}</span>
                </div>
                <button
                  onClick={() => removeFromCart(idx)}
                  className="remove-item-btn"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            ))}
            
            <div className="cart-total">
              <span>Total:</span>
              <span>₹{total}</span>
            </div>
            
            <button
              onClick={placeOrder}
              className="place-order-btn"
            >
              Place Order
            </button>
          </div>
        )}
      </aside>

      {/* Payment Modal */}
      {showPayment && (
        <div className="payment-modal">
          <div className="payment-content">
            <button 
              className="close-modal"
              onClick={() => setShowPayment(false)}
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
            
            <h2>Complete Your Purchase</h2>
            
            <div className="payment-summary">
              <h3>Order Summary</h3>
              {cart.map((item, idx) => (
                <div className="order-item" key={idx}>
                  <span>{item.name}</span>
                  <span>₹{item.price}</span>
                </div>
              ))}
              <div className="order-total">
                <span>Total:</span>
                <span>₹{total}</span>
              </div>
            </div>
            
            <div className="payment-method">
              <h3>Scan & Pay with GPay</h3>
              <div className="qrcode-container">
                <img
                  src="/logo/gpay.png"
                  alt="GPay QR Code"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/200?text=GPay+QR+Code";
                  }}
                />
              </div>
              <p>After payment, your order will be confirmed</p>
            </div>
            
            <button
              onClick={() => navigate("/")}
              className="back-to-dashboard-btn"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .accessories-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 30px;
          align-items: start;
        }
        
        .accessories-header {
          grid-column: 1 / -1;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .accessories-header h1 {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .accessories-header p {
          font-size: 1.1rem;
          color: #7f8c8d;
          margin: 0;
        }
        
        .accessories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 25px;
        }
        
        .product-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        
        .product-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .product-card:hover .product-image img {
          transform: scale(1.05);
        }
        
        .add-to-cart-btn {
          position: absolute;
          bottom: 15px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 15px;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.3s ease;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        
        .product-card:hover .add-to-cart-btn {
          opacity: 1;
        }
        
        .add-to-cart-btn:hover {
          background: #ff6f61;
          color: white;
        }
        
        .product-info {
          padding: 20px;
        }
        
        .product-info h3 {
          margin: 0 0 10px 0;
          font-size: 1.2rem;
          color: #2c3e50;
        }
        
        .product-price {
          font-size: 1.3rem;
          font-weight: 700;
          color: #ff6f61;
          margin: 0;
        }
        
        .cart-section {
          background: #fff;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          position: sticky;
          top: 20px;
        }
        
        .cart-section h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 20px 0;
          font-size: 1.5rem;
          color: #2c3e50;
        }
        
        .empty-cart {
          text-align: center;
          padding: 30px 0;
          color: #95a5a6;
        }
        
        .empty-cart p {
          margin: 15px 0 0 0;
        }
        
        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        
        .cart-item-info {
          display: flex;
          flex-direction: column;
        }
        
        .cart-item-name {
          font-weight: 500;
        }
        
        .cart-item-price {
          color: #ff6f61;
          font-size: 0.9rem;
        }
        
        .remove-item-btn {
          background: none;
          border: none;
          color: #e74c3c;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        
        .remove-item-btn:hover {
          background: rgba(231, 76, 60, 0.1);
        }
        
        .cart-total {
          display: flex;
          justify-content: space-between;
          margin: 20px 0;
          padding: 15px 0;
          border-top: 2px solid #eee;
          font-weight: 700;
          font-size: 1.2rem;
        }
        
        .place-order-btn {
          width: 100%;
          padding: 15px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        
        .place-order-btn:hover {
          background: #218838;
        }
        
        .payment-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .payment-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 500px;
          width: 100%;
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .close-modal {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          cursor: pointer;
          color: #7f8c8d;
        }
        
        .payment-content h2 {
          text-align: center;
          margin: 0 0 25px 0;
          color: #2c3e50;
        }
        
        .payment-summary, .payment-method {
          margin-bottom: 25px;
        }
        
        .payment-summary h3, .payment-method h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }
        
        .order-item, .order-total {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        
        .order-item {
          border-bottom: 1px solid #eee;
        }
        
        .order-total {
          font-weight: 700;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #eee;
        }
        
        .qrcode-container {
          text-align: center;
          margin: 20px 0;
        }
        
        .qrcode-container img {
          width: 200px;
          height: 200px;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 10px;
          background: white;
        }
        
        .payment-method p {
          text-align: center;
          color: #7f8c8d;
          margin: 0;
        }
        
        .back-to-dashboard-btn {
          width: 100%;
          padding: 12px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        
        .back-to-dashboard-btn:hover {
          background: #0069d9;
        }
        
        @media (max-width: 900px) {
          .accessories-container {
            grid-template-columns: 1fr;
          }
          
          .cart-section {
            position: static;
            margin-top: 30px;
          }
        }
        
        @media (max-width: 600px) {
          .accessories-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Accessories;