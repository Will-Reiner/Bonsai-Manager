import api from '../api';
import { Atividade } from '../types';

/**
 * DTO para a criação de uma nova atividade.
 */
export interface CreateAtividadeDTO {
  nome: string;
  descricao?: string;
  objetivos?: string;
  preparacao?: string;
  execucao?: string;
  cuidadosPosProcedimento?: string;
}

/**
 * Busca todas as atividades de cuidado disponíveis.
 */
const getAllAtividades = async (): Promise<Atividade[]> => {
  const response = await api.get('/atividades');
  return response.data;
};

/**
 * Busca uma atividade específica pelo seu ID.
 */
const getAtividadeById = async (id: string): Promise<Atividade> => {
  const response = await api.get(`/atividades/${id}`);
  return response.data;
};

/**
 * Cria uma nova atividade no sistema (requer autenticação de Admin).
 */
const createAtividade = async (data: CreateAtividadeDTO): Promise<Atividade> => {
  const response = await api.post('/atividades', data);
  return response.data;
};


/**
 * Atualiza os dados de uma atividade existente (requer autenticação de Admin).
 */
const updateAtividade = async (id: string, data: Partial<CreateAtividadeDTO>): Promise<Atividade> => {
  const response = await api.put(`/atividades/${id}`, data);
  return response.data;
};

/**
 * Deleta uma atividade (requer autenticação de Admin).
 */
const deleteAtividade = async (id: string): Promise<void> => {
  await api.delete(`/atividades/${id}`);
};

export const atividadeService = {
  getAllAtividades,
  getAtividadeById,
  createAtividade,
  updateAtividade,
  deleteAtividade,
};