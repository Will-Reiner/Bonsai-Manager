import { CuidadoRepository } from '../agenda.types';

/** Valida que as tarefas são do usuário, concluídas e da mesma planta; devolve a planta. */
export async function plantaDoCuidado(repo: CuidadoRepository, ids: string[], usuarioId: string): Promise<string> {
  const agendas = await repo.findDoUsuario(ids, usuarioId);
  if (agendas.length !== ids.length) throw new Error('Acesso negado ou agendamento não encontrado.');
  if (agendas.some((a) => a.status !== 'CONCLUIDO')) throw new Error('O cuidado precisa estar concluído.');
  if (new Set(agendas.map((a) => a.plantaId)).size !== 1) throw new Error('As tarefas precisam ser da mesma planta.');
  return agendas[0].plantaId;
}
