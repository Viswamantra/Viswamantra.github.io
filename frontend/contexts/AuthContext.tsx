import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  phone_number?: string;
  email?: string;
  name?: string;
  user_type: string;
  preferences: string[];
  location?: { latitude: number; longitude: number };
  is_phone_verified: boolean;
  is_email_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  sendOTP: (contact: string, contactType: 'phone' | 'email') => Promise<{ success: boolean; demo_otp?: string; message?: string }>;
  verifyOTP: (contact: string, contactType: 'phone' | 'email', otpCode: string) => Promise<{ success: boolean; token?: string; user_id?: string }>;
  updatePreferences: (preferences: string[]) => Promise<void>;
  updateLocation: (latitude: number, longitude: number) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        await fetchUserProfile(storedToken);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Clear invalid token
      await AsyncStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const login = async (authToken: string, userData: User) => {
    try {
      await AsyncStorage.setItem('auth_token', authToken);
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      console.error('Error storing auth token:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const sendOTP = async (contact: string, contactType: 'phone' | 'email') => {
    try {
      const response = await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/send-otp`, {
        contact,
        contact_type: contactType
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      throw new Error(error.response?.data?.detail || 'Failed to send OTP');
    }
  };

  const verifyOTP = async (contact: string, contactType: 'phone' | 'email', otpCode: string) => {
    try {
      const response = await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/verify-otp`, {
        contact,
        contact_type: contactType,
        otp_code: otpCode
      });
      return { success: true, ...response.data };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      throw new Error(error.response?.data?.detail || 'Failed to verify OTP');
    }
  };

  const updatePreferences = async (preferences: string[]) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      await axios.put(`${EXPO_PUBLIC_BACKEND_URL}/api/users/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local user state
      if (user) {
        setUser({ ...user, preferences });
      }
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update preferences');
    }
  };

  const updateLocation = async (latitude: number, longitude: number) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      await axios.put(`${EXPO_PUBLIC_BACKEND_URL}/api/users/location`, {
        latitude,
        longitude
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local user state
      if (user) {
        setUser({ ...user, location: { latitude, longitude } });
      }
    } catch (error: any) {
      console.error('Error updating location:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update location');
    }
  };

  const refreshUserProfile = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    sendOTP,
    verifyOTP,
    updatePreferences,
    updateLocation,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};