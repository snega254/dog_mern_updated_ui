const express = require('express');
const router = express.Router();

// ✅ CORRECT: Just import the model, don't define it here
const Order = require('../models/Order');
const Dog = require('../models/Dog');
const User = require('../models/User');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('dogId', 'breed age price')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { dogId, userId, adoptionFee, message, meetingDate } = req.body;
    
    const order = new Order({
      dogId,
      userId,
      adoptionFee,
      message,
      meetingDate
    });
    
    await order.save();
    
    // Populate the saved order
    await order.populate('userId', 'name email');
    await order.populate('dogId', 'breed age price image');
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Update order status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'name email').populate('dogId', 'breed age price');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
});

// Get orders by user
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .populate('dogId', 'breed age price image sellerId')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user orders',
      error: error.message
    });
  }
});

module.exports = router;