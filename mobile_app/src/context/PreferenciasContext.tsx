import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { preferenciaService } from '../services/preferenciaService';
import { useAuth } from './AuthContext';
import { Preferencias, PREFERENCIAS_DEFAULTS } from '../types';

const PREFERENCIAS_STORAGE_KEY = 'user_preferencias';

interface PreferenciasContextData {
  preferencias: Preferencias;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  updatePreferencia: (chave: string, valor: string) => void;
  updatePreferencias: (prefs: Record<string, string>) => Promise<void>;
  reloadPreferencias: () => Promise<void>;
}

const PreferenciasContext = createContext<PreferenciasContextData>({} as PreferenciasContextData);

export const PreferenciasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const [preferencias, setPreferencias] = useState<Preferencias>({ ...PREFERENCIAS_DEFAULTS });
  const [isLoading, setIsLoading] = useState(true);

  const loadPreferencias = useCallback(async () => {
    if (!authState.isAuthenticated) {
      setPreferencias({ ...PREFERENCIAS_DEFAULTS });
      setIsLoading(false);
      return;
    }

    try {
      // Tenta carregar do cache local primeiro
      const cached = await AsyncStorage.getItem(PREFERENCIAS_STORAGE_KEY);
      if (cached) {
        setPreferencias({ ...PREFERENCIAS_DEFAULTS, ...JSON.parse(cached) });
      }

      // Busca do backend
      const serverPrefs = await preferenciaService.getPreferencias();
      const merged = { ...PREFERENCIAS_DEFAULTS, ...serverPrefs };
      setPreferencias(merged);
      await AsyncStorage.setItem(PREFERENCIAS_STORAGE_KEY, JSON.stringify(serverPrefs));
    } catch {
      // Se falhar, usa cache ou defaults
      const cached = await AsyncStorage.getItem(PREFERENCIAS_STORAGE_KEY);
      if (cached) {
        setPreferencias({ ...PREFERENCIAS_DEFAULTS, ...JSON.parse(cached) });
      }
    } finally {
      setIsLoading(false);
    }
  }, [authState.isAuthenticated]);

  useEffect(() => {
    loadPreferencias();
  }, [loadPreferencias]);

  // Limpa cache ao deslogar
  useEffect(() => {
    if (!authState.isAuthenticated) {
      AsyncStorage.removeItem(PREFERENCIAS_STORAGE_KEY);
      setPreferencias({ ...PREFERENCIAS_DEFAULTS });
    }
  }, [authState.isAuthenticated]);

  const updatePreferencia = useCallback((chave: string, valor: string) => {
    setPreferencias(prev => ({ ...prev, [chave]: valor }));
  }, []);

  const updatePreferencias = useCallback(async (prefs: Record<string, string>) => {
    try {
      const serverPrefs = await preferenciaService.updatePreferencias(prefs);
      const merged = { ...PREFERENCIAS_DEFAULTS, ...serverPrefs };
      setPreferencias(merged);
      await AsyncStorage.setItem(PREFERENCIAS_STORAGE_KEY, JSON.stringify(serverPrefs));
    } catch (error) {
      throw error;
    }
  }, []);

  const isOnboardingComplete = preferencias.onboarding_concluido === 'true';

  return (
    <PreferenciasContext.Provider
      value={{
        preferencias,
        isLoading,
        isOnboardingComplete,
        updatePreferencia,
        updatePreferencias,
        reloadPreferencias: loadPreferencias,
      }}
    >
      {children}
    </PreferenciasContext.Provider>
  );
};

export const usePreferencias = () => useContext(PreferenciasContext);
