import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Index.css';

const Index = () => {

  // Single realistic background image
  const backgroundImage = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80';

  return (
    <div className="index-container">
      {/* Single Background Image */}
      <div 
        className="background-image"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* Content Overlay */}
      <div className="content-overlay">

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🐕</div>
            <h3>Adopt a Dog</h3>
            <p>Find loving dogs waiting for their forever homes</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🛍️</div>
            <h3>Shop Accessories</h3>
            <p>Premium dog food, toys, and care products</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👨‍⚕️</div>
            <h3>Vet Care</h3>
            <p>Book appointments with expert veterinarians</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>AI Assistant</h3>
            <p>Get expert advice for your dog's needs</p>
          </div>
        </div>

        <div className="login-options">
          <Link to="/login_user" className="btn interactive-btn user-btn">
            <span className="btn-icon">👤</span>
            User Login
          </Link>
          <Link to="/login_seller" className="btn interactive-btn seller-btn">
            <span className="btn-icon">👤</span>
            Seller Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;