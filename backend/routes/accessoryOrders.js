const express = require('express');
const router = express.Router();
const AccessoryOrder = require('../models/AccessoryOrder');
const Product = require('../models/Product');

// Create new accessory order
router.post('/', async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod } = req.body;
    const userId = req.user.userId;

    // Validate products and calculate total
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      totalAmount += product.price * item.quantity;

      orderProducts.push({
        productId: product._id,
        productDbId: product.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        sellerId: product.sellerId
      });
    }

    // Create order
    const order = new AccessoryOrder({
      userId,
      products: orderProducts,
      totalAmount,
      shippingAddress,
      paymentMethod
    });

    await order.save();

    // Update product stock
    for (const item of products) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Notify sellers via socket.io
    const sellerIds = [...new Set(orderProducts.map(item => item.sellerId.toString()))];
    sellerIds.forEach(sellerId => {
      req.io.to(`seller-${sellerId}`).emit('new-order', {
        message: 'You have a new accessory order!',
        orderId: order.orderId
      });
    });

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Get user's accessory orders
router.get('/user/orders', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const orders = await AccessoryOrder.find({ userId })
      .populate('products.productId', 'name image')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get seller's accessory orders
router.get('/seller/orders', async (req, res) => {
  try {
    const sellerId = req.user.userId;
    
    const orders = await AccessoryOrder.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Filter orders to only include products from this seller
    const sellerOrders = orders.map(order => {
      const sellerProducts = order.products.filter(item => 
        item.sellerId && item.sellerId.toString() === sellerId
      );

      if (sellerProducts.length === 0) return null;

      return {
        ...order.toObject(),
        products: sellerProducts
      };
    }).filter(order => order !== null);

    res.json(sellerOrders);
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const sellerId = req.user.userId;

    const order = await AccessoryOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify seller owns at least one product in this order
    const sellerProducts = order.products.filter(item => 
      item.sellerId && item.sellerId.toString() === sellerId
    );

    if (sellerProducts.length === 0) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    await order.save();

    // Notify user via socket.io
    req.io.to(`user-${order.userId}`).emit('order-updated', {
      orderId: order.orderId,
      status: order.status,
      message: `Your order status has been updated to ${status}`
    });

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

// Get order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await AccessoryOrder.findOne({ _id: orderId, userId })
      .populate('products.productId', 'name image category')
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

module.exports = router;