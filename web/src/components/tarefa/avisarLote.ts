import { errorMessage } from '@/lib/api';
import { textoResultadoLote, type ResultadoLote } from '@/lib/tarefasDaPlanta';

/** Toast do resultado de um lote: tudo ok, parcial (erro) ou nenhuma (mensagem do erro). */
export function avisarLote(
  toast: (texto: string, tipo?: 'success' | 'error') => void,
  r: ResultadoLote<unknown>,
  acao: 'reagendada' | 'excluída',
) {
  if (!r.feitos.length) toast(errorMessage(r.erro), 'error');
  else toast(textoResultadoLote(r.feitos.length, r.total, acao), r.feitos.length < r.total ? 'error' : 'success');
}
