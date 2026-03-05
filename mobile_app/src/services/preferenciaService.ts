import api from '../api';
import { Preferencias } from '../types';

const getPreferencias = async (): Promise<Partial<Preferencias>> => {
  const response = await api.get('/preferencias');
  return response.data;
};

const updatePreferencias = async (preferencias: Record<string, string>): Promise<Partial<Preferencias>> => {
  const response = await api.put('/preferencias', { preferencias });
  return response.data;
};

const updatePreferencia = async (chave: string, valor: string): Promise<void> => {
  await api.put(`/preferencias/${chave}`, { valor });
};

export const preferenciaService = {
  getPreferencias,
  updatePreferencias,
  updatePreferencia,
};
