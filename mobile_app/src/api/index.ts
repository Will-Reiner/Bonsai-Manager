import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Para emulador Android, use 'http://10.0.2.2:3000'.
// Para telemóvel físico na mesma rede Wi-Fi, use o IP da sua máquina. 10.60.210.39 para roteador celular e 192.168.0.34 para wifi
// Para web (browser na mesma máquina do backend), usa-se localhost.
const SERVER_URL =
  Platform.OS === 'web' ? 'http://localhost:3000' : 'http://255.255.255.0:3000';
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