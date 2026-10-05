import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'bonsai_token';

export const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Chamado quando a API responde 401 (token expirado/inválido) — o AuthProvider registra o logout aqui.
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isAuthRoute = error.config?.url?.startsWith('/auth/login');
    if (error.response?.status === 401 && !isAuthRoute && onUnauthorized) onUnauthorized();
    return Promise.reject(error);
  },
);

interface ApiErrorBody {
  message?: string;
  errors?: { campo: string; mensagem: string }[];
  error?: string | { issues?: { message: string }[] };
}

/** Extrai uma mensagem legível dos vários formatos de erro que a API devolve. */
export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'Sem conexão com o servidor.';
    const body = error.response.data;
    const erro = body?.error;
    return (
      body?.errors?.[0]?.mensagem ||
      (typeof erro === 'string' ? erro : erro?.issues?.[0]?.message) ||
      body?.message ||
      fallback
    );
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
