const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  contact: { 
    type: String, 
    required: true 
  },
  userType: { 
    type: String, 
    enum: ['user', 'seller'], 
    required: true 
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  profileImage: String,
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);