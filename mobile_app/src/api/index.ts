import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Para emulador Android, use 'http://10.0.2.2:3000/api'.
// Para telemóvel físico na mesma rede Wi-Fi, use o IP da sua máquina. 10.60.210.39 para roteador celular e 192.168.0.34 para wifi
const SERVER_URL = 'http://192.168.0.39:3000';
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