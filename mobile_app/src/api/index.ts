import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Para emulador Android, use 'http://10.0.2.2:3000/api'.
// Para telemóvel físico na mesma rede Wi-Fi, use o IP da sua máquina.
const API_URL = 'http://192.168.0.27:3000/api';

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

export default api;