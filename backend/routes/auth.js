const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Validation Middlewares
const validateRegistration = (req, res, next) => {
  const { name, email, password, contact } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || !email || !password || !contact) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  if (!/^\d{10}$/.test(contact)) {
    return res.status(400).json({ message: 'Contact must be a 10-digit number' });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  next();
};

// Helper Functions
const registerUser = async ({ name, email, password, contact, userType }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, contact, userType });
    await user.save();
    return user;
  } catch (err) {
    if (err.code === 11000) throw new Error('Email already exists');
    throw new Error('Invalid data or server error');
  }
};

const loginUser = async ({ email, password, userType }) => {
  const user = await User.findOne({ email, userType });
  if (!user) throw new Error('User not found');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Incorrect password');

  const token = jwt.sign({ id: user._id, userType: user.userType }, JWT_SECRET, { expiresIn: '24h' });
  return { token, userType: user.userType, user: { id: user._id, name: user.name, email: user.email } };
};

// Routes
router.post('/user/register', validateRegistration, async (req, res) => {
  try {
    const { name, email, password, contact } = req.body;
    const user = await registerUser({ name, email, password, contact, userType: 'user' });
    const token = jwt.sign({ id: user._id, userType: 'user' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ 
      success: true, 
      message: 'User registered successfully', 
      token,
      user: { id: user._id, name: user.name, email: user.email, userType: 'user' }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/user/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await loginUser({ email, password, userType: 'user' });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/seller/register', validateRegistration, async (req, res) => {
  try {
    const { name, email, password, contact } = req.body;
    const user = await registerUser({ name, email, password, contact, userType: 'seller' });
    const token = jwt.sign({ id: user._id, userType: 'seller' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ 
      success: true, 
      message: 'Seller registered successfully', 
      token,
      user: { id: user._id, name: user.name, email: user.email, userType: 'seller' }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/seller/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await loginUser({ email, password, userType: 'seller' });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;