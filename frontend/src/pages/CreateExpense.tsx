import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { ArrowLeft } from 'lucide-react';

interface Group {
  _id: string;
  name: string;
  members: {
    user: {
      _id: string;
      name: string;
      email: string;
      avatar: string;
    };
    isAdmin: boolean;
  }[];
}

interface CreateExpenseFormData {
  description: string;
  amount: number;
  group: string;
  category: string;
  date: string;
  notes: string;
  splitType: 'equal' | 'exact' | 'percentage';
}

interface SplitMember {
  userId: string;
  name: string;
  amount: number;
  percentage: number;
}

const CreateExpense: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const groupIdFromQuery = queryParams.get('groupId');
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [splitMembers, setSplitMembers] = useState<SplitMember[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateExpenseFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      category: 'Other',
      splitType: 'equal'
    }
  });
  
  const watchAmount = watch('amount', 0);
  const watchGroup = watch('group');
  const watchSplitType = watch('splitType');
  
  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const api = axios.create({
          baseURL: 'http://localhost:5000/api',
          withCredentials: true
        });
        
        const res = await api.get('/groups');
        setGroups(res.data.groups);
        
        // If groupId is provided in query params, set it as selected
        if (groupIdFromQuery) {
          setValue('group', groupIdFromQuery);
          const group = res.data.groups.find((g: Group) => g._id === groupIdFromQuery);
          if (group) {
            setSelectedGroup(group);
            initializeSplitMembers(group);
          }
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
      }
    };
    
    fetchGroups();
  }, [groupIdFromQuery, setValue]);
  
  // Update selected group when group selection changes
  useEffect(() => {
    if (watchGroup) {
      const group = groups.find(g => g._id === watchGroup);
      setSelectedGroup(group || null);
      if (group) {
        initializeSplitMembers(group);
      }
    }
  }, [watchGroup, groups]);
  
  // Update split type
  useEffect(() => {
    setSplitType(watchSplitType);
    if (selectedGroup) {
      updateSplitAmounts(watchSplitType, watchAmount);
    }
  }, [watchSplitType, watchAmount, selectedGroup]);
  
  const initializeSplitMembers = (group: Group) => {
    const members: SplitMember[] = group.members.map(member => ({
      userId: member.user._id,
      name: member.user.name,
      amount: 0,
      percentage: 0
    }));
    
    setSplitMembers(members);
    updateSplitAmounts(watchSplitType, watchAmount);
  };


const updateSplitAmounts = (type: 'equal' | 'exact' | 'percentage', totalAmount: number) => {
    setSplitMembers(prevMembers => {
      const memberCount = prevMembers.length;
      
      switch (type) {
        case 'equal':
          const equalShare = totalAmount / memberCount;
          return prevMembers.map(member => ({
            ...member,
            amount: Number(equalShare.toFixed(2)),
            percentage: Number((100 / memberCount).toFixed(2))
          }));
          
        case 'percentage':
          return prevMembers.map(member => ({
            ...member,
            amount: Number(((member.percentage / 100) * totalAmount).toFixed(2))
          }));
          
        case 'exact':
          return prevMembers;
          
        default:
          return prevMembers;
      }
    });
  };

  const handleSplitMemberChange = (
    userId: string,
    field: 'amount' | 'percentage',
    value: number
  ) => {
    setSplitMembers(prevMembers =>
      prevMembers.map(member =>
        member.userId === userId
          ? {
              ...member,
              [field]: value,
              ...(field === 'percentage' && {
                amount: Number(((value / 100) * watchAmount).toFixed(2))
              })
            }
          : member
      )
    );
  };

  const onSubmit = async (data: CreateExpenseFormData) => {
    try {
      setLoading(true);
      setError(null);

      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        withCredentials: true
      });

      const expenseData = {
        ...data,
        paidBy: user?._id,
        splits: splitMembers.map(member => ({
          user: member.userId,
          amount: member.amount,
          percentage: member.percentage
        }))
      };

      const res = await api.post('/expenses', expenseData);
      
      if (res.data.success) {
        navigate(`/groups/${data.group}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while creating expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Create New Expense</h1>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Description</label>
                <input
                  type="text"
                  {...register('description', { required: 'Description is required' })}
                  className="w-full p-2 border rounded"
                />
                {errors.description && (
                  <span className="text-red-500">{errors.description.message}</span>
                )}
              </div>

              <div>
                <label className="block mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { required: 'Amount is required', min: 0 })}
                  className="w-full p-2 border rounded"
                />
                {errors.amount && (
                  <span className="text-red-500">{errors.amount.message}</span>
                )}
              </div>

              <div>
                <label className="block mb-1">Group</label>
                <select
                  {...register('group', { required: 'Group is required' })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a group</option>
                  {groups.map(group => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {errors.group && (
                  <span className="text-red-500">{errors.group.message}</span>
                )}
              </div>

              <div>
                <label className="block mb-1">Category</label>
                <select
                  {...register('category')}
                  className="w-full p-2 border rounded"
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Date</label>
                <input
                  type="date"
                  {...register('date')}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block mb-1">Split Type</label>
                <select
                  {...register('splitType')}
                  className="w-full p-2 border rounded"
                >
                  <option value="equal">Equal</option>
                  <option value="exact">Exact Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              {selectedGroup && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Split Details</h3>
                  <div className="space-y-3">
                    {splitMembers.map(member => (
                      <div key={member.userId} className="flex items-center gap-4">
                        <span className="w-1/3">{member.name}</span>
                        {splitType === 'exact' ? (
                          <input
                            type="number"
                            value={member.amount}
                            onChange={e => handleSplitMemberChange(
                              member.userId,
                              'amount',
                              Number(e.target.value)
                            )}
                            className="w-32 p-2 border rounded"
                          />
                        ) : splitType === 'percentage' ? (
                          <input
                            type="number"
                            value={member.percentage}
                            onChange={e => handleSplitMemberChange(
                              member.userId,
                              'percentage',
                              Number(e.target.value)
                            )}
                            className="w-32 p-2 border rounded"
                          />
                        ) : (
                          <span>{member.amount.toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-1">Notes (Optional)</label>
                <textarea
                  {...register('notes')}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Creating...' : 'Create Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateExpense;