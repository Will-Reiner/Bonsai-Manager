import api from '../api';
import { Planta } from '../types';

/**
 * DTO (Data Transfer Object) para a criação de uma nova planta.
 * Reflete o schema `createPlantaSchema` do backend.
 */
export interface CreatePlantaDTO {
  especieId: string;
  nome?: string;
  dataAquisicao?: string; // Formato 'YYYY-MM-DDTHH:mm:ss.sssZ'
  statusAtual?: string;
  visao?: string;
  objetivoAno?: string;
  dataProximoTransplante?: string; // Formato 'YYYY-MM-DDTHH:mm:ss.sssZ'
  prioridadeTransplante?: number;
  observacoes?: string;
}

/**
 * DTO (Data Transfer Object) para a atualização de uma planta existente.
 * Reflete o schema `updatePlantaSchema` do backend. Todos os campos são opcionais.
 */
export type UpdatePlantaDTO = Partial<CreatePlantaDTO>;

/**
 * Busca todas as plantas do usuário autenticado.
 * Corresponde ao endpoint GET /api/plantas
 */
const getMinhasPlantas = async (): Promise<Planta[]> => {
  const response = await api.get('/plantas');
  return response.data;
};

/**
 * Busca uma planta específica pelo seu ID.
 * Corresponde ao endpoint GET /api/plantas/:id
 */
const getPlantaById = async (id: string): Promise<Planta> => {
  const response = await api.get(`/plantas/${id}`);
  return response.data;
};

/**
 * Cria uma nova planta para o usuário autenticado.
 * Corresponde ao endpoint POST /api/plantas
 */
const createPlanta = async (data: CreatePlantaDTO): Promise<Planta> => {
  const response = await api.post('/plantas', data);
  return response.data;
};

/**
 * Atualiza os dados de uma planta existente.
 * Corresponde ao endpoint PUT /api/plantas/:id
 */
const updatePlanta = async (id: string, data: UpdatePlantaDTO): Promise<Planta> => {
  const response = await api.put(`/plantas/${id}`, data);
  return response.data;
};

/**
 * Deleta uma planta do usuário.
 * Corresponde ao endpoint DELETE /api/plantas/:id
 */
const deletePlanta = async (id: string): Promise<void> => {
  await api.delete(`/plantas/${id}`);
};

// Exportamos todas as funções em um único objeto para fácil importação
export const plantaService = {
  getMinhasPlantas,
  getPlantaById,
  createPlanta,
  updatePlanta,
  deletePlanta,
};