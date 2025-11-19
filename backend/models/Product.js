const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Toys', 'Accessories', 'Bedding', 'Grooming', 'Health', 'Clothing', 'Other']
  },
  brand: {
    type: String,
    default: 'Generic'
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  image: {
    type: String,
    required: true
  },
  specifications: {
    material: String,
    size: String,
    weight: String,
    color: String
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate product ID before saving
productSchema.pre('save', async function(next) {
  if (this.isNew && !this.productId) {
    try {
      const count = await mongoose.model('Product').countDocuments();
      this.productId = `PROD${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      // Fallback if count fails
      this.productId = `PROD${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Safe export to prevent OverwriteModelError
module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);