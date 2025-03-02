import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { Send, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
}

interface Chat {
  _id: string;
  group?: {
    _id: string;
    name: string;
  };
  participants: {
    _id: string;
    name: string;
    avatar: string;
  }[];
  messages: Message[];
}

const Chat: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const { user } = useContext(AuthContext);
  const { socket, connected } = useContext(SocketContext);
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChat();
    if (socket && connected) {
      socket.emit(`join${type === 'group' ? 'GroupChat' : 'DirectChat'}`, id);
    }

    return () => {
      if (socket && connected) {
        socket.emit(`leave${type === 'group' ? 'GroupChat' : 'DirectChat'}`, id);
      }
    };
  }, [id, type, socket, connected]);

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (data: { message: Message }) => {
        setChat(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.message]
        } : null);
      });
    }
  }, [socket]);

  const fetchChat = async () => {
    try {
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        withCredentials: true
      });
      
      const res = await api.get(`/chats/${type}/${id}`);
      setChat(res.data.chat);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching chat');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !socket || !connected) return;

    socket.emit(`send${type === 'group' ? 'GroupMessage' : 'DirectMessage'}`, {
      [`${type}Id`]: id,
      content: message
    });

    setMessage('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div>
        <Navbar />
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-red-100 text-red-600 p-4 rounded-md">
            {error || 'Chat not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b p-4">
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold">
                {chat.group ? chat.group.name : chat.participants.find(p => p._id !== user?._id)?.name}
              </h1>
            </div>
          </div>

          <div className="h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chat.messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${msg.sender._id === user?._id ? 'bg-blue-600 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                    {msg.sender._id !== user?._id && (
                      <p className="text-xs text-gray-600 mb-1">{msg.sender.name}</p>
                    )}
                    <p className="break-words">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-md"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!connected}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              {!connected && (
                <p className="text-red-500 text-sm mt-2">Disconnected from chat server</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;