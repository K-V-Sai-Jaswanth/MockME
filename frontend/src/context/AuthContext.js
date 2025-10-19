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

  const login = async (tokenData, userData) => {
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
    
    // Fetch full user data with purchases after login
    try {
      const response = await axios.get(`${API}/analytics/user`, {
        headers: { Authorization: `Bearer ${tokenData}` }
      });
      const userResponse = await axios.get(`${API}/tests`, {
        headers: { Authorization: `Bearer ${tokenData}` }
      });
      // Update user in local storage with backend data
      const fullUserData = { ...userData, purchasedTests: [] };
      localStorage.setItem('user', JSON.stringify(fullUserData));
      setUser(fullUserData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
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
