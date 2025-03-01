import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateGroup = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: []
  });
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users');
        setUsers(res.data);
      } catch (err) {
        setError('Error fetching users');
      }
    };
    
    fetchUsers();
  }, []);
  
  const { name, description } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleUserSelect = e => {
    const selectedId = e.target.value;
    if (selectedId && !selectedUsers.includes(selectedId)) {
      setSelectedUsers([...selectedUsers, selectedId]);
      setFormData({
        ...formData,
        members: [...formData.members, selectedId]
      });
    }
  };
  
  const removeUser = userId => {
    setSelectedUsers(selectedUsers.filter(id => id !== userId));
    setFormData({
      ...formData,
      members: formData.members.filter(id => id !== userId)
    });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await axios.post('http://localhost:5000/api/groups', formData);
      navigate(`/groups/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating group');
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded shadow-md">
      <h1 className="text-2xl font-bold mb-6">Create New Group</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="name">
            Group Name*
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows="3"
          ></textarea>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">
            Add Members
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
            onChange={handleUserSelect}
            value=""
          >
            <option value="">Select users to add</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          
          {selectedUsers.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-700 mb-2">Selected members:</p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(userId => {
                  const user = users.find(u => u._id === userId);
                  return user ? (
                    <div 
                      key={userId}
                      className="flex items-center bg-blue-100 px-3 py-1 rounded"
                    >
                      <span className="text-sm mr-2">{user.name}</span>
                      <button
                        type="button"
                        onClick={() => removeUser(userId)}
                        className="text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroup;