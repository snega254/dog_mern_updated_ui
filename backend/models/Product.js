const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true
    // Remove required since we're generating it manually
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

// Keep the pre-save hook as backup
productSchema.pre('save', async function(next) {
  try {
    // Only generate productId if it doesn't exist
    if (!this.productId) {
      const count = await mongoose.model('Product').countDocuments();
      this.productId = `PROD${(count + 1).toString().padStart(4, '0')}`;
      console.log(`✅ Auto-generated productId: ${this.productId}`);
    }
    next();
  } catch (error) {
    console.error('❌ Error generating productId:', error);
    next(error);
  }
});

module.exports = mongoose.model('Product', productSchema);