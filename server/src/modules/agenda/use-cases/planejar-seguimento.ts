import { ConclusaoRepository, NovaPendente, NovaRotinaDePasso, Proximo } from '../agenda.types';

const DIA = 86_400_000;
/** Folga além do intervalo da revisão: uma pendente até N + 30 dias já "cuida" da planta. */
const MARGEM_REVISAO_DIAS = 30;

export interface Seguimento {
  criarPendentes: NovaPendente[];
  criarRotinas: NovaRotinaDePasso[];
  revisoes: { plantaId: string; dataAgendada: Date }[];
}

/** O que vem depois de um cuidado: os próximos passos informados ou, sem eles, a Revisão geral automática. */
export async function planejarSeguimento(
  repo: Pick<ConclusaoRepository, 'getRevisaoDias' | 'proximasPendentes'>,
  {
    usuarioId,
    plantas,
    proximos,
    excluir,
    jaAgendadas = [],
  }: {
    usuarioId: string;
    plantas: string[];
    proximos: Proximo[];
    excluir: string[];
    /** Pendentes que serão criadas junto (ex.: próxima da rotina): contam como próxima tarefa. */
    jaAgendadas?: { plantaId: string; dataAgendada: Date }[];
  },
): Promise<Seguimento> {
  const criarPendentes = plantas.flatMap((plantaId) =>
    proximos
      .filter((p) => !p.repetir)
      .map((p) => ({ plantaId, atividadeId: p.atividadeId, dataAgendada: new Date(p.dataAgendada) })),
  );
  const criarRotinas = plantas.flatMap((plantaId) =>
    proximos.flatMap((p) =>
      p.repetir
        ? [
            {
              plantaId,
              atividadeId: p.atividadeId,
              intervaloDias: p.repetir.intervaloDias,
              dataFim: p.repetir.dataFim ? new Date(p.repetir.dataFim) : null,
              estacoes: p.repetir.estacoes ?? [],
              dataAgendada: new Date(p.dataAgendada),
            },
          ]
        : [],
    ),
  );
  const revisoes: Seguimento['revisoes'] = [];

  if (proximos.length === 0) {
    const dias = await repo.getRevisaoDias(usuarioId);
    if (dias > 0) {
      const agora = new Date();
      const limite = agora.getTime() + (dias + MARGEM_REVISAO_DIAS) * DIA;
      const proximas = await repo.proximasPendentes(plantas, agora, excluir);
      for (const j of jaAgendadas) {
        if (j.dataAgendada < agora) continue;
        const atual = proximas.get(j.plantaId);
        if (!atual || j.dataAgendada < atual) proximas.set(j.plantaId, j.dataAgendada);
      }
      for (const plantaId of plantas) {
        const proxima = proximas.get(plantaId);
        if (proxima && proxima.getTime() <= limite) continue;
        revisoes.push({ plantaId, dataAgendada: new Date(agora.getTime() + dias * DIA) });
      }
    }
  }

  return { criarPendentes, criarRotinas, revisoes };
}
