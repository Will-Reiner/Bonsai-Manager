import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { Alert } from 'react-native';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextData {
  authState: AuthState;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('user_token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setAuthState({ token, isAuthenticated: true, isLoading: false });
      } else {
        setAuthState({ token: null, isAuthenticated: false, isLoading: false });
      }
    };
    loadToken();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha: pass });
      const { token } = response.data;
      await AsyncStorage.setItem('user_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAuthState({ token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      Alert.alert('Erro de Login', 'Email ou senha inválidos.');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user_token');
    delete api.defaults.headers.common['Authorization'];
    setAuthState({ token: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);