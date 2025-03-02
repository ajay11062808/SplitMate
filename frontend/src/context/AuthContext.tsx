import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {}
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true
  });

  // Check if user is logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login user
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.post('/auth/register', { name, email, password });
      
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setLoading(true);
      await api.get('/auth/logout');
      setUser(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during logout');
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (data: { name?: string; avatar?: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.put('/users/profile', data);
      
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};