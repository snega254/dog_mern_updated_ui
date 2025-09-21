const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// --- Validation Middlewares ---
// Registration validation
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

// Login validation
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  next();
};

// --- Helper Functions ---
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

  const token = jwt.sign({ id: user._id, userType: user.userType }, JWT_SECRET, { expiresIn: '1h' });
  return { token, userType: user.userType };
};

// --- Routes ---
// User Registration
router.post('/user/register', validateRegistration, async (req, res) => {
  try {
    const { name, email, password, contact } = req.body;
    const user = await registerUser({ name, email, password, contact, userType: 'user' });
    const token = jwt.sign({ id: user._id, userType: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, message: 'User registered successfully', token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// User Login
router.post('/user/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await loginUser({ email, password, userType: 'user' });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Seller Registration
router.post('/seller/register', validateRegistration, async (req, res) => {
  try {
    const { name, email, password, contact } = req.body;
    const user = await registerUser({ name, email, password, contact, userType: 'seller' });
    const token = jwt.sign({ id: user._id, userType: 'seller' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, message: 'Seller registered successfully', token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Seller Login
router.post('/seller/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await loginUser({ email, password, userType: 'seller' });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
