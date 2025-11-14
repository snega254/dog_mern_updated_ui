const express = require('express');
const router = express.Router();
const DogPost = require('../models/DogPost');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure multer for post images
const storage = multer.diskStorage({
  destination: './uploads/posts/',
  filename: (req, file, cb) => {
    cb(null, `post-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Generate post ID
const generatePostId = async () => {
  const count = await DogPost.countDocuments();
  return `POST-${String(count + 1).padStart(5, '0')}`;
};

// Get all posts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    let sortOption = {};
    if (sort === 'popular') sortOption.likes = -1;
    else if (sort === 'oldest') sortOption.createdAt = 1;
    else sortOption.createdAt = -1; // newest
    
    const posts = await DogPost.find({ isActive: true })
      .populate('userId', 'name profileImage')
      .populate('comments.userId', 'name profileImage')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await DogPost.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Failed to fetch posts', error: err.message });
  }
});

// Create new post
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, dogBreed, dogAge, tags } = req.body;
    
    const postId = await generatePostId();
    const images = req.files ? req.files.map(file => `/uploads/posts/${file.filename}`) : [];

    const post = new DogPost({
      postId,
      userId: req.user.id,
      title,
      description,
      images,
      dogBreed,
      dogAge,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await post.save();

    // Populate user info for response
    await post.populate('userId', 'name profileImage');

    // Emit real-time update
    req.io.emit('newPostCreated', {
      postId: post.postId,
      title: post.title,
      userId: post.userId
    });

    res.json({
      success: true,
      message: 'Post created successfully',
      post
    });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Failed to create post', error: err.message });
  }
});

// Like/unlike post
router.post('/:id/like', async (req, res) => {
  try {
    const post = await DogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      // Unlike
      post.likes = post.likes.filter(like => like.toString() !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      liked: !hasLiked,
      likesCount: post.likes.length
    });
  } catch (err) {
    console.error('Error liking post:', err);
    res.status(500).json({ message: 'Failed to like post', error: err.message });
  }
});

// Add comment
router.post('/:id/comment', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await DogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      userId: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate comment user info
    await post.populate('comments.userId', 'name profileImage');

    const newComment = post.comments[post.comments.length - 1];

    // Emit real-time update
    req.io.emit('newCommentAdded', {
      postId: post._id,
      comment: newComment
    });

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
});

// Get user's posts
router.get('/my-posts', async (req, res) => {
  try {
    const posts = await DogPost.find({ userId: req.user.id })
      .populate('userId', 'name profileImage')
      .populate('comments.userId', 'name profileImage')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      posts
    });
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ message: 'Failed to fetch posts', error: err.message });
  }
});

// Delete post
router.delete('/:id', async (req, res) => {
  try {
    const post = await DogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    
    post.isActive = false;
    await post.save();
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Failed to delete post', error: err.message });
  }
});

module.exports = router;