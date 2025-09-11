import api from '../api';
import { RegistroHistorico } from '../types';

/**
 * DTO para criar um novo registo no histórico.
 * Reflete o `createHistoricoSchema` do backend.
 */
export interface CreateHistoricoDTO {
  plantaId: string;
  dataRealizacao: string; // Formato 'YYYY-MM-DDTHH:mm:ss.sssZ'
  atividadeRealizada: string;
  recursosUtilizados?: string;
  detalhes?: string;
  observacaoFutura?: string;
}

/**
 * DTO para atualizar um registo do histórico.
 * Reflete o `updateHistoricoSchema` do backend.
 */
export type UpdateHistoricoDTO = Partial<Omit<CreateHistoricoDTO, 'plantaId'>>;


/**
 * Busca todos os registos de histórico para uma planta específica.
 * Corresponde ao endpoint GET /api/historicos/planta/:plantaId
 */
const getHistoricoPorPlanta = async (plantaId: string): Promise<RegistroHistorico[]> => {
  const response = await api.get(`/historicos/planta/${plantaId}`);
  return response.data;
};

/**
 * Cria um novo registo de histórico para uma planta.
 * Corresponde ao endpoint POST /api/historicos
 */
const createRegistroHistorico = async (data: CreateHistoricoDTO): Promise<RegistroHistorico> => {
  const response = await api.post('/historicos', data);
  return response.data;
};

/**
 * Atualiza um registo de histórico específico.
 * Corresponde ao endpoint PUT /api/historicos/:id
 */
const updateRegistroHistorico = async (id: string, data: UpdateHistoricoDTO): Promise<RegistroHistorico> => {
  const response = await api.put(`/historicos/${id}`, data);
  return response.data;
};

/**
 * Deleta um registo de histórico.
 * Corresponde ao endpoint DELETE /api/historicos/:id
 */
const deleteRegistroHistorico = async (id: string): Promise<void> => {
  await api.delete(`/historicos/${id}`);
};

export const historicoService = {
  getHistoricoPorPlanta,
  createRegistroHistorico,
  updateRegistroHistorico,
  deleteRegistroHistorico,
};