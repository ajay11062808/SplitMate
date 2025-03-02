import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { Search, UserPlus, UserMinus } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

const Friends: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true
  });

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await api.get('/users/friends');
      setFriends(res.data.friends);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching friends');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const res = await api.get(`/users/search?query=${searchQuery}`);
      setSearchResults(res.data.users.filter((u: User) => u._id !== user?._id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error searching users');
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (friendId: string) => {
    try {
      await api.post(`/users/friends/${friendId}`);
      fetchFriends();
      setSearchResults([]);
      setSearchQuery('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error adding friend');
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      await api.delete(`/users/friends/${friendId}`);
      fetchFriends();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error removing friend');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Friends</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="mb-8">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-md">
                {searchResults.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full" />
                        ) : (
                          <span>{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addFriend(user._id)}
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">Your Friends</h2>
            <div className="space-y-4">
              {friends.map((friend) => (
                <div key={friend._id} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="h-10 w-10 rounded-full" />
                      ) : (
                        <span>{friend.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-gray-500">{friend.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(friend._id)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <UserMinus className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;