import api from '../api';
import { Agenda, AgendaStatus } from '../types';

/**
 * DTO para a criação de um novo agendamento.
 * Reflete o `createAgendaSchema` do backend.
 */
export interface CreateAgendaDTO {
  plantaId: string;
  atividadeId: string;
  dataAgendada: string; // Formato 'YYYY-MM-DDTHH:mm:ss.sssZ'
  observacoes?: string;
}

/**
 * DTO para a atualização de um agendamento.
 * Reflete o `updateAgendaSchema` do backend.
 */
export interface UpdateAgendaDTO {
  dataAgendada?: string;
  dataConcluida?: string | null;
  status?: AgendaStatus;
  observacoes?: string;
}

/**
 * Busca todos os agendamentos do utilizador autenticado.
 * A API retorna os agendamentos com informações da planta e da atividade.
 * Corresponde ao endpoint GET /api/agendas
 */
const getMinhaAgenda = async (): Promise<Agenda[]> => {
  const response = await api.get('/agendas');
  return response.data;
};

/**
 * Cria um novo agendamento para uma planta do utilizador.
 * Corresponde ao endpoint POST /api/agendas
 */
const createAgendamento = async (data: CreateAgendaDTO): Promise<Agenda> => {
  const response = await api.post('/agendas', data);
  return response.data;
};

/**
 * Atualiza um agendamento existente.
 * Corresponde ao endpoint PUT /api/agendas/:id
 */
const updateAgendamento = async (id: string, data: UpdateAgendaDTO): Promise<Agenda> => {
  const response = await api.put(`/agendas/${id}`, data);
  return response.data;
};

/**
 * Deleta um agendamento.
 * Corresponde ao endpoint DELETE /api/agendas/:id
 */
const deleteAgendamento = async (id: string): Promise<void> => {
  await api.delete(`/agendas/${id}`);
};

export const agendaService = {
  getMinhaAgenda,
  createAgendamento,
  updateAgendamento,
  deleteAgendamento,
};