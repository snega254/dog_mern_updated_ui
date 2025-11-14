const express = require('express');
const router = express.Router();
const AccessoryOrder = require('../models/AccessoryOrder');
const Product = require('../models/Product');
const auth = require('../routes/auth');


// 🟢 Create a new accessory order (without payment)
router.post('/accessories', auth, async (req, res) => {
  try {
    const { products, shippingAddress } = req.body;
    if (!products || products.length === 0)
      return res.status(400).json({ message: 'No products in the order' });

    // Calculate total amount
    let totalAmount = 0;
    const detailedProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      
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
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🟡 Get all orders for a logged-in user
router.get('/accessories', auth, async (req, res) => {
  try {
    const orders = await AccessoryOrder.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Fetch orders failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
