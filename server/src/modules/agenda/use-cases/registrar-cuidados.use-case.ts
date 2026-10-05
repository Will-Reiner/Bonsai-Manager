import { ConclusaoRepository, RegistrarCuidadosDTO } from '../agenda.types';
import { planejarSeguimento } from './planejar-seguimento';

/** Folga para o fuso do aparelho: registra o que já foi feito, não o futuro. */
const FOLGA_FUTURO_MS = 86_400_000;

/** Registra cuidados já feitos (com fotos) em várias plantas e agenda o que vem depois. */
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
    const seguimento = await planejarSeguimento(this.repo, { usuarioId, plantas, proximos, excluir: [] });

    return this.repo.registrar({
      usuarioId,
      data,
      cuidados: dto.plantas.map((p) => ({
        plantaId: p.plantaId,
        atividadeIds: [...new Set(p.atividadeIds)],
        detalhes: p.detalhes,
        observacaoFutura: p.observacaoFutura,
        fotos: (p.fotos ?? []).map((f) => ({
          caminhoArquivo: f.caminhoArquivo,
          dataCaptura: f.dataCaptura ? new Date(f.dataCaptura) : data,
        })),
      })),
      ...seguimento,
    });
  }
}
