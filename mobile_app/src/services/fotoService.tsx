import api from '../api';
import { Foto } from '../types';

/**
 * DTO para o upload de uma nova foto.
 * Reflete o `createFotoSchema` do backend.
 * O caminho do arquivo será provavelmente um URI local antes do upload,
 * e uma URL após o upload, dependendo da estratégia de armazenamento.
 */
export interface CreateFotoDTO {
  plantaId: string;
  caminhoArquivo: string;
  descricao?: string;
}

/**
 * DTO para a atualização dos dados de uma foto.
 * Reflete o `updateFotoSchema` do backend.
 */
export type UpdateFotoDTO = Partial<CreateFotoDTO>;

/**
 * Busca todas as fotos de uma planta específica.
 * Corresponde ao endpoint GET /api/fotos/planta/:plantaId
 */
const getFotosPorPlanta = async (plantaId: string): Promise<Foto[]> => {
  const response = await api.get(`/fotos/planta/${plantaId}`);
  return response.data;
};

/**
 * Faz o upload dos dados de uma nova foto.
 * Corresponde ao endpoint POST /api/fotos
 */
const createFoto = async (data: CreateFotoDTO): Promise<Foto> => {
  // Nota: O upload real do arquivo de imagem geralmente é um processo multipart/form-data.
  // Por agora, este serviço apenas envia os metadados. A lógica de upload de ficheiro
  // será adicionada diretamente na tela que utilizar esta função.
  const response = await api.post('/fotos', data);
  return response.data;
};

/**
 * Atualiza a descrição ou a planta associada a uma foto.
 * Corresponde ao endpoint PUT /api/fotos/:id
 */
const updateFoto = async (id: string, data: UpdateFotoDTO): Promise<Foto> => {
  const response = await api.put(`/fotos/${id}`, data);
  return response.data;
};

/**
 * Deleta uma foto.
 * Corresponde ao endpoint DELETE /api/fotos/:id
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