import api from '../api';
import { Foto } from '../types';

/**
 * DTO para criar um novo registo de mídia.
 */
export interface CreateFotoDTO {
  caminhoArquivo: string;
  plantaId?: string | null;
  titulo?: string;
  tags?: string;
  tipo?: 'FOTO' | 'VIDEO' | 'VISAO_FUTURA';
  descricao?: string;
  thumbnailUrl?: string;
}

/**
 * DTO para a atualização dos dados de uma foto.
 */
export interface UpdateFotoDTO {
  titulo?: string;
  tags?: string;
  descricao?: string;
}

/**
 * Busca todas as fotos de uma planta específica.
 */
const getFotosPorPlanta = async (plantaId: string): Promise<Foto[]> => {
  const response = await api.get(`/fotos/planta/${plantaId}`);
  return response.data;
};

/**
 * Cria um registo de mídia com metadados (URL R2 já obtida via upload direto).
 */
const createFoto = async (data: CreateFotoDTO): Promise<Foto> => {
  const response = await api.post('/fotos', data);
  return response.data;
};

/**
 * Atualiza os dados de uma foto.
 */
const updateFoto = async (id: string, data: UpdateFotoDTO): Promise<Foto> => {
  const response = await api.put(`/fotos/${id}`, data);
  return response.data;
};

/**
 * Deleta uma foto.
 */
const deleteFoto = async (id: string): Promise<void> => {
  await api.delete(`/fotos/${id}`);
};

export const fotoService = {
  getFotosPorPlanta,
  createFoto,
  updateFoto,
  deleteFoto,
};
