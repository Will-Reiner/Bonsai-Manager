import api from '../api';
// Agora importamos os DTOs, além dos tipos principais
import { Agenda, CreateAgendaDTO, UpdateAgendaDTO } from '../types';

// Re-exportamos os DTOs para facilitar o uso
export type { CreateAgendaDTO, UpdateAgendaDTO };

/**
 * Busca todos os agendamentos do utilizador autenticado.
 */
const getMinhaAgenda = async (): Promise<Agenda[]> => {
  const response = await api.get('/agendas');
  return response.data;
};

/**
 * Cria um novo agendamento.
 */
const createAgendamento = async (data: CreateAgendaDTO): Promise<Agenda> => {
  const response = await api.post('/agendas', data);
  return response.data;
};

/**
 * Atualiza um agendamento existente (incluindo a sua conclusão).
 */
const updateAgendamento = async (id: string, data: UpdateAgendaDTO): Promise<Agenda> => {
  const response = await api.put(`/agendas/${id}`, data);
  return response.data;
};

/**
 * Deleta um agendamento.
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