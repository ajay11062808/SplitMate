import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/groups');
        setGroups(res.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching groups');
        setLoading(false);
      }
    };
    
    fetchGroups();
  }, []);
  
  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link 
          to="/groups/new" 
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
        >
          Create Group
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Groups</h2>
        
        {groups.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-600">You don't have any groups yet.</p>
            <Link to="/groups/new" className="text-blue-500 mt-2 inline-block">
              Create your first group
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map(group => (
              <Link 
                key={group._id} 
                to={`/groups/${group._id}`}
                className="block border rounded p-4 hover:bg-gray-50 transition"
              >
                <h3 className="font-medium text-lg">{group.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                </p>
                {group.description && (
                  <p className="text-gray-700 mt-2 text-sm">{group.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;