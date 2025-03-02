import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  IndianRupeeIcon, 
  MessageCircle, 
  Users, 
  Trash2, 
  Edit, 
  PlusCircle,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

interface Group {
  _id: string;
  name: string;
  description: string;
  members: {
    user: {
      _id: string;
      name: string;
      email: string;
      avatar: string;
    };
    isAdmin: boolean;
  }[];
  createdBy: {
    _id: string;
    name: string;
  };
  expenses: Expense[];
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  paidBy: {
    _id: string;
    name: string;
  };
  splits: {
    user: {
      _id: string;
      name: string;
    };
    amount: number;
    settled: boolean;
  }[];
}

interface Balance {
  userId: string;
  name: string;
  amount: number;
}

const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const api = axios.create({
          baseURL: 'http://localhost:5000/api',
          withCredentials: true
        });
        
        // Fetch group details
        const groupRes = await api.get(`/groups/${id}`);
        setGroup(groupRes.data.group);
        
        // Fetch expenses for this group
        const expensesRes = await api.get(`/expenses/group/${id}`);
        setExpenses(expensesRes.data.expenses);
        
        // Calculate balances
        calculateBalances(expensesRes.data.expenses);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load group details');
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [id]);
  
  const calculateBalances = (expenses: Expense[]) => {
    const balanceMap = new Map<string, { name: string; amount: number }>();
    
    // Initialize balances for all group members
    if (group) {
      group.members.forEach(member => {
        if (member.user._id !== user?._id) {
          balanceMap.set(member.user._id, { name: member.user.name, amount: 0 });
        }
      });
    }
    
    expenses.forEach(expense => {
      // If current user paid for the expense
      if (expense.paidBy._id === user?._id) {
        expense.splits.forEach(split => {
          if (split.user._id !== user?._id) {
            const currentBalance = balanceMap.get(split.user._id) || { name: split.user.name, amount: 0 };
            balanceMap.set(split.user._id, {
              name: split.user.name,
              amount: currentBalance.amount + (split.settled ? 0 : split.amount)
            });
          }
        });
      }
      // If someone else paid and current user is in the split
      else {
        const userSplit = expense.splits.find(split => split.user._id === user?._id);
        if (userSplit) {
          const currentBalance = balanceMap.get(expense.paidBy._id) || { name: expense.paidBy.name, amount: 0 };
          balanceMap.set(expense.paidBy._id, {
            name: expense.paidBy.name,
            amount: currentBalance.amount - (userSplit.settled ? 0 : userSplit.amount)
          });
        }
      }
    });
    
    const balanceArray: Balance[] = [];
    balanceMap.forEach((value, key) => {
      balanceArray.push({
        userId: key,
        name: value.name,
        amount: value.amount
      });
    });
    
    setBalances(balanceArray);
  };
  
  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    try {
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        withCredentials: true
      });
      // First delete all expenses in the group
      await api.delete(`/expenses/group/${id}`);
      //delete groups
      await api.delete(`/groups/${id}`);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete group');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <Link to="/" className="text-blue-600 hover:text-blue-500">
            <ArrowLeft className="inline-block mr-2 h-5 w-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  if (!group) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">Group not found</p>
              </div>
            </div>
          </div>
          <Link to="/" className="text-blue-600 hover:text-blue-500">
            <ArrowLeft className="inline-block mr-2 h-5 w-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  const isAdmin = group.members.some(
    member => member.user._id === user?._id && member.isAdmin
  );
  
  return (
    <div>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-500 flex items-center">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            {group.description && (
              <p className="text-gray-600 mt-1">{group.description}</p>
            )}
          </div>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link
              to={`/expenses/create?groupId=${group._id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <IndianRupeeIcon className="mr-2 h-5 w-5" />
              Add Expense
            </Link>
            
            <Link
              to={`/chat/group/${group._id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Group Chat
            </Link>
            
            {isAdmin && (
              <button
                onClick={handleDeleteGroup}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Delete Group
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Members */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Members ({group.members.length})</h2>
              {isAdmin && (
                <button className="text-sm text-blue-600 hover:text-blue-500">
                  <PlusCircle className="inline-block mr-1 h-4 w-4" />
                  Add
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {group.members.map((member) => (
                <div key={member.user._id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {member.user.avatar ? (
                        <img
                          src={member.user.avatar}
                          alt={member.user.name}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-500">
                          {member.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {member.user.name}
                        {member.isAdmin && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Balances */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Balances</h2>
            
            {balances.length === 0 ? (
              <p className="text-gray-500">No balances to show.</p>
            ) : (
              <div className="space-y-4">
                {balances.map((balance) => (
                  <div key={balance.userId} className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{balance.name}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${balance.amount > 0 ? 'text-green-600' : balance.amount < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {balance.amount > 0 ? (
                        <span>owes you ₹{balance.amount.toFixed(2)}</span>
                      ) : balance.amount < 0 ? (
                        <span>you owe ₹{Math.abs(balance.amount).toFixed(2)}</span>
                      ) : (
                        <span>settled up</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Expenses Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Expenses Summary</h2>
            
            {expenses.length === 0 ? (
              <p className="text-gray-500">No expenses yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="text-sm font-medium text-gray-900">Total Expenses</p>
                  <p className="text-sm font-medium text-gray-900">
                    ₹{expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="text-sm font-medium text-gray-900">Number of Expenses</p>
                  <p className="text-sm font-medium text-gray-900">{expenses.length}</p>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="text-sm font-medium text-gray-900">Latest Expense</p>
                  <p className="text-sm font-medium text-gray-900">
                    {expenses.length > 0 ? format(new Date(expenses[0].date), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Expenses List */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Expenses</h2>
            <Link
              to={`/expenses/create?groupId=${group._id}`}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              <PlusCircle className="inline-block mr-1 h-4 w-4" />
              Add Expense
            </Link>
          </div>
          
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <IndianRupeeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new expense.</p>
              <div className="mt-6">
                <Link
                  to={`/expenses/create?groupId=${group._id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  <IndianRupeeIcon className="mr-2 h-5 w-5" />
                  Add Expense
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{format(new Date(expense.date), 'MMM d, yyyy')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{expense.paidBy.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{expense.amount.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/expenses/${expense._id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                          View
                        </Link>
                        {expense.paidBy._id === user?._id && (
                          <>
                            <Link to={`/expenses/${expense._id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                              Edit
                            </Link>
                            <button className="text-red-600 hover:text-red-900">
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;