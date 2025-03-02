import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { ArrowLeft } from 'lucide-react';

interface Settlement {
  _id: string;
  group: {
    _id: string;
    name: string;
  };
  payer: {
    _id: string;
    name: string;
    avatar: string;
  };
  receiver: {
    _id: string;
    name: string;
    avatar: string;
  };
  amount: number;
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
}

const SettlementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettlement = async () => {
      try {
        const api = axios.create({
          baseURL: 'http://localhost:5000/api',
          withCredentials: true
        });

        const res = await api.get(`/settlements/${id}`);
        setSettlement(res.data.settlement);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch settlement details');
      } finally {
        setLoading(false);
      }
    };

    fetchSettlement();
  }, [id]);

  const handleMarkAsCompleted = async () => {
    try {
      setLoading(true);
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        withCredentials: true
      });

      await api.patch(`/settlements/${id}`, { status: 'completed' });
      
      // Refresh settlement data
      const res = await api.get(`/settlements/${id}`);
      setSettlement(res.data.settlement);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update settlement status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-red-100 text-red-600 p-4 rounded-md">
            {error || 'Settlement not found'}
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">Settlement Details</h1>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Group</p>
                <p className="font-medium">{settlement.group.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium text-lg">${settlement.amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={settlement.payer.avatar}
                  alt={settlement.payer.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="text-sm text-gray-500">Payer</p>
                  <p className="font-medium">{settlement.payer.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Receiver</p>
                  <p className="font-medium">{settlement.receiver.name}</p>
                </div>
                <img
                  src={settlement.receiver.avatar}
                  alt={settlement.receiver.name}
                  className="w-12 h-12 rounded-full"
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm ${
                  settlement.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p>{new Date(settlement.createdAt).toLocaleDateString()}</p>
            </div>

            {settlement.status === 'pending' && (
              <button
                onClick={handleMarkAsCompleted}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-green-300"
              >
                Mark as Completed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementDetail;