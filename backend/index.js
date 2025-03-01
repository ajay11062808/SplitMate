const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/splitwise-clone')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Group model
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Expense model
const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  splitAmong: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number }
  }],
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);
const Expense = mongoose.model('Expense', expenseSchema);

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).send({ error: 'Please authenticate.' });
  }
};
app.get('/api/auth/me', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });
    
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Group routes
app.post('/api/groups', auth, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    const group = new Group({
      name,
      description,
      members: [...members, req.user._id],
      createdBy: req.user._id
    });
    
    await group.save();
    
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email')
      .populate('createdBy', 'name email');
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is a member of the group
    if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Update group
app.put('/api/groups/:id', auth, async (req, res) => {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      if (group.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const updated = await Group.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
// Expense routes
app.post('/api/expenses', auth, async (req, res) => {
  try {
    const { description, amount, groupId, splitAmong } = req.body;
    
    // Verify group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Create expense
    const expense = new Expense({
      description,
      amount,
      paidBy: req.user._id,
      group: groupId,
      splitAmong
    });
    
    await expense.save();
    
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups/:groupId/expenses', auth, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // Verify group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get expenses for the group
    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email')
      .populate('splitAmong.user', 'name email')
      .sort({ date: -1 });
    
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate balances in a group
app.get('/api/groups/:groupId/balances', auth, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // Verify group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get all expenses for the group
    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email')
      .populate('splitAmong.user', 'name email');
    
    // Calculate balances
    const balances = {};
    
    // Initialize balances for all members
    group.members.forEach(member => {
      balances[member.toString()] = { paid: 0, owed: 0, net: 0 };
    });
    
    // Calculate based on expenses
    expenses.forEach(expense => {
      const paidById = expense.paidBy._id.toString();
      balances[paidById].paid += expense.amount;
      
      expense.splitAmong.forEach(split => {
        const userId = split.user._id.toString();
        balances[userId].owed += split.amount;
      });
    });
    
    // Calculate net amounts
    Object.keys(balances).forEach(userId => {
      balances[userId].net = balances[userId].paid - balances[userId].owed;
    });
    
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Delete expense
app.delete('/api/expenses/:id', auth, async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense) return res.status(404).json({ error: 'Expense not found' });
      if (expense.paidBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      await expense.remove();
      res.json({ message: 'Expense removed' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// User routes
app.get('/api/users', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'name email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simplified settlement suggestions
app.get('/api/groups/:groupId/settlements', auth, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // Verify group exists and user is a member
    const group = await Group.findById(groupId)
      .populate('members', 'name email');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get all expenses for the group
    const expenses = await Expense.find({ group: groupId });
    
    // Calculate balances
    const balances = {};
    
    // Initialize balances for all members
    group.members.forEach(member => {
      balances[member._id.toString()] = { 
        id: member._id,
        name: member.name,
        email: member.email,
        balance: 0 
      };
    });
    
    // Calculate based on expenses
    expenses.forEach(expense => {
      const paidById = expense.paidBy.toString();
      balances[paidById].balance += expense.amount;
      
      expense.splitAmong.forEach(split => {
        const userId = split.user.toString();
        balances[userId].balance -= split.amount;
      });
    });
    
    // Create settlement suggestions
    const settlements = [];
    const members = Object.values(balances);
    
    // Sort by balance
    const debtors = members.filter(m => m.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = members.filter(m => m.balance > 0).sort((a, b) => b.balance - a.balance);
    
    let i = 0, j = 0;
    
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const amount = Math.min(-debtor.balance, creditor.balance);
      
      if (amount > 0) {
        settlements.push({
          from: { id: debtor.id, name: debtor.name },
          to: { id: creditor.id, name: creditor.name },
          amount: parseFloat(amount.toFixed(2))
        });
      }
      
      debtor.balance += amount;
      creditor.balance -= amount;
      
      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j++;
    }
    
    res.json(settlements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));