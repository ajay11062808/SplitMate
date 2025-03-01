import React, { useState, useContext } from 'react';
import AuthContext from '../../context/AuthContext';

const AddExpenseForm = ({ groupMembers, onAddExpense, onCancel }) => {
  const { user } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    splitType: 'equal',
    customSplits: {}
  });
  
  const [error, setError] = useState('');
  
  const { description, amount, splitType } = formData;
  
  // Initialize custom splits if not already done
  useState(() => {
    const splits = {};
    groupMembers.forEach(member => {
      splits[member._id] = '';
    });
    setFormData(prev => ({
      ...prev,
      customSplits: splits
    }));
  }, []);
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };
  
  const handleCustomSplitChange = (memberId, value) => {
    setFormData({
      ...formData,
      customSplits: {
        ...formData.customSplits,
        [memberId]: value
      }
    });
  };
  
  const calculateSplits = () => {
    const totalAmount = parseFloat(amount);
    const splitAmong = [];
    
    if (splitType === 'equal') {
      // Equal split among all members
      const perPersonAmount = totalAmount / groupMembers.length;
      
      groupMembers.forEach(member => {
        splitAmong.push({
          user: member._id,
          amount: perPersonAmount
        });
      });
    } else if (splitType === 'custom') {
      // Validate custom splits add up to the total
      let totalSplit = 0;
      const customSplitAmounts = {};
      
      for (const [memberId, value] of Object.entries(formData.customSplits)) {
        if (!value) {
          setError('All members must have a split amount');
          return null;
        }
        
        const splitAmount = parseFloat(value);
        if (isNaN(splitAmount) || splitAmount < 0) {
          setError('All split amounts must be valid numbers');
          return null;
        }
        
        customSplitAmounts[memberId] = splitAmount;
        totalSplit += splitAmount;
      }
      
      // Check if splits add up to total (allowing for small floating point errors)
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        setError(`Split amounts must add up to the total: ${totalAmount}`);
        return null;
      }
      
      // Create split objects
      for (const [memberId, splitAmount] of Object.entries(customSplitAmounts)) {
        splitAmong.push({
          user: memberId,
          amount: splitAmount
        });
      }
    }
    
    return splitAmong;
  };
  
  const onSubmit = e => {
    e.preventDefault();
    
    if (!description) {
      setError('Description is required');
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    const splitAmong = calculateSplits();
    if (!splitAmong) return; // Error was set in calculateSplits
    
    onAddExpense({
      description,
      amount: parseFloat(amount),
      splitAmong
    });
  };
  
  return (
    <form onSubmit={onSubmit}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2" htmlFor="description">
          Description*
        </label>
        <input
          type="text"
          id="description"
          name="description"
          value={description}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="e.g., Dinner, Groceries, Rent"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2" htmlFor="amount">
          Amount*
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={amount}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="0.00"
          step="0.01"
          min="0.01"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          How to split?
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="splitType"
              value="equal"
              checked={splitType === 'equal'}
              onChange={onChange}
              className="mr-2"
            />
            Split equally
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="splitType"
              value="custom"
              checked={splitType === 'custom'}
              onChange={onChange}
              className="mr-2"
            />
            Custom amounts
          </label>
        </div>
      </div>
      
      {splitType === 'custom' && (
        <div className="mb-4 border rounded p-4 bg-gray-50">
          <p className="text-sm text-gray-700 mb-3">
            Enter how much each person owes (total should equal {parseFloat(amount || 0).toFixed(2)})
          </p>
          
          {groupMembers.map(member => (
            <div key={member._id} className="flex items-center mb-2">
              <span className="w-1/3">{member.name}</span>
              <input
                type="number"
                value={formData.customSplits[member._id]}
                onChange={e => handleCustomSplitChange(member._id, e.target.value)}
                className="w-2/3 px-3 py-1 border border-gray-300 rounded"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Add Expense
        </button>
      </div>
    </form>
  );
};

export default AddExpenseForm;