import api from '../api';
import { Especie } from '../types';

/**
 * Busca todas as espécies disponíveis na base de dados.
 * Endpoint público.
 * Corresponde ao endpoint GET /api/especies
 */
const getAllEspecies = async (): Promise<Especie[]> => {
  const response = await api.get('/especies');
  return response.data;
};

/**
 * Busca uma espécie específica pelo seu ID.
 * Endpoint público.
 * Corresponde ao endpoint GET /api/especies/:id
 */
const getEspecieById = async (id: string): Promise<Especie> => {
  const response = await api.get(`/especies/${id}`);
  return response.data;
};

// Nota: As funções de criar, atualizar e deletar espécies podem ser mais úteis
// numa futura área de administração do que no app do utilizador comum,
// mas é uma boa prática já deixá-las definidas.

/**
 * DTO para criar uma nova espécie.
 */
interface CreateEspecieDTO {
  nomeCientifico: string;
  nomeComum?: string;
  informacoesGerais?: string;
}

/**
 * Cria uma nova espécie (requer autenticação).
 * Corresponde ao endpoint POST /api/especies
 */
const createEspecie = async (data: CreateEspecieDTO): Promise<Especie> => {
    const response = await api.post('/especies', data);
    return response.data;
}

export const especieService = {
  getAllEspecies,
  getEspecieById,
  createEspecie,
};