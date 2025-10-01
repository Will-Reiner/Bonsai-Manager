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


export const atividadeService = {
  getAllAtividades,
  getAtividadeById,
  createAtividade,
};