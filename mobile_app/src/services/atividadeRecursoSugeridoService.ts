import api from '../api';
import { AtividadeRecursoSugerido } from '../types';

const getByAtividade = async (atividadeId: string): Promise<AtividadeRecursoSugerido[]> => {
  const response = await api.get(`/atividades-recursos-sugeridos/atividade/${atividadeId}`);
  return response.data;
};

export const atividadeRecursoSugeridoService = {
  getByAtividade,
};
