const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');

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

// Public routes - no authentication required
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

// Public route - get categories and brands
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

// Public route - get product by ID
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ _id: productId, isActive: true })
      .populate('sellerId', 'name email');
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// Protected routes - require authentication
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Malformed token' });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Get seller's products - PROTECTED
router.get('/seller/my-products', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const products = await Product.find({ sellerId, isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Create new product - PROTECTED
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User authentication required' });
    }
    
    const sellerId = req.user.id;
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

    const product = new Product(productData);
    await product.save();
    
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
    console.error('Error creating product:', error);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ message: 'Product validation failed', errors });
    }
    
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// Update product - PROTECTED
router.put('/:productId', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.id;
    
    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData = { ...req.body };
    if (req.file) updateData.image = '/uploads/' + req.file.filename;

    if (req.body.material || req.body.size || req.body.weight || req.body.color) {
      updateData.specifications = {
        material: req.body.material || product.specifications?.material || '',
        size: req.body.size || product.specifications?.size || '',
        weight: req.body.weight || product.specifications?.weight || '',
        color: req.body.color || product.specifications?.color || ''
      };
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// Delete product - PROTECTED
router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.id;
    
    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await Product.findByIdAndUpdate(productId, { isActive: false });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

module.exports = router;router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    console.log('🔐 Authentication check - User:', req.user);
    console.log('📦 Request body:', req.body);
    console.log('🖼️ File:', req.file);
    
    if (!req.user || !req.user.id) {
      console.log('❌ No user found in request');
      return res.status(401).json({ message: 'User authentication required' });
    }
    
    // Rest of your code...
  } catch (error) {
    console.error('💥 Error in POST /api/products:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});