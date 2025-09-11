import api from '../api';
import { AtividadeRecursoNecessario, TipoRecurso } from '../types';

/**
 * Busca todos os tipos de recursos necessários para uma atividade específica.
 * Corresponde ao endpoint GET /api/atividades-recursos/atividade/:atividadeId
 */
const getRecursosPorAtividade = async (atividadeId: string): Promise<TipoRecurso[]> => {
  const response = await api.get(`/atividades-recursos/atividade/${atividadeId}`);
  // A API retorna a associação, mas queremos apenas o objeto tipoRecurso
  return response.data.map((item: AtividadeRecursoNecessario) => item.tipoRecurso);
};

/**
 * Associa um tipo de recurso a uma atividade.
 * Corresponde ao endpoint POST /api/atividades-recursos
 */
const associarRecursoAtividade = async (atividadeId: string, tipoRecursoId: string): Promise<AtividadeRecursoNecessario> => {
    const response = await api.post('/atividades-recursos', { atividadeId, tipoRecursoId });
    return response.data;
}

/**
 * Remove a associação entre uma atividade e um tipo de recurso.
 * Corresponde ao endpoint DELETE /api/atividades-recursos/:atividadeId/:tipoRecursoId
 */
const desassociarRecursoAtividade = async (atividadeId: string, tipoRecursoId: string): Promise<void> => {
    await api.delete(`/atividades-recursos/${atividadeId}/${tipoRecursoId}`);
}


export const atividadeRecursoService = {
  getRecursosPorAtividade,
  associarRecursoAtividade,
  desassociarRecursoAtividade,
};