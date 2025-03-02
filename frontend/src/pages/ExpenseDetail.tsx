import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  IndianRupeeIcon,
  Calendar,
  Tag,
  Users,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface Expense {
  _id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  paidBy: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
  };
  group: {
    _id: string;
    name: string;
  };
  splits: {
    user: {
      _id: string;
      name: string;
      email: string;
      avatar: string;
    };
    amount: number;
    settled: boolean;
  }[];
  notes: string;
  receipt: string;
}

const ExpenseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const api = axios.create({
          baseURL: 'http://localhost:5000/api',
          withCredentials: true
        });
        
        const res = await api.get(`/expenses/${id}`);
        setExpense(res.data.expense);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load expense details');
        setLoading(false);
      }
    };
    
    fetchExpense();
  }, [id]);
  
  const handleDeleteExpense = async () => {
    if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }
    
    try {
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        withCredentials: true
      });
      
      await api.delete(`/expenses/${id}`);
      navigate(`/groups/${expense?.group._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete expense');
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
  
  if (!expense) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">Expense not found</p>
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
  
  const isOwner = expense.paidBy._id === user?._id;
  
  return (
    <div>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to={`/groups/${expense.group._id}`} className="text-blue-600 hover:text-blue-500 flex items-center">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Group
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold text-gray-900">{expense.description}</h1>
              
              {isOwner && (
                <div className="flex space-x-2">
                  <Link
                    to={`/expenses/${expense._id}/edit`}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    onClick={handleDeleteExpense}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Expense Details</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <IndianRupeeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Amount</p>
                      <p className="text-lg font-semibold text-gray-900">₹{expense.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-base text-gray-900">{format(new Date(expense.date), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Tag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Category</p>
                      <p className="text-base text-gray-900">{expense.category}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Group</p>
                      <Link to={`/groups/${expense.group._id}`} className="text-base text-blue-600 hover:text-blue-500">
                        {expense.group.name}
                      </Link>
                    </div>
                  </div>
                  
                  {expense.notes && (
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Notes</p>
                        <p className="text-base text-gray-900">{expense.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Paid By</h2>
                
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {expense.paidBy.avatar ? (
                      <img
                        src={expense.paidBy.avatar}
                        alt={expense.paidBy.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-500">
                        {expense.paidBy.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-900">
                      {expense.paidBy.name}
                      {expense.paidBy._id === user?._id && (
                        <span className="ml-2 text-sm text-blue-600">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{expense.paidBy.email}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Split Details</h2>
              
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Person
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expense.splits.map((split) => (
                      <tr key={split.user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              {split.user.avatar ? (
                                <img
                                  src={split.user.avatar}
                                  alt={split.user.name}
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <span className="text-xs font-medium text-gray-500">
                                  {split.user.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {split.user.name}
                                {split.user._id === user?._id && (
                                  <span className="ml-2 text-xs text-blue-600">(You)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₹{split.amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            {((split.amount / expense.amount) * 100).toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {split.settled ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Settled
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Unsettled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </td>
                      <td className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                        ₹{expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* Settlement Actions */}
              {expense.paidBy._id !== user?._id && (
                <div className="mt-6">
                  <h3 className="text-base font-medium text-gray-900 mb-2">Settlement</h3>
                  
                  <div className="flex space-x-4">
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                      <IndianRupeeIcon className="mr-2 h-5 w-5" />
                      Settle Up
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetail;