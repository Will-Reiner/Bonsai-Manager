import api from '../api';
import { Foto } from '../types';

/**
 * DTO para o upload de uma nova foto.
 * Reflete a nova estrutura da API.
 */
export interface CreateFotoDTO {
  caminhoArquivo: string;
  plantaId?: string | null;
  titulo?: string;
  tags?: string;
}

/**
 * DTO para a atualização dos dados de uma foto.
 */
export interface UpdateFotoDTO {
  titulo?: string;
  tags?: string;
}


/**
 * Busca todas as fotos de uma planta específica.
 */
const getFotosPorPlanta = async (plantaId: string): Promise<Foto[]> => {
  const response = await api.get(`/fotos/planta/${plantaId}`);
  return response.data;
};

/**
 * Faz o upload dos dados de uma nova foto.
 */
const createFoto = async (data: CreateFotoDTO): Promise<Foto> => {
  // Nota: O upload real do arquivo de imagem geralmente é um processo multipart/form-data.
  // Por agora, este serviço apenas envia os metadados.
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