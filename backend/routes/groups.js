import express from 'express';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    // Create new group
    const group = await Group.create({
      name,
      description,
      members: [
        { user: req.user._id, isAdmin: true },
        ...members.map(memberId => ({ user: memberId }))
      ],
      createdBy: req.user._id
    });
    
    await group.populate('members.user', 'name email avatar');
    
    res.status(201).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/groups
// @desc    Get all groups for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id
    })
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/groups/:id
// @desc    Get a group by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate({
        path: 'expenses',
        populate: {
          path: 'paidBy',
          select: 'name email avatar'
        }
      });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user is a member of the group
    const isMember = group.members.some(
      member => member.user._id.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this group'
      });
    }
    
    res.status(200).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/groups/:id
// @desc    Update a group
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user is an admin of the group
    const isAdmin = group.members.some(
      member => 
        member.user.toString() === req.user._id.toString() && 
        member.isAdmin
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this group'
      });
    }
    
    if (name) group.name = name;
    if (description) group.description = description;
    
    await group.save();
    await group.populate('members.user', 'name email avatar');
    await group.populate('createdBy', 'name email avatar');
    
    res.status(200).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user is an admin of the group
    const isAdmin = group.members.some(
      member => 
        member.user.toString() === req.user._id.toString() && 
        member.isAdmin
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this group'
      });
    }
    
    await group.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/groups/:id/members
// @desc    Add members to a group
// @access  Private
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { members } = req.body;
    
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user is an admin of the group
    const isAdmin = group.members.some(
      member => 
        member.user.toString() === req.user._id.toString() && 
        member.isAdmin
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add members to this group'
      });
    }
    
    // Add new members
    for (const memberId of members) {
      // Check if user exists
      const user = await User.findById(memberId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${memberId} not found`
        });
      }
      
      // Check if user is already a member
      const isMember = group.members.some(
        member => member.user.toString() === memberId
      );
      
      if (!isMember) {
        group.members.push({ user: memberId });
      }
    }
    
    await group.save();
    await group.populate('members.user', 'name email avatar');
    
    res.status(200).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/groups/:id/members/:userId
// @desc    Remove a member from a group
// @access  Private
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user is an admin of the group or removing themselves
    const isAdmin = group.members.some(
      member => 
        member.user.toString() === req.user._id.toString() && 
        member.isAdmin
    );
    
    const isSelf = req.user._id.toString() === req.params.userId;
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove members from this group'
      });
    }
    
    // Cannot remove the creator of the group
    if (group.createdBy.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the creator of the group'
      });
    }
    
    // Remove member
    group.members = group.members.filter(
      member => member.user.toString() !== req.params.userId
    );
    
    await group.save();
    await group.populate('members.user', 'name email avatar');
    
    res.status(200).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;