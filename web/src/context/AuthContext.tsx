import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler, tokenStorage } from '@/lib/api';
import { authApi } from '@/lib/endpoints';
import type { Usuario } from '@/types';

const USER_KEY = 'bonsai_user';

interface AuthContextData {
  user: Usuario | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
  setUser: (user: Usuario) => void;
}

const AuthContext = createContext<AuthContextData | null>(null);

function readStoredUser(): Usuario | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw && tokenStorage.get() ? (JSON.parse(raw) as Usuario) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<Usuario | null>(readStoredUser);

  const setUser = useCallback((next: Usuario) => {
    setUserState((prev) => {
      const merged = { ...prev, ...next } as Usuario;
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    localStorage.removeItem(USER_KEY);
    setUserState(null);
    queryClient.clear();
  }, [queryClient]);

  const login = useCallback(
    async (email: string, senha: string) => {
      const { token, user: logged } = await authApi.login(email, senha);
      tokenStorage.set(token);
      localStorage.setItem(USER_KEY, JSON.stringify(logged));
      setUserState(logged);
    },
    [],
  );

  const register = useCallback(
    async (nome: string, email: string, senha: string) => {
      await authApi.register({ nome, email, senha });
      await login(email, senha);
    },
    [login],
  );

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Revalida o usuário (role/foto podem ter mudado) ao abrir o app
  useEffect(() => {
    if (!tokenStorage.get()) return;
    authApi.me().then(setUser).catch(() => undefined);
  }, [setUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      setUser,
    }),
    [user, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
