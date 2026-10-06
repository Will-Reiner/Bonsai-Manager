import { ConclusaoRepository, ConcluirAgendasDTO, PlanoConclusao } from '../agenda.types';
import { planejarRotinas } from './planejar-rotinas';
import { planejarSeguimento } from './planejar-seguimento';

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

    // Tarefa de rotina concluída como outra atividade sai da rotina; a rotina segue a partir de hoje (como um "pular")
    const desvinculadas = new Set(
      pendentes.filter((p) => p.rotinaId && dto.atividadeId && dto.atividadeId !== p.atividadeId).map((p) => p.id),
    );
    const hoje = new Date();
    const rotinas = await planejarRotinas(
      this.repo,
      pendentes.map((p) => ({ rotinaId: p.rotinaId, data: desvinculadas.has(p.id) ? hoje : dataConcluida })),
      ids,
    );
    const seguimento = await planejarSeguimento(this.repo, { usuarioId, plantas, proximos, excluir: ids, jaAgendadas: rotinas });
    const plano: PlanoConclusao = {
      usuarioId,
      dataConcluida,
      atualizacoes: dto.itens.map((i) => ({
        agendaId: i.agendaId,
        atividadeId: dto.atividadeId,
        detalhes: i.detalhes ?? dto.detalhes,
        observacaoFutura: i.observacaoFutura ?? dto.observacaoFutura,
        ...(desvinculadas.has(i.agendaId) ? { desvincularRotina: true } : {}),
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
      ...seguimento,
      criarPendentes: [...seguimento.criarPendentes, ...rotinas],
    };

    return this.repo.executar(plano);
  }
}
