import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { Alert } from 'react-native';
import { Usuario } from '../types';

// Chaves de armazenamento como constantes
const TOKEN_KEY = 'user_token';
const USER_DATA_KEY = 'user_data';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: Usuario | null;
}

interface AuthContextData {
  authState: AuthState;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: Partial<Usuario>) => Promise<void>;
  user: Usuario | null;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
        const user = userDataString ? JSON.parse(userDataString) : null;

        if (token && user) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setAuthState({ token, user, isAuthenticated: true, isLoading: false });
        } else {
          setAuthState({ token: null, user: null, isAuthenticated: false, isLoading: false });
        }
      } catch (e) {
        // Em caso de erro, simplesmente reseta o estado
        setAuthState({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    };
    loadStorageData();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha: pass });
      const { token, user } = response.data;

      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAuthState({ token, user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      Alert.alert('Erro de Login', 'Email ou senha inválidos.');
      throw error;
    }
  };

  const updateUser = async (updatedFields: Partial<Usuario>) => {
    const updatedUser = { ...authState.user, ...updatedFields } as Usuario;
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
    setAuthState(prev => ({ ...prev, user: updatedUser }));
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
    delete api.defaults.headers.common['Authorization'];
    setAuthState({ token: null, user: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, updateUser, user: authState.user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);