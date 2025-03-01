import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ExpenseList from '../expenses/ExpenseList';
import AddExpenseForm from '../expenses/AddExpenseForm';
import SettlementList from '../SettlementList';

const GroupDetails = () => {
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [balances, setBalances] = useState({});
  const [activeTab, setActiveTab] = useState('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { id } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [groupRes, expensesRes, settlementsRes, balancesRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/groups/${id}`),
          axios.get(`http://localhost:5000/api/groups/${id}/expenses`),
          axios.get(`http://localhost:5000/api/groups/${id}/settlements`),
          axios.get(`http://localhost:5000/api/groups/${id}/balances`)
        ]);
        
        setGroup(groupRes.data);
        setExpenses(expensesRes.data);
        setSettlements(settlementsRes.data);
        setBalances(balancesRes.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching group data');
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [id]);
  
  const refreshData = async () => {
    try {
      const [expensesRes, settlementsRes, balancesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/groups/${id}/expenses`),
        axios.get(`http://localhost:5000/api/groups/${id}/settlements`),
        axios.get(`http://localhost:5000/api/groups/${id}/balances`)
      ]);
      
      setExpenses(expensesRes.data);
      setSettlements(settlementsRes.data);
      setBalances(balancesRes.data);
    } catch (err) {
      setError('Error refreshing data');
    }
  };
  
  const addExpense = async (expenseData) => {
    try {
      await axios.post('http://localhost:5000/api/expenses', {
        ...expenseData,
        groupId: id
      });
      
      setShowAddExpense(false);
      refreshData();
    } catch (err) {
      setError('Error adding expense');
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }
  
  if (!group) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-red-600">Group not found</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <button
            onClick={() => setShowAddExpense(!showAddExpense)}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
          >
            {showAddExpense ? 'Cancel' : 'Add Expense'}
          </button>
        </div>
        
        {group.description && (
          <p className="text-gray-700 mb-4">{group.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-4">
          <p className="text-sm text-gray-600">Members:</p>
          {group.members.map(member => (
            <span key={member._id} className="bg-gray-100 px-3 py-1 rounded text-sm">
              {member.name}
            </span>
          ))}
        </div>
      </div>
      
      {showAddExpense && (
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
          <AddExpenseForm 
            groupMembers={group.members} 
            onAddExpense={addExpense} 
            onCancel={() => setShowAddExpense(false)}
          />
        </div>
      )}
      
      <div className="bg-white rounded shadow">
        <div className="border-b">
          <div className="flex">
            <button
              className={`px-4 py-3 ${activeTab === 'expenses' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
              onClick={() => setActiveTab('expenses')}
            >
              Expenses
            </button>
            <button
              className={`px-4 py-3 ${activeTab === 'balances' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
              onClick={() => setActiveTab('balances')}
            >
              Balances
            </button>
            <button
              className={`px-4 py-3 ${activeTab === 'settlements' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
              onClick={() => setActiveTab('settlements')}
            >
              Settle Up
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'expenses' && (
            <ExpenseList expenses={expenses} />
          )}
          
          {activeTab === 'balances' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Current Balances</h3>
              {Object.keys(balances).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">Member</th>
                        <th className="px-4 py-2 text-right">Paid</th>
                        <th className="px-4 py-2 text-right">Owed</th>
                        <th className="px-4 py-2 text-right">Net Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(balances).map(([userId, data]) => {
                        const member = group.members.find(m => m._id === userId);
                        if (!member) return null;
                        
                        return (
                          <tr key={userId} className="border-t">
                            <td className="px-4 py-3">{member.name}</td>
                            <td className="px-4 py-3 text-right">${data.paid.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">${data.owed.toFixed(2)}</td>
                            <td className={`px-4 py-3 text-right font-medium ${data.net > 0 ? 'text-green-600' : data.net < 0 ? 'text-red-600' : ''}`}>
                              {data.net > 0 ? '+' : ''}{data.net.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No balance information available yet.</p>
              )}
            </div>
          )}
          
          {activeTab === 'settlements' && (
            <SettlementList settlements={settlements} groupMembers={group.members} />
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
