import api from '../api';
import { Especie, TipoPlanta } from '../types';

/**
 * DTO para criar uma nova espécie, agora com todos os campos da enciclopédia.
 */
export interface CreateEspecieDTO {
  nomeCientifico?: string;
  nomeComum?: string;
  familia?: string;
  origem?: string;
  tipoDePlanta?: TipoPlanta;
  folhas?: string;
  tronco?: string;
  flores?: string;
  frutos?: string;
  raizes?: string;
  luminosidade?: string;
  rega?: string;
  substratoIdeal?: string;
  adubacao?: string;
  clima?: string;
  problemasComuns?: string;
  pros?: string;
  contras?: string;
  linhasDeRaciocinio?: string;
  observacoes?: string;
}

/**
 * Busca todas as espécies disponíveis na base de dados.
 */
const getAllEspecies = async (): Promise<Especie[]> => {
  const response = await api.get('/especies');
  return response.data;
};

/**
 * Busca uma espécie específica pelo seu ID.
 */
const getEspecieById = async (id: string): Promise<Especie> => {
  const response = await api.get(`/especies/${id}`);
  return response.data;
};

/**
 * Busca espécies com status SUGERIDO (requer admin).
 */
const getEspeciesSugeridas = async (): Promise<Especie[]> => {
  const response = await api.get('/especies/sugeridas');
  return response.data;
};

/**
 * Cria uma nova espécie (requer autenticação).
 */
const createEspecie = async (data: CreateEspecieDTO): Promise<Especie> => {
    const response = await api.post('/especies', data);
    return response.data;
}

/**
 * Atualiza os dados de uma espécie existente (requer autenticação).
 */
const updateEspecie = async (id: string, data: Partial<CreateEspecieDTO> & { status?: string }): Promise<Especie> => {
  const response = await api.put(`/especies/${id}`, data);
  return response.data;
};

/**
 * Aprova uma espécie sugerida, alterando seu status para VERIFICADO.
 */
const aprovarEspecie = async (id: string): Promise<Especie> => {
  const response = await api.put(`/especies/${id}`, { status: 'VERIFICADO' });
  return response.data;
};

/**
 * Deleta uma espécie (requer autenticação de Admin).
 */
const deleteEspecie = async (id: string): Promise<void> => {
  await api.delete(`/especies/${id}`);
};

export const especieService = {
  getAllEspecies,
  getEspecieById,
  getEspeciesSugeridas,
  createEspecie,
  updateEspecie,
  aprovarEspecie,
  deleteEspecie,
};
