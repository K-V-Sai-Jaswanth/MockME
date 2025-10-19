import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (tokenData, userData) => {
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      // Fetch purchases to update user's purchased tests
      const purchases = await axios.get(`${API}/purchases/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const purchasedTestIds = purchases.data.map(p => p.testId).filter(Boolean);
      const updatedUser = { ...user, purchasedTests: purchasedTestIds };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, getAuthHeaders, API }}>
      {children}
    </AuthContext.Provider>
  );
};
