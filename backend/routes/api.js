const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Dog = require('../models/Dog');
const Order = require('../models/Order');
const AccessoryOrder = require('../models/AccessoryOrder');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `dog-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Generate unique meaningful dog ID
const generateDogId = async (breed = 'Mixed') => {
  try {
    // Get breed code (first 3 letters of breed in uppercase)
    const breedCode = breed.split(' ')[0].substring(0, 3).toUpperCase();
    
    // Get current year and month
    const now = new Date();
    const year = now.getFullYear().toString().substring(2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Count dogs added this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const count = await Dog.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    const sequence = String(count + 1).padStart(3, '0');
    
    return `DOG-${breedCode}-${year}${month}-${sequence}`;
  } catch (error) {
    console.error('Error generating dog ID:', error);
    // Fallback ID
    return `DOG-${Date.now().toString().substring(8)}`;
  }
};

// Alternative ID generation based on dog characteristics
const generateCharacteristicId = async (breed, size, gender) => {
  try {
    const breedCode = breed.split(' ').map(word => word.substring(0, 2)).join('').toUpperCase();
    const sizeCode = size.substring(0, 1).toUpperCase();
    const genderCode = gender.substring(0, 1).toUpperCase();
    
    const count = await Dog.countDocuments({
      breed: new RegExp(breed, 'i'),
      size: size,
      gender: gender
    });
    
    const sequence = String(count + 1).padStart(3, '0');
    const timestamp = Date.now().toString().substring(9);
    
    return `${breedCode}-${sizeCode}${genderCode}-${sequence}${timestamp}`;
  } catch (error) {
    console.error('Error generating characteristic ID:', error);
    return `DOG-${uuidv4().substring(0, 8).toUpperCase()}`;
  }
};

// Get all dogs with sold status
router.get('/dogs', async (req, res) => {
  try {
    const { breed, age, gender, size, location } = req.query;
    
    let filter = { isAvailable: true };
    
    if (breed && breed !== 'all') filter.breed = new RegExp(breed, 'i');
    if (age && age !== 'all') filter.age = age;
    if (gender && gender !== 'all') filter.gender = gender;
    if (size && size !== 'all') filter.size = size;
    if (location && location !== 'all') filter['location.city'] = new RegExp(location, 'i');

    const dogs = await Dog.find(filter)
      .populate('sellerId', 'name email contact')
      .sort({ createdAt: -1 });
    
    const dogsWithStatus = await Promise.all(dogs.map(async (dog) => {
      const order = await Order.findOne({ dogId: dog._id, status: { $in: ['confirmed', 'completed'] } });
      return {
        ...dog.toObject(),
        image: dog.image ? `http://localhost:5000${dog.image}` : 'http://localhost:5000/uploads/placeholder-dog.jpg',
        isAdopted: !!order,
        seller: dog.sellerId
      };
    }));

    res.json(dogsWithStatus);
  } catch (err) {
    console.error('Error fetching dogs:', err);
    res.status(500).json({ message: 'Failed to fetch dogs', error: err.message });
  }
});

// Get dog by ID
router.get('/dogs/:id', async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id).populate('sellerId', 'name email contact');
    if (!dog) return res.status(404).json({ message: 'Dog not found' });

    const order = await Order.findOne({ dogId: dog._id, status: { $in: ['confirmed', 'completed'] } });
    
    res.json({
      ...dog.toObject(),
      image: dog.image ? `http://localhost:5000${dog.image}` : 'http://localhost:5000/uploads/placeholder-dog.jpg',
      isAdopted: !!order,
      seller: dog.sellerId
    });
  } catch (err) {
    console.error('Error fetching dog:', err);
    res.status(500).json({ message: 'Failed to fetch dog', error: err.message });
  }
});

