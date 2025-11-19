const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  dogId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Dog' 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending' 
  },
  adoptionFee: Number,
  message: String,
  meetingDate: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// SAFE EXPORT - Prevents OverwriteModelError
module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);