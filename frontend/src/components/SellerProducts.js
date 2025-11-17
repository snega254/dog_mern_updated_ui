import React, { useState, useEffect, useCallback } from 'react';
import './SellerProducts.css';

const API_BASE = 'http://localhost:5000/api';

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: 'Generic',
    stock: '',
    material: '',
    size: '',
    weight: '',
    color: '',
    image: null
  });
  const [formErrors, setFormErrors] = useState({});

  // Get token from localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      alert('Please login first');
      return null;
    }
    return token;
  };

  const fetchSellerProducts = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/products/seller/my-products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Error fetching products: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSellerProducts();
  }, [fetchSellerProducts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setFormErrors(prev => ({
          ...prev,
          image: 'Please select an image file (JPEG, PNG, WebP)'
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      setFormErrors(prev => ({
        ...prev,
        image: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.price || formData.price <= 0) errors.price = 'Valid price is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.stock || formData.stock < 0) errors.stock = 'Valid stock quantity is required';
    if (!formData.image && !editingProduct) errors.image = 'Product image is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fix the form errors before submitting');
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      const token = getAuthToken();
      console.log('🔑 Token being sent:', token); // Debug line
      
      if (!token) {
        alert('Please login first');
        return;
      }

      const formDataToSend = new FormData();
      
      // Append all form data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('brand', formData.brand || 'Generic');
      formDataToSend.append('stock', formData.stock);
      formDataToSend.append('material', formData.material || '');
      formDataToSend.append('size', formData.size || '');
      formDataToSend.append('weight', formData.weight || '');
      formDataToSend.append('color', formData.color || '');
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      console.log('📤 Sending request to /api/products'); // Debug line

      let response;
      let url = `${API_BASE}/products`;
      
      if (editingProduct) {
        url = `${API_BASE}/products/${editingProduct._id}`;
        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataToSend
        });
      } else {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataToSend
        });
      }

      console.log('📥 Response status:', response.status); // Debug line
      
      const result = await response.json();
      console.log('📦 Response data:', result); // Debug line

      if (response.ok) {
        alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
        fetchSellerProducts();
        
        setShowAddModal(false);
        setEditingProduct(null);
        setFormData({
          name: '', description: '', price: '', category: '', brand: 'Generic', stock: '',
          material: '', size: '', weight: '', color: '', image: null
        });
        setFormErrors({});
      } else {
        throw new Error(result.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('❌ Error saving product:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      brand: product.brand || 'Generic',
      stock: product.stock,
      material: product.specifications?.material || '',
      size: product.specifications?.size || '',
      weight: product.specifications?.weight || '',
      color: product.specifications?.color || '',
      image: null
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Product deleted successfully!');
        fetchSellerProducts();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', price: '', category: '', brand: 'Generic', stock: '',
      material: '', size: '', weight: '', color: '', image: null
    });
    setFormErrors({});
    setEditingProduct(null);
    setShowAddModal(false);
  };

  return (
    <div className="seller-products-container">
      <div className="seller-products-header">
        <h1>🛍️ Manage Your Products</h1>
        <p>Add and manage your pet accessories</p>
        <button 
          onClick={() => setShowAddModal(true)}
          className="add-product-btn"
          disabled={loading}
        >
          {loading ? 'Loading...' : '+ Add New Product'}
        </button>
      </div>

      {loading && <div className="loading">Loading products...</div>}

      <div className="products-grid">
        {products.map(product => (
          <div key={product._id} className="product-card">
            <div className="product-image">
              <img 
                src={`http://localhost:5000${product.image}` || '/placeholder-product.jpg'} 
                alt={product.name}
                onError={(e) => {
                  e.target.src = '/placeholder-product.jpg';
                }}
              />
              <div className={`stock-badge ${product.stock === 0 ? 'out-of-stock' : 'in-stock'}`}>
                {product.stock} in stock
              </div>
            </div>
            
            <div className="product-info">
              <div className="product-header">
                <h3>{product.name}</h3>
                <span className="product-id">ID: {product.productId}</span>
              </div>
              <p className="description">{product.description}</p>
              
              <div className="product-meta">
                <span className="category">{product.category}</span>
                {product.brand && <span className="brand">{product.brand}</span>}
              </div>

              {product.specifications && (
                <div className="specifications">
                  {product.specifications.material && (
                    <span className="spec">Material: {product.specifications.material}</span>
                  )}
                  {product.specifications.size && (
                    <span className="spec">Size: {product.specifications.size}</span>
                  )}
                  {product.specifications.color && (
                    <span className="spec">Color: {product.specifications.color}</span>
                  )}
                </div>
              )}

              <div className="price">₹{product.price}</div>
              
              <div className="product-actions">
                <button 
                  onClick={() => handleEdit(product)}
                  className="edit-btn"
                  disabled={loading}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(product._id)}
                  className="delete-btn"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <h3>No Products Yet</h3>
          <p>Start by adding your first product to sell</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="add-first-product-btn"
          >
            Add Your First Product
          </button>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            
            {editingProduct && (
              <div className="product-id-display">
                <strong>Product ID: {editingProduct.productId}</strong>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className={formErrors.name ? 'error' : ''}
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  required
                  disabled={loading}
                  className={formErrors.description ? 'error' : ''}
                />
                {formErrors.description && <span className="error-text">{formErrors.description}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    disabled={loading}
                    className={formErrors.price ? 'error' : ''}
                  />
                  {formErrors.price && <span className="error-text">{formErrors.price}</span>}
                </div>

                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    required
                    disabled={loading}
                    className={formErrors.stock ? 'error' : ''}
                  />
                  {formErrors.stock && <span className="error-text">{formErrors.stock}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className={formErrors.category ? 'error' : ''}
                  >
                    <option value="">Select Category</option>
                    <option value="Food">Food</option>
                    <option value="Toys">Toys</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Bedding">Bedding</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Health">Health Care</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.category && <span className="error-text">{formErrors.category}</span>}
                </div>

                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Generic"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Material</label>
                  <input
                    type="text"
                    name="material"
                    value={formData.material}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="e.g., Cotton, Plastic"
                  />
                </div>

                <div className="form-group">
                  <label>Size</label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="e.g., Small, Medium, Large"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Weight</label>
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="e.g., 2kg, 500g"
                  />
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="e.g., Red, Blue, Multi-color"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Product Image {!editingProduct && '*'}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                  className={formErrors.image ? 'error' : ''}
                />
                <small>Upload product image (JPEG, PNG, WebP - max 5MB)</small>
                {formErrors.image && <span className="error-text">{formErrors.image}</span>}
                {editingProduct && editingProduct.image && (
                  <div className="current-image">
                    <small>Current Image:</small>
                    <img 
                      src={`http://localhost:5000${editingProduct.image}`} 
                      alt="Current" 
                      onError={(e) => {
                        e.target.src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;