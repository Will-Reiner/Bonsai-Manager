import api from '../api';
import { Recurso, UnidadeMedida, TipoRecurso } from '../types';

// --- DTOs para Recursos ---

/**
 * DTO para a criação de um novo recurso no inventário do utilizador.
 */
export interface CreateRecursoDTO {
  tipoRecursoId: string;
  quantidadeDisponivel: number;
  unidadeMedida?: UnidadeMedida;
  observacoes?: string;
}

export interface CreateTipoRecursoDTO {
    nome: string;
}

/**
 * DTO para a atualização de um recurso existente.
 */
export type UpdateRecursoDTO = Partial<CreateRecursoDTO>;


// --- Funções do Serviço de Recursos ---

/**
 * Busca todos os recursos do inventário do utilizador autenticado.
 */
const getMeusRecursos = async (): Promise<Recurso[]> => {
  const response = await api.get('/recursos');
  return response.data;
};

/**
 * Adiciona um novo recurso ao inventário do utilizador.
 */
const createRecurso = async (data: CreateRecursoDTO): Promise<Recurso> => {
  const response = await api.post('/recursos', data);
  return response.data;
};

/**
 * Atualiza um recurso existente no inventário.
 */
const updateRecurso = async (id: string, data: UpdateRecursoDTO): Promise<Recurso> => {
  const response = await api.put(`/recursos/${id}`, data);
  return response.data;
};

/**
 * Deleta um recurso do inventário.
 */
const deleteRecurso = async (id: string): Promise<void> => {
  await api.delete(`/recursos/${id}`);
};


// --- Funções do Serviço de Tipos de Recurso ---

/**
 * Busca todos os tipos de recurso disponíveis no sistema.
 */
const getAllTiposRecurso = async (): Promise<TipoRecurso[]> => {
    const response = await api.get('/tipos-recurso');
    return response.data;
}

const createTipoRecurso = async (data: CreateTipoRecursoDTO): Promise<TipoRecurso> => {
    const response = await api.post('/tipos-recurso', data);
    return response.data;
}

/**
 * Atualiza um tipo de recurso existente (requer autenticação de Admin).
 */
const updateTipoRecurso = async (id: string, data: CreateTipoRecursoDTO): Promise<TipoRecurso> => {
    const response = await api.put(`/tipos-recurso/${id}`, data);
    return response.data;
}

/**
 * Deleta um tipo de recurso (requer autenticação de Admin).
 */
const deleteTipoRecurso = async (id: string): Promise<void> => {
    await api.delete(`/tipos-recurso/${id}`);
}


export const recursoService = {
  getMeusRecursos,
  createRecurso,
  updateRecurso,
  deleteRecurso,
  getAllTiposRecurso,
  createTipoRecurso,
  updateTipoRecurso,
  deleteTipoRecurso,
};