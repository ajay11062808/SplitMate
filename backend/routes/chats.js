import express from 'express';
import Chat from '../models/Chat.js';
import Group from '../models/Group.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/chats/group/:groupId
// @desc    Get chat for a group
// @access  Private
router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user is a member of the group
    const isMember = group.members.some(
      member => member.user.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat'
      });
    }
    
    // Find or create chat for the group
    let chat = await Chat.findOne({ group: req.params.groupId })
      .populate('messages.sender', 'name email avatar');
    
    if (!chat) {
      chat = await Chat.create({
        group: req.params.groupId,
        participants: group.members.map(member => member.user)
      });
    }
    
    res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/chats/direct/:userId
// @desc    Get direct chat with a user
// @access  Private
router.get('/direct/:userId', protect, async (req, res) => {
  try {
    // Find or create direct chat
    let chat = await Chat.findOne({
      group: { $exists: false },
      participants: {
        $all: [req.user._id, req.params.userId],
        $size: 2
      }
    }).populate('messages.sender', 'name email avatar');
    
    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, req.params.userId],
        messages: []
      });
    }
    
    await chat.populate('participants', 'name email avatar');
    
    res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/chats
// @desc    Get all chats for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
      .populate('participants', 'name email avatar')
      .populate('group', 'name')
      .populate('messages.sender', 'name email avatar');
    
    res.status(200).json({
      success: true,
      chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;