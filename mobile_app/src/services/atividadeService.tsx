import api from '../api';
import { Atividade } from '../types';

/**
 * DTO para a criação de uma nova atividade.
 * Reflete o `createAtividadeSchema` do backend.
 */
export interface CreateAtividadeDTO {
  nome: string;
  descricao?: string;
}

/**
 * Busca todas as atividades de cuidado disponíveis.
 * Este é um endpoint público.
 * Corresponde ao endpoint GET /api/atividades
 */
const getAllAtividades = async (): Promise<Atividade[]> => {
  const response = await api.get('/atividades');
  return response.data;
};

/**
 * Busca uma atividade específica pelo seu ID.
 * Este é um endpoint público.
 * Corresponde ao endpoint GET /api/atividades/:id
 */
const getAtividadeById = async (id: string): Promise<Atividade> => {
  const response = await api.get(`/atividades/${id}`);
  return response.data;
};

/**
 * Cria uma nova atividade no sistema (requer autenticação).
 * Corresponde ao endpoint POST /api/atividades
 */
const createAtividade = async (data: CreateAtividadeDTO): Promise<Atividade> => {
  const response = await api.post('/atividades', data);
  return response.data;
};


export const atividadeService = {
  getAllAtividades,
  getAtividadeById,
  createAtividade,
};