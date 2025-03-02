import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { PlusCircle, Users, IndianRupeeIcon, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface Group {
  _id: string;
  name: string;
  members: {
    user: {
      _id: string;
      name: string;
      avatar: string;
    };
    isAdmin: boolean;
  }[];
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
  group: {
    _id: string;
    name: string;
  };
}

interface Balance {
  userId: string;
  name: string;
  amount: number;
}

const Dashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState<Group[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = axios.create({
          baseURL: 'http://localhost:5000/api',
          withCredentials: true
        });

        // Fetch groups
        const groupsRes = await api.get('/groups');
        setGroups(groupsRes.data.groups);

        // Fetch recent expenses
        const expensesRes = await api.get('/expenses');
        setRecentExpenses(expensesRes.data.expenses.slice(0, 5));

        // Calculate balances
        const expenses = expensesRes.data.expenses;
        const balanceMap = new Map<string, { name: string; amount: number }>();

        expenses.forEach((expense: any) => {
          // If user paid for the expense
          if (expense.paidBy._id === user?._id) {
            expense.splits.forEach((split: any) => {
              if (split.user._id !== user?._id) {
                const currentBalance = balanceMap.get(split.user._id) || { name: split.user.name, amount: 0 };
                balanceMap.set(split.user._id, {
                  name: split.user.name,
                  amount: currentBalance.amount + split.amount
                });
              }
            });
          }
          // If user is part of the split
          else {
            const userSplit = expense.splits.find((split: any) => split.user._id === user?._id);
            if (userSplit) {
              const currentBalance = balanceMap.get(expense.paidBy._id) || { name: expense.paidBy.name, amount: 0 };
              balanceMap.set(expense.paidBy._id, {
                name: expense.paidBy.name,
                amount: currentBalance.amount - userSplit.amount
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
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link
              to="/groups/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              New Group
            </Link>
            <Link
              to="/expenses/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <IndianRupeeIcon className="mr-2 h-5 w-5" />
              Add Expense
            </Link>
          </div>
        </div>
        
        {/* Balances */}
        <div className="bg-white shadow rounded-lg mb-8 p-6">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Groups */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Your Groups</h2>
              <Link to="/groups/create" className="text-sm text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
            
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No groups</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new group.</p>
                <div className="mt-6">
                  <Link
                    to="/groups/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    New Group
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.slice(0, 5).map((group) => (
                  <Link
                    key={group._id}
                    to={`/groups/${group._id}`}
                    className="block hover:bg-gray-50 p-4 rounded-md border border-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-500">{group.members.length} members</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Recent Expenses */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Expenses</h2>
              <Link to="/expenses/create" className="text-sm text-blue-600 hover:text-blue-500">
                Add expense
              </Link>
            </div>
            
            {recentExpenses.length === 0 ? (
              <div className="text-center py-8">
                <IndianRupeeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new expense.</p>
                <div className="mt-6">
                  <Link
                    to="/expenses/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    <IndianRupeeIcon className="mr-2 h-5 w-5" />
                    Add Expense
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentExpenses.map((expense) => (
                  <Link
                    key={expense._id}
                    to={`/expenses/${expense._id}`}
                    className="block hover:bg-gray-50 p-4 rounded-md border border-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{expense.description}</h3>
                        <p className="text-xs text-gray-500">
                        {expense.group?.name || 'No Group'}  • {format(new Date(expense.date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500">
                           Paid by {expense.paidBy?.name || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">₹{expense.amount.toFixed(2)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;