import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage immediately to prevent logout on refresh
  const getInitialUser = () => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(getInitialUser());
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        // Verify token is still valid
        const data = await apiService.getCurrentUser();
        // Update user with fresh data from server
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch (error) {
        // Only clear auth if token is actually invalid (401)
        // Don't clear on network errors or other issues
        const status = error.response?.status || error.status;
        const errorMessage = error.message || error.response?.data?.message || '';
        
        if (status === 401 || errorMessage.includes('401') || errorMessage.includes('Not authorized')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
        // Otherwise, keep the user logged in with cached data
        // This handles network errors, server downtime, etc.
      }
    } else {
      // No token or user, ensure state is cleared
      setUser(null);
    }
    setLoading(false);
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, initAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