// Add dog for sale (seller only)
router.post('/dogs/sell', upload.single('image'), async (req, res) => {
  try {
    const { breed, age, gender, dogType, healthStatus, vaccinated, size, color, behavior, description, price, city } = req.body;
    const sellerId = req.user.id;

    // Generate unique meaningful ID
    const dogId = await generateDogId(breed);
    
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    const dog = new Dog({
      dogId,
      breed,
      age,
      gender,
      dogType,
      healthStatus,
      vaccinated: vaccinated === 'true',
      size,
      color,
      behavior,
      description,
      price: price || 0,
      image: imagePath,
      sellerId,
      location: { 
        city: city || 'Unknown', 
        state: 'State' 
      },
      isAvailable: true
    });

    await dog.save();
    
    // Emit real-time update
    if (req.io) {
      req.io.emit('newDogAdded', { 
        dogId: dog.dogId, 
        breed: dog.breed,
        image: dog.image 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Dog listed successfully',
      dogId: dog.dogId,
      dog: dog
    });
  } catch (err) {
    console.error('Error adding dog:', err);
    res.status(500).json({ message: 'Failed to add dog', error: err.message });
  }
});

// Get adoption orders for seller
router.get('/orders', async (req, res) => {
  try {
    if (req.user.userType !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can access orders' });
    }

    const orders = await Order.find()
      .populate({
        path: 'dogId',
        match: { sellerId: req.user.id },
        populate: { path: 'sellerId', select: 'name contact' }
      })
      .populate('userId', 'name email contact')
      .sort({ createdAt: -1 });

    const filteredOrders = orders.filter(order => order.dogId !== null);
    res.json(filteredOrders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
});

// Create adoption order
router.post('/orders', async (req, res) => {
  try {
    const { dogId, message } = req.body;
    
    // Check if dog exists and is available
    const dog = await Dog.findById(dogId);
    if (!dog) {
      return res.status(404).json({ message: 'Dog not found' });
    }
    if (!dog.isAvailable) {
      return res.status(400).json({ message: 'This dog is not available for adoption' });
    }

    // Check if there's already a pending or confirmed order
    const existingOrder = await Order.findOne({ 
      dogId, 
      status: { $in: ['pending', 'confirmed'] } 
    });
    
    if (existingOrder) {
      return res.status(400).json({ message: 'This dog already has an adoption request' });
    }

    const order = new Order({ 
      dogId, 
      userId: req.user.id, 
      message,
      adoptionFee: dog.price || 0
    });

    await order.save();

    // Emit real-time notification to seller
    if (req.io) {
      req.io.emit('newAdoptionRequest', { 
        orderId: order._id, 
        dogId: dog.dogId, 
        breed: dog.breed,
        userId: req.user.id 
      });
    }

    res.json({ 
      success: true, 
      message: 'Adoption request sent successfully',
      orderId: order._id 
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Failed to create adoption request', error: err.message });
  }
});

// Update order status
router.put('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('dogId').populate('userId');
    
    if (!order || !order.dogId) {
      return res.status(404).json({ message: 'Order or dog not found' });
    }

    if (order.dogId.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update orders for your dogs' });
    }

    const previousStatus = order.status;
    order.status = status;

    // If order is confirmed or completed, mark dog as unavailable
    if (status === 'confirmed' || status === 'completed') {
      await Dog.findByIdAndUpdate(order.dogId._id, { isAvailable: false });
    } else if (status === 'cancelled' && previousStatus === 'confirmed') {
      await Dog.findByIdAndUpdate(order.dogId._id, { isAvailable: true });
    }

    await order.save();

    // Emit real-time update
    if (req.io) {
      req.io.emit('orderStatusUpdated', { 
        orderId: order._id, 
        status, 
        dogId: order.dogId._id,
        userId: order.userId._id
      });
    }

    res.json({ 
      success: true, 
      message: `Order ${status} successfully` 
    });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: 'Failed to update order', error: err.message });
  }
});

// Get user's adoption requests
router.get('/my-adoptions', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('dogId')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    console.error('Error fetching adoptions:', err);
    res.status(500).json({ message: 'Failed to fetch adoption requests', error: err.message });
  }
});

// Get user's accessory orders
router.get('/orders/my-orders', async (req, res) => {
  try {
    const orders = await AccessoryOrder.find({ userId: req.user.id })
      .populate('products.productId')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    console.error('Error fetching accessory orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
});

// Get seller's accessory orders
router.get('/orders/seller/orders', async (req, res) => {
  try {
    if (req.user.userType !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can access orders' });
    }

    const orders = await AccessoryOrder.find()
      .populate('products.productId')
      .populate('userId', 'name email contact')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Error fetching seller accessory orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
});

// Create accessory order
router.post('/orders/accessories', async (req, res) => {
  try {
    const { products, shippingAddress } = req.body;
    
    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'No products in the order' });
    }

    // Calculate total amount
    let totalAmount = 0;
    const detailedProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }
      
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      detailedProducts.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price
      });
    }

    const order = new AccessoryOrder({
      orderId: 'ORD-' + Date.now(),
      userId: req.user.id,
      products: detailedProducts,
      totalAmount,
      shippingAddress
    });

    await order.save();
    
    // Emit real-time notification
    if (req.io) {
      req.io.emit('newAccessoryOrder', {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        userId: req.user.id
      });
    }

    res.status(201).json({ 
      success: true,
      message: 'Order placed successfully', 
      order 
    });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user's accessory orders (alternative endpoint)
router.get('/accessories/orders', async (req, res) => {
  try {
    const orders = await AccessoryOrder.find({ userId: req.user.id })
      .populate('products.productId')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      orders
    });
  } catch (err) {
    console.error('Error fetching accessory orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
});

module.exports = router;