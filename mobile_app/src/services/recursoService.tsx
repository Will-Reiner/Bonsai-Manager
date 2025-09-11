import api from '../api';
import { Recurso, RecursoStatus, TipoRecurso } from '../types';

// --- DTOs para Recursos ---

/**
 * DTO para a criação de um novo recurso no inventário do utilizador.
 * Reflete o `createRecursoSchema` do backend.
 */
export interface CreateRecursoDTO {
  tipoRecursoId: string;
  quantidadeDisponivel: number;
  unidadeMedida?: string;
  status?: RecursoStatus;
  observacoes?: string;
}

/**
 * DTO para a atualização de um recurso existente.
 * Reflete o `updateRecursoSchema` do backend.
 */
export type UpdateRecursoDTO = Partial<CreateRecursoDTO>;


// --- Funções do Serviço de Recursos ---

/**
 * Busca todos os recursos do inventário do utilizador autenticado.
 * Corresponde ao endpoint GET /api/recursos
 */
const getMeusRecursos = async (): Promise<Recurso[]> => {
  const response = await api.get('/recursos');
  return response.data;
};

/**
 * Adiciona um novo recurso ao inventário do utilizador.
 * Corresponde ao endpoint POST /api/recursos
 */
const createRecurso = async (data: CreateRecursoDTO): Promise<Recurso> => {
  const response = await api.post('/recursos', data);
  return response.data;
};

/**
 * Atualiza um recurso existente no inventário.
 * Corresponde ao endpoint PUT /api/recursos/:id
 */
const updateRecurso = async (id: string, data: UpdateRecursoDTO): Promise<Recurso> => {
  const response = await api.put(`/recursos/${id}`, data);
  return response.data;
};

/**
 * Deleta um recurso do inventário.
 * Corresponde ao endpoint DELETE /api/recursos/:id
 */
const deleteRecurso = async (id: string): Promise<void> => {
  await api.delete(`/recursos/${id}`);
};


// --- Funções do Serviço de Tipos de Recurso ---

/**
 * Busca todos os tipos de recurso disponíveis no sistema.
 * Endpoint público.
 * Corresponde ao endpoint GET /api/tipos-recurso
 */
const getAllTiposRecurso = async (): Promise<TipoRecurso[]> => {
    const response = await api.get('/tipos-recurso');
    return response.data;
}


export const recursoService = {
  getMeusRecursos,
  createRecurso,
  updateRecurso,
  deleteRecurso,
  getAllTiposRecurso,
};