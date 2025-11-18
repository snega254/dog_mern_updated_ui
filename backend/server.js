require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const accessoryOrderRoutes = require('./routes/accessoryOrders');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dogworld', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Authentication middleware - FIXED VERSION
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
    
    // Enhanced user object with fallbacks for missing fields
    req.user = {
      id: decoded.id,
      userType: decoded.userType || 'user', // Default to 'user' if missing
      email: decoded.email,
      name: decoded.name
    };
    
    console.log('Authenticated user:', req.user);
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined room user-${userId}`);
  });

  socket.on('join-seller', (sellerId) => {
    socket.join(`seller-${sellerId}`);
    console.log(`🏪 Seller ${sellerId} joined room seller-${sellerId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes with authentication
app.use('/api', authenticate, apiRoutes); // Add authenticate middleware here
app.use('/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/accessory-orders', authenticate, accessoryOrderRoutes);

// Public routes (no authentication required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test dogs endpoint directly (public)
app.get('/api/test-dogs', async (req, res) => {
  try {
    const Dog = require('./models/Dog');
    const dogs = await Dog.find().limit(5);
    res.json({ 
      message: 'Dogs endpoint is working!', 
      count: dogs.length,
      dogs: dogs 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public dogs endpoint (without authentication)
app.get('/api/public/dogs', async (req, res) => {
  try {
    const Dog = require('./models/Dog');
    const dogs = await Dog.find({ isAvailable: true })
      .populate('sellerId', 'name email contact')
      .limit(20)
      .sort({ createdAt: -1 });
    
    const dogsWithImages = dogs.map(dog => ({
      ...dog.toObject(),
      image: dog.image ? `http://localhost:5000${dog.image}` : 'http://localhost:5000/uploads/placeholder-dog.jpg'
    }));

    res.json(dogsWithImages);
  } catch (err) {
    console.error('Error fetching public dogs:', err);
    res.status(500).json({ message: 'Failed to fetch dogs', error: err.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'production' ? {} : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.url}` });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💻 Web app URL: http://localhost:3000`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🕒 Started at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
});