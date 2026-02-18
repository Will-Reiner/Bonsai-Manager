import api from '../api';
import { Foto } from '../types';

/**
 * DTO para o upload de uma nova foto.
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
 * Faz o upload de uma imagem e cria o registo no servidor.
 * Envia o arquivo via multipart/form-data.
 */
const uploadFoto = async (
  imageUri: string,
  plantaId?: string,
  titulo?: string,
): Promise<Foto> => {
  const formData = new FormData();

  // Extrair extensão e definir tipo MIME
  const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  formData.append('foto', {
    uri: imageUri,
    name: `foto.${ext}`,
    type: mimeType,
  } as any);

  if (plantaId) formData.append('plantaId', plantaId);
  if (titulo) formData.append('titulo', titulo);

  const response = await api.post('/fotos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Cria um registo de foto apenas com metadados (sem upload de arquivo).
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
  uploadFoto,
  createFoto,
  updateFoto,
  deleteFoto,
};
