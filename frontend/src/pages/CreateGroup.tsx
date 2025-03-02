import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Users, X, Search, ArrowLeft } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

interface CreateGroupFormData {
  name: string;
  description: string;
}

const CreateGroup: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<CreateGroupFormData>();
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        withCredentials: true
      });
      
      const res = await api.get(`/users/search?query=${searchQuery}`);
      
      // Filter out current user and already selected users
      const filteredResults = res.data.users.filter(
        (searchUser: User) => 
          searchUser._id !== user?._id && 
          !selectedUsers.some(selectedUser => selectedUser._id === searchUser._id)
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };
  
  const handleSelectUser = (selectedUser: User) => {
    setSelectedUsers([...selectedUsers, selectedUser]);
    setSearchResults(searchResults.filter(user => user._id !== selectedUser._id));
    setSearchQuery('');
  };
  
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };
  
  const onSubmit = async (data: CreateGroupFormData) => {
    if (selectedUsers.length === 0) {
      setError('Please add at least one member to the group');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        withCredentials: true
      });
      
      const res = await api.post('/groups', {
        name: data.name,
        description: data.description,
        members: selectedUsers.map(user => user._id)
      });
      
      navigate(`/groups/${res.data.group._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create group');
      setLoading(false);
    }
  };
  
  // Handle Enter key in search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };
  
  return (
    <div>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="text-blue-600 hover:text-blue-500 flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </button>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a New Group</h1>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                id="name"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter group name"
                {...register('name', { required: 'Group name is required' })}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter group description (optional)"
                {...register('description')}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Members *
              </label>
              
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Search users by name or email"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {searchResults.map((searchUser) => (
                      <li 
                        key={searchUser._id} 
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectUser(searchUser)}
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {searchUser.avatar ? (
                              <img
                                src={searchUser.avatar}
                                alt={searchUser.name}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-500">
                                {searchUser.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{searchUser.name}</p>
                            <p className="text-xs text-gray-500">{searchUser.email}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Selected Users */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Members ({selectedUsers.length})</h3>
                
                {selectedUsers.length === 0 ? (
                  <p className="text-sm text-gray-500">No members selected yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((selectedUser) => (
                      <div 
                        key={selectedUser._id}
                        className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1"
                      >
                        <span className="text-sm">{selectedUser.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(selectedUser._id)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mr-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;