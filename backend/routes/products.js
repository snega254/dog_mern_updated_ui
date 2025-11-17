const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, brand } = req.query;
    
    let query = { isActive: true };
    
    if (category && category !== 'all') query.category = category;
    if (brand && brand !== 'all') query.brand = brand;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortQuery = { createdAt: -1 };
    if (sort === 'price-low') sortQuery = { price: 1 };
    if (sort === 'price-high') sortQuery = { price: -1 };

    const products = await Product.find(query)
      .populate('sellerId', 'name email')
      .sort(sortQuery);

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get product categories and brands
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    const brands = await Product.distinct('brand', { isActive: true });
    res.json({ categories, brands });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get seller's products
router.get('/seller/my-products', async (req, res) => {
  try {
    const sellerId = req.user.userId;
    console.log('🔍 Fetching products for seller:', sellerId);
    
    const products = await Product.find({ sellerId, isActive: true }).sort({ createdAt: -1 });
    console.log(`✅ Found ${products.length} products for seller ${sellerId}`);
    
    res.json(products);
  } catch (error) {
    console.error('❌ Error fetching seller products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Create new product - SINGLE VERSION
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('🆕 === PRODUCT CREATION REQUEST START ===');
    console.log('📝 Request body:', req.body);
    console.log('📁 File received:', req.file ? `Yes - ${req.file.filename}` : 'No');
    console.log('👤 Full User object:', req.user);
    
    // Check authentication
    if (!req.user || !req.user.userId) {
      console.log('❌ No user authentication found');
      return res.status(401).json({ message: 'User authentication required' });
    }
    
    const sellerId = req.user.userId;
    console.log('🔑 Using sellerId:', sellerId);
    
    const { name, description, price, category, brand, stock, material, size, weight, color } = req.body;

    // Validation
    if (!name?.trim()) return res.status(400).json({ message: 'Product name is required' });
    if (!description?.trim()) return res.status(400).json({ message: 'Product description is required' });
    if (!price) return res.status(400).json({ message: 'Product price is required' });
    if (!category) return res.status(400).json({ message: 'Product category is required' });
    if (!stock) return res.status(400).json({ message: 'Product stock is required' });
    if (!req.file) return res.status(400).json({ message: 'Product image is required' });

    // Create product data
    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: category,
      brand: (brand && brand.trim() !== '') ? brand : 'Generic',
      stock: parseInt(stock),
      image: '/uploads/' + req.file.filename,
      sellerId: sellerId
    };

    // Add specifications
    const specifications = {};
    if (material?.trim()) specifications.material = material.trim();
    if (size?.trim()) specifications.size = size.trim();
    if (weight?.trim()) specifications.weight = weight.trim();
    if (color?.trim()) specifications.color = color.trim();
    
    if (Object.keys(specifications).length > 0) {
      productData.specifications = specifications;
    }

    // Generate productId
    const productCount = await Product.countDocuments();
    const productId = `PROD${(productCount + 1).toString().padStart(4, '0')}`;
    productData.productId = productId;
    
    console.log('📦 Final product data:', productData);

    const product = new Product(productData);
    await product.save();
    
    console.log('✅ Product created successfully:', product.productId);
    
    res.status(201).json({ 
      message: 'Product created successfully', 
      product: {
        _id: product._id,
        productId: product.productId,
        name: product.name,
        price: product.price,
        category: product.category,
        stock: product.stock,
        image: product.image
      }
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ message: 'Product validation failed', errors });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product with this ID already exists' });
    }
    
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// Update product
router.put('/:productId', upload.single('image'), async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.userId;
    
    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData = { ...req.body };
    if (req.file) updateData.image = '/uploads/' + req.file.filename;

    if (req.body.material || req.body.size || req.body.weight || req.body.color) {
      updateData.specifications = {
        material: req.body.material || '',
        size: req.body.size || '',
        weight: req.body.weight || '',
        color: req.body.color || ''
      };
    }

    const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });
    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// Delete product
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.userId;
    
    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await Product.findByIdAndUpdate(productId, { isActive: false });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

// Get product by ID
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ _id: productId, isActive: true }).populate('sellerId', 'name email');
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

module.exports = router;