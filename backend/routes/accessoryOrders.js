const express = require('express');
const router = express.Router();
const AccessoryOrder = require('../models/AccessoryOrder');
const Product = require('../models/Product');

// Create new accessory order
router.post('/', async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod } = req.body;
    const userId = req.user.id;

    console.log('🛒 Received order request:', { products, userId });

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'No products in order' });
    }

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Missing shipping address or payment method' });
    }

    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      // Validate each product item
      if (!item.productId || !item.quantity) {
        return res.status(400).json({ message: 'Invalid product data' });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      // Check if product has sellerId
      if (!product.sellerId) {
        console.error('❌ Product missing sellerId:', product);
        return res.status(400).json({ message: `Product ${product.name} has no seller assigned` });
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

    // Validate total amount
    if (totalAmount <= 0) {
      return res.status(400).json({ message: 'Invalid order total' });
    }

    console.log('📋 Processed order products:', orderProducts);

       // FIX: Manually generate order ID since pre-save hook isn't working
    const orderCount = await AccessoryOrder.countDocuments();
    const orderId = `ACC${(orderCount + 1).toString().padStart(4, '0')}`;
    console.log('🆕 Generated Order ID:', orderId);

   // Create order with manual orderId
    const order = new AccessoryOrder({
      orderId: orderId, // Add this line
      userId: userId,
      products: orderProducts,
      totalAmount,
      shippingAddress,
      paymentMethod
});
    console.log('💾 Saving order to database...');
    await order.save();
    console.log('✅ Order created successfully:', order.orderId);

    // Update product stock
    for (const item of products) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Notify sellers
    const sellerIds = [...new Set(orderProducts.map(item => item.sellerId.toString()))];
    console.log('👨‍💼 Notifying sellers:', sellerIds);
    
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
    console.error('💥 DETAILED Order Error:', error);
    console.error('💥 Stack Trace:', error.stack);
    console.error('💥 Request Body:', req.body);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Get user's accessory orders
router.get('/user/orders', async (req, res) => {
  try {
    const userId = req.user.id;
    
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
    const sellerId = req.user.id;
    
    console.log('🏪 Fetching orders for seller:', sellerId);

    const orders = await AccessoryOrder.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Filter orders to only include products from this seller
    const sellerOrders = orders.map(order => {
      const sellerProducts = order.products.filter(item => {
        return item.sellerId && item.sellerId.toString() === sellerId;
      });

      if (sellerProducts.length === 0) return null;

      return {
        _id: order._id,
        orderId: order.orderId,
        userId: order.userId,
        products: sellerProducts,
        totalAmount: sellerProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    }).filter(order => order !== null);

    console.log(`📦 Found ${sellerOrders.length} orders for seller ${sellerId}`);

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
    const sellerId = req.user.id;

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
    const userId = req.user.id;

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