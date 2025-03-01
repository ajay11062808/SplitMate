import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); 

  // Set axios default headers
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Load user if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // You might need to create an endpoint to get user data
          const res = await axios.get('http://localhost:5000/api/auth/me');
          setUser(res.data);
          setIsAuthenticated(true);
          console.log('User loaded successfully:', res.data);
        } catch (err) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          console.log('Error loading user:', err);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    try {
      const res = await axios.post('http://localhost:5000/api/register', userData);
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response && err.response.data.error 
          ? err.response.data.error 
          : 'Registration failed'
      };
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', credentials);
      console.log("Inside Auth login context",res.data);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response && err.response.data.error 
          ? err.response.data.error 
          : 'Login failed'
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;