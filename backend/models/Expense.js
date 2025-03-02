import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['Food', 'Transportation', 'Housing', 'Entertainment', 'Utilities', 'Other'],
    default: 'Other'
  },
  splits: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    settled: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  receipt: {
    type: String // URL to receipt image
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;