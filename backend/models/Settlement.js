import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  expenses: [{
    expense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Settlement = mongoose.model('Settlement', settlementSchema);

export default Settlement;