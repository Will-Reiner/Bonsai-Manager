import { ConclusaoRepository, RegistrarCuidadosDTO } from '../agenda.types';
import { reconciliar } from '../dominio/reconciliar';
import { remarcarRevisoes } from '../dominio/rotina';
import { planejarRotinas } from './planejar-rotinas';
import { planejarSeguimento } from './planejar-seguimento';

/** Folga para o fuso do aparelho: registra o que já foi feito, não o futuro. */
const FOLGA_FUTURO_MS = 86_400_000;

/** Registra cuidados já feitos (com fotos) em várias plantas, conclui as pendentes escolhidas e agenda o que vem depois. */
export class RegistrarCuidadosUseCase {
  constructor(private repo: ConclusaoRepository) {}

  async execute(dto: RegistrarCuidadosDTO, usuarioId: string) {
    const plantas = dto.plantas.map((p) => p.plantaId);
    if (new Set(plantas).size !== plantas.length) throw new Error('Plantas repetidas na lista.');
    if (dto.plantas.some((p) => !p.atividadeIds.length)) throw new Error('Informe ao menos um cuidado por planta.');
    if (new Date(dto.data).getTime() > Date.now() + FOLGA_FUTURO_MS) throw new Error('A data não pode ser no futuro.');

    if ((await this.repo.contarPlantasDoUsuario(plantas, usuarioId)) !== plantas.length) {
      throw new Error('Acesso negado. A planta não pertence a si.');
    }

    const proximos = dto.proximos ?? [];
    const atividadeIds = [...new Set([...dto.plantas.flatMap((p) => p.atividadeIds), ...proximos.map((p) => p.atividadeId)])];
    if (!(await this.repo.atividadesExistem(atividadeIds))) throw new Error('Atividade não encontrada.');

    const data = new Date(dto.data);
    const cuidados = dto.plantas.map((p) => ({
      plantaId: p.plantaId,
      atividadeIds: [...new Set(p.atividadeIds)],
      detalhes: p.detalhes,
      observacaoFutura: p.observacaoFutura,
      fotos: (p.fotos ?? []).map((f) => ({
        caminhoArquivo: f.caminhoArquivo,
        dataCaptura: f.dataCaptura ? new Date(f.dataCaptura) : data,
      })),
    }));

    const concluirIds = [...new Set(dto.concluirAgendaIds ?? [])];
    const pendentes = concluirIds.length ? await this.repo.findPendentesParaReconciliar(concluirIds, usuarioId) : [];
    if (pendentes.length !== concluirIds.length) throw new Error('Acesso negado ou agendamento não encontrado.');
    const { absorver, cancelar } = reconciliar(cuidados, pendentes);

    // Pendentes concluídas/canceladas aqui avançam a rotina; qualquer cuidado remarca a Revisão geral
    const rotinas = await planejarRotinas(this.repo, pendentes.map((p) => ({ rotinaId: p.rotinaId, data })), concluirIds);
    const seguimento = planejarSeguimento(plantas, proximos);
    const revisoes = remarcarRevisoes(await this.repo.revisoesDasPlantas(plantas, concluirIds), data);

    return this.repo.registrar({
      usuarioId,
      data,
      cuidados,
      absorver,
      cancelar,
      ...seguimento,
      criarPendentes: [...seguimento.criarPendentes, ...rotinas, ...revisoes.criar],
      moverPendentes: revisoes.mover,
    });
  }
}
