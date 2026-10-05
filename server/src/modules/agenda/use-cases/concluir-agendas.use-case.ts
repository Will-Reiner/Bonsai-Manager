import { ConclusaoRepository, ConcluirAgendasDTO, PlanoConclusao } from '../agenda.types';

const DIA = 86_400_000;
/** Folga além do intervalo da revisão: uma pendente até N + 30 dias já "cuida" da planta. */
const MARGEM_REVISAO_DIAS = 30;

/** Conclui uma ou várias tarefas e agenda o que vem depois (próximos passos ou Revisão geral). */
export class ConcluirAgendasUseCase {
  constructor(private repo: ConclusaoRepository) {}

  async execute(dto: ConcluirAgendasDTO, usuarioId: string) {
    const ids = [...new Set(dto.itens.map((i) => i.agendaId))];
    const pendentes = await this.repo.findPendentesDoUsuario(ids, usuarioId);
    if (pendentes.length !== ids.length) {
      throw new Error('Acesso negado ou agendamento não encontrado.');
    }

    const extras = dto.extras ?? [];
    const proximos = dto.proximos ?? [];
    const atividadeIds = [
      ...new Set([dto.atividadeId, ...extras, ...proximos.map((p) => p.atividadeId)].filter((x): x is string => !!x)),
    ];
    if (atividadeIds.length && !(await this.repo.atividadesExistem(atividadeIds))) {
      throw new Error('Atividade não encontrada.');
    }

    const dataConcluida = new Date(dto.dataConcluida);
    const plantaDe = new Map(pendentes.map((p) => [p.id, p.plantaId]));
    const plantas = [...new Set(pendentes.map((p) => p.plantaId))];

    const plano: PlanoConclusao = {
      usuarioId,
      dataConcluida,
      atualizacoes: dto.itens.map((i) => ({
        agendaId: i.agendaId,
        atividadeId: dto.atividadeId,
        detalhes: i.detalhes ?? dto.detalhes,
        observacaoFutura: i.observacaoFutura ?? dto.observacaoFutura,
      })),
      fotos: dto.itens.flatMap((i) =>
        (i.fotos ?? []).map((caminhoArquivo) => ({
          agendaId: i.agendaId,
          plantaId: plantaDe.get(i.agendaId)!,
          caminhoArquivo,
        })),
      ),
      criarConcluidas: plantas.flatMap((plantaId) =>
        extras.map((atividadeId) => ({ plantaId, atividadeId, data: dataConcluida, detalhes: dto.detalhes })),
      ),
      criarPendentes: plantas.flatMap((plantaId) =>
        proximos.map((p) => ({ plantaId, atividadeId: p.atividadeId, dataAgendada: new Date(p.dataAgendada) })),
      ),
      revisoes: [],
    };

    if (proximos.length === 0) {
      const dias = await this.repo.getRevisaoDias(usuarioId);
      if (dias > 0) {
        const agora = new Date();
        const limite = agora.getTime() + (dias + MARGEM_REVISAO_DIAS) * DIA;
        for (const plantaId of plantas) {
          const proxima = await this.repo.proximaPendente(plantaId, agora, ids);
          if (proxima && proxima.getTime() <= limite) continue;
          plano.revisoes.push({ plantaId, dataAgendada: new Date(agora.getTime() + dias * DIA) });
        }
      }
    }

    return this.repo.executar(plano);
  }
}
