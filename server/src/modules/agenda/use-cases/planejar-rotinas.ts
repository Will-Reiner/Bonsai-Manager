import { ConclusaoRepository } from '../agenda.types';
import { planejarProximas, ProximaDeRotina } from '../dominio/rotina';

/** Próximas das rotinas cujas tarefas acabaram de ser feitas (`excluir` = agendas sendo concluídas agora). */
export async function planejarRotinas(
  repo: Pick<ConclusaoRepository, 'estadoRotinas'>,
  feitas: { rotinaId: string | null; data: Date }[],
  excluir: string[],
): Promise<ProximaDeRotina[]> {
  const comRotina = feitas.filter((f): f is { rotinaId: string; data: Date } => !!f.rotinaId);
  if (!comRotina.length) return [];
  const estados = await repo.estadoRotinas([...new Set(comRotina.map((f) => f.rotinaId))], excluir);
  return planejarProximas(estados, comRotina);
}
