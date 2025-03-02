import express from 'express';
import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { 
      description, 
      amount, 
      group: groupId, 
      category, 
      splits, 
      notes, 
      receipt,
      date 
    } = req.body;
    
    // Check if group exists
    const group = await Group.findById(groupId);
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
        message: 'Not authorized to add expenses to this group'
      });
    }
    
    // Create new expense
    const expense = await Expense.create({
      description,
      amount,
      paidBy: req.user._id,
      group: groupId,
      category,
      splits,
      notes,
      receipt,
      date: date || new Date()
    });
    
    // Add expense to group
    group.expenses.push(expense._id);
    await group.save();
    
    await expense.populate('paidBy', 'name email avatar');
    await expense.populate('splits.user', 'name email avatar');
    
    res.status(201).json({
      success: true,
      expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/expenses
// @desc    Get all expenses for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user._id },
        { 'splits.user': req.user._id }
      ]
    })
      .populate('paidBy', 'name email avatar')
      .populate('group', 'name')
      .populate('splits.user', 'name email avatar')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/expenses/group/:groupId
// @desc    Get all expenses for a group
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
        message: 'Not authorized to view expenses for this group'
      });
    }
    
    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('paidBy', 'name email avatar')
      .populate('splits.user', 'name email avatar')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get an expense by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email avatar')
      .populate('group', 'name')
      .populate('splits.user', 'name email avatar');
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Check if user is a member of the group
    const group = await Group.findById(expense.group);
    
    const isMember = group.members.some(
      member => member.user.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this expense'
      });
    }
    
    res.status(200).json({
      success: true,
      expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { 
      description, 
      amount, 
      category, 
      splits, 
      notes, 
      receipt,
      date 
    } = req.body;
    
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Check if user is the one who paid for the expense
    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense'
      });
    }
    
    // Update expense
    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (category) expense.category = category;
    if (splits) expense.splits = splits;
    if (notes) expense.notes = notes;
    if (receipt) expense.receipt = receipt;
    if (date) expense.date = date;
    
    await expense.save();
    
    await expense.populate('paidBy', 'name email avatar');
    await expense.populate('splits.user', 'name email avatar');
    
    res.status(200).json({
      success: true,
      expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Check if user is the one who paid for the expense
    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense'
      });
    }
    
    // Remove expense from group
    await Group.findByIdAndUpdate(expense.group, {
      $pull: { expenses: expense._id }
    });
    
    await expense.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;