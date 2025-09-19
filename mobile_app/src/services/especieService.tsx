import api from '../api';
import { Especie, TipoPlanta } from '../types';

/**
 * DTO para criar uma nova espécie, agora com todos os campos da enciclopédia.
 */
export interface CreateEspecieDTO {
  nomeCientifico: string;
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
 * Cria uma nova espécie (requer autenticação de Admin).
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