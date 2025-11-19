const mongoose = require('mongoose');

const dogSchema = new mongoose.Schema({
  dogId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  breed: { 
    type: String, 
    required: true 
  },
  age: { 
    type: String, 
    required: true 
  },
  gender: { 
    type: String, 
    required: true 
  },
  dogType: { 
    type: String, 
    required: true 
  },
  healthStatus: { 
    type: String, 
    required: true 
  },
  vaccinated: { 
    type: String, 
    required: true 
  },
  size: { 
    type: String, 
    required: true 
  },
  color: { 
    type: String, 
    required: true 
  },
  behavior: { 
    type: String, 
    required: true 
  },
  description: String,
  price: { 
    type: Number, 
    default: 0 
  },
  image: { 
    type: String 
  },
  sellerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  location: {
    city: String,
    state: String
  },
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Safe export to prevent OverwriteModelError
module.exports = mongoose.models.Dog || mongoose.model('Dog', dogSchema);