import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for persisted session on app start
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('auth_token');
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Session load error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password);
      const userData = {
        id: data.user_id,
        name: data.name,
        email: data.email,
      };
      await AsyncStorage.setItem('auth_token', data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.detail || 'Login failed. Please check your credentials.';
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await registerUser(name, email, password);
      console.log("REGISTER SUCCESS:", res);
      
      // Auto-login right after registration
      const loginRes = await login(email, password);
      if (loginRes.success) {
        return { success: true, autoLogin: true };
      }
      
      return { success: true, autoLogin: false };
    } catch (error) {
      console.log("REGISTER ERROR FULL:", error);
      
      const message =
        error.response?.data?.detail ||
        error.message ||
        'Registration failed. Please try again.';

      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
