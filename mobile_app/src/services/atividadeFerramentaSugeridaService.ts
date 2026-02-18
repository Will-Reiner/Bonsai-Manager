import api from '../api';
import { AtividadeFerramentaSugerida } from '../types';

const getByAtividade = async (atividadeId: string): Promise<AtividadeFerramentaSugerida[]> => {
  const response = await api.get(`/atividades-ferramentas-sugeridas/atividade/${atividadeId}`);
  return response.data;
};

export const atividadeFerramentaSugeridaService = {
  getByAtividade,
};
