import express from 'express';
import Settlement from '../models/Settlement.js';
import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/settlements
// @desc    Create a new settlement
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { 
      receiver, 
      amount, 
      group, 
      expenses, 
      notes 
    } = req.body;
    
    // Create new settlement
    const settlement = await Settlement.create({
      payer: req.user._id,
      receiver,
      amount,
      group,
      expenses,
      notes,
      status: 'pending'
    });
    
    await settlement.populate('payer', 'name email avatar');
    await settlement.populate('receiver', 'name email avatar');
    if (group) await settlement.populate('group', 'name');
    
    res.status(201).json({
      success: true,
      settlement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/settlements
// @desc    Get all settlements for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const settlements = await Settlement.find({
      $or: [
        { payer: req.user._id },
        { receiver: req.user._id }
      ]
    })
      .populate('payer', 'name email avatar')
      .populate('receiver', 'name email avatar')
      .populate('group', 'name')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      settlements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/settlements/:id
// @desc    Get a settlement by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id)
      .populate('payer', 'name email avatar')
      .populate('receiver', 'name email avatar')
      .populate('group', 'name')
      .populate({
        path: 'expenses.expense',
        populate: {
          path: 'paidBy',
          select: 'name email avatar'
        }
      });
    
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }
    
    // Check if user is involved in the settlement
    if (
      settlement.payer._id.toString() !== req.user._id.toString() &&
      settlement.receiver._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this settlement'
      });
    }
    
    res.status(200).json({
      success: true,
      settlement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/settlements/:id
// @desc    Update a settlement status
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    const settlement = await Settlement.findById(req.params.id);
    
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }
    
    // Only the receiver can update the status
    if (settlement.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this settlement'
      });
    }
    
    settlement.status = status;
    
    // If status is completed, update the expense splits
    if (status === 'completed') {
      for (const expenseItem of settlement.expenses) {
        const expense = await Expense.findById(expenseItem.expense);
        
        if (expense) {
          // Find the split for the payer and mark it as settled
          const payerSplit = expense.splits.find(
            split => split.user.toString() === settlement.payer.toString()
          );
          
          if (payerSplit) {
            payerSplit.settled = true;
            await expense.save();
          }
        }
      }
    }
    
    await settlement.save();
    
    await settlement.populate('payer', 'name email avatar');
    await settlement.populate('receiver', 'name email avatar');
    if (settlement.group) await settlement.populate('group', 'name');
    
    res.status(200).json({
      success: true,
      settlement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/settlements/:id
// @desc    Delete a settlement
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);
    
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }
    
    // Only the payer can delete a pending settlement
    if (
      settlement.payer.toString() !== req.user._id.toString() ||
      settlement.status !== 'pending'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this settlement'
      });
    }
    
    await settlement.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Settlement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;