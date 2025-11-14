const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for product images
const storage = multer.diskStorage({
  destination: './uploads/products/',
  filename: (req, file, cb) => {
    cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Generate meaningful product ID
const generateProductId = async (category) => {
  const categoryPrefix = category.substring(0, 3).toUpperCase();
  const count = await Product.countDocuments({ category });
  return `PROD-${categoryPrefix}-${String(count + 1).padStart(3, '0')}`;
};

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, brand } = req.query;
    
    let filter = { isActive: true };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    if (brand && brand !== 'all') {
      filter.brand = new RegExp(brand, 'i');
    }
    
    let sortOption = {};
    if (sort === 'price-low') sortOption.price = 1;
    else if (sort === 'price-high') sortOption.price = -1;
    else if (sort === 'newest') sortOption.createdAt = -1;
    else if (sort === 'popular') sortOption.soldCount = -1;
    else sortOption.createdAt = -1;
    
    const products = await Product.find(filter)
      .populate('sellerId', 'name email contact')
      .sort(sortOption);
    
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'name email contact');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Failed to fetch product', error: err.message });
  }
});

// Add new product (seller only)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (req.user.userType !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can add products' });
    }
    
    const { name, description, price, category, stock, brand, material, size, weight, color } = req.body;
    
    const productId = await generateProductId(category);
    
    const product = new Product({
      productId,
      name,
      description,
      price: parseFloat(price),
      category,
      brand: brand || 'Generic',
      stock: parseInt(stock),
      image: req.file ? `/uploads/products/${req.file.filename}` : '',
      sellerId: req.user.id,
      specifications: {
        material: material || '',
        size: size || '',
        weight: weight || '',
        color: color || ''
      }
    });
    
    await product.save();

    // Emit real-time update
    req.io.emit('newProductAdded', { productId: product.productId, name: product.name });
    
    res.json({ 
      success: true, 
      message: 'Product added successfully',
      productId: product.productId 
    });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ message: 'Failed to add product', error: err.message });
  }
});

// Update product (seller only)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own products' });
    }
    
    const updates = { ...req.body };
    if (req.file) {
      updates.image = `/uploads/products/${req.file.filename}`;
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    
    res.json({ success: true, product: updatedProduct });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
});

// Get seller's products
router.get('/seller/my-products', async (req, res) => {
  try {
    if (req.user.userType !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can access this' });
    }
    
    const products = await Product.find({ sellerId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(products);
  } catch (err) {
    console.error('Error fetching seller products:', err);
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
});

// Get product categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const brands = await Product.distinct('brand');
    
    res.json({ categories, brands });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
});

module.exports = router;