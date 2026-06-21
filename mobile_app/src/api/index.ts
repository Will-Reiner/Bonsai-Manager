import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// URL do servidor em PRODUÇÃO (usada nos builds release — ex.: APK do EAS).
const PROD_URL = 'https://bonsai.astraflow.io';

// URL em DESENVOLVIMENTO (Metro/Expo rodando localmente):
// - Emulador Android: 'http://10.0.2.2:3000'
// - Web (mesmo PC do backend): 'http://localhost:3000'
// - Dispositivo físico na mesma Wi-Fi: troque pelo IP da sua máquina (ex.: 'http://192.168.0.34:3000')
const DEV_URL =
  Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

// __DEV__ é falso em builds de produção, então o APK aponta para PROD_URL automaticamente.
const SERVER_URL = __DEV__ ? DEV_URL : PROD_URL;
const API_URL = `${SERVER_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
});

// Adiciona o token JWT a todas as requisições autenticadas
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { SERVER_URL };
export default api;