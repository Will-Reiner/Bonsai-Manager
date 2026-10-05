import { ConclusaoRepository } from '../agenda.types';

const DIA = 86_400_000;
/** Folga além do intervalo da revisão: uma pendente até N + 30 dias já "cuida" da planta. */
const MARGEM_REVISAO_DIAS = 30;

export interface Seguimento {
  criarPendentes: { plantaId: string; atividadeId: string; dataAgendada: Date }[];
  revisoes: { plantaId: string; dataAgendada: Date }[];
}

/** O que vem depois de um cuidado: os próximos passos informados ou, sem eles, a Revisão geral automática. */
export async function planejarSeguimento(
  repo: Pick<ConclusaoRepository, 'getRevisaoDias' | 'proximaPendente'>,
  {
    usuarioId,
    plantas,
    proximos,
    excluir,
  }: { usuarioId: string; plantas: string[]; proximos: { atividadeId: string; dataAgendada: string }[]; excluir: string[] },
): Promise<Seguimento> {
  const criarPendentes = plantas.flatMap((plantaId) =>
    proximos.map((p) => ({ plantaId, atividadeId: p.atividadeId, dataAgendada: new Date(p.dataAgendada) })),
  );
  const revisoes: Seguimento['revisoes'] = [];

  if (proximos.length === 0) {
    const dias = await repo.getRevisaoDias(usuarioId);
    if (dias > 0) {
      const agora = new Date();
      const limite = agora.getTime() + (dias + MARGEM_REVISAO_DIAS) * DIA;
      for (const plantaId of plantas) {
        const proxima = await repo.proximaPendente(plantaId, agora, excluir);
        if (proxima && proxima.getTime() <= limite) continue;
        revisoes.push({ plantaId, dataAgendada: new Date(agora.getTime() + dias * DIA) });
      }
    }
  }

  return { criarPendentes, revisoes };
}
