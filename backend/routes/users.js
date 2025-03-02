import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users by name or email
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('-password');
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/users/friends/:id
// @desc    Add a friend
// @access  Private
router.post('/friends/:id', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add yourself as a friend'
      });
    }
    
    const friend = await User.findById(req.params.id);
    
    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Check if already friends
    if (user.friends.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user'
      });
    }
    
    // Add friend to both users
    user.friends.push(req.params.id);
    friend.friends.push(req.user._id);
    
    await user.save();
    await friend.save();
    
    res.status(200).json({
      success: true,
      message: 'Friend added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/users/friends/:id
// @desc    Remove a friend
// @access  Private
router.delete('/friends/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friend = await User.findById(req.params.id);
    
    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Remove friend from both users
    user.friends = user.friends.filter(
      friendId => friendId.toString() !== req.params.id
    );
    
    friend.friends = friend.friends.filter(
      friendId => friendId.toString() !== req.user._id.toString()
    );
    
    await user.save();
    await friend.save();
    
    res.status(200).json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/users/friends
// @desc    Get all friends
// @access  Private
router.get('/friends', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', '-password');
    
    res.status(200).json({
      success: true,
      friends: user.friends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;