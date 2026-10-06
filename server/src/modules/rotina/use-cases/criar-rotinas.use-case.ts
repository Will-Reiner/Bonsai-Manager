import { DIA_MS } from '../../agenda/dominio/rotina';
import { CriarRotinasDTO, RotinaRepository } from '../rotina.types';

export const MAX_ROTINAS_LOTE = 200;

/** Cria a mesma rotina em várias plantas (uma por planta+atividade); pares que já têm rotina voltam em `conflitos`. */
export class CriarRotinasUseCase {
  constructor(private repo: RotinaRepository) {}

  async execute(dto: CriarRotinasDTO, usuarioId: string) {
    const plantaIds = [...new Set(dto.plantaIds)];
    const atividadeIds = [...new Set(dto.atividadeIds)];
    if (plantaIds.length * atividadeIds.length > MAX_ROTINAS_LOTE) throw new Error('Máximo de 200 rotinas por vez.');

    if ((await this.repo.contarPlantasDoUsuario(plantaIds, usuarioId)) !== plantaIds.length) {
      throw new Error('Acesso negado. A planta não pertence a si.');
    }
    if (!(await this.repo.atividadesExistem(atividadeIds))) throw new Error('Atividade não encontrada.');

    const primeiraData = dto.primeiraData ? new Date(dto.primeiraData) : new Date(Date.now() + dto.intervaloDias * DIA_MS);
    const dataFim = dto.dataFim ? new Date(dto.dataFim) : null;
    if (dataFim && dataFim < primeiraData) throw new Error('A data final é antes da primeira tarefa.');

    const conflitos = await this.repo.existentes(plantaIds, atividadeIds);
    const ocupado = new Set(conflitos.map((c) => `${c.plantaId}|${c.atividadeId}`));
    const detalhes = dto.detalhes?.trim() || undefined;

    const estacoes = [...new Set(dto.estacoes ?? [])];

    const novas = plantaIds.flatMap((plantaId) =>
      atividadeIds
        .filter((atividadeId) => !ocupado.has(`${plantaId}|${atividadeId}`))
        .map((atividadeId) => ({ plantaId, atividadeId, intervaloDias: dto.intervaloDias, dataFim, estacoes, primeiraData, detalhes })),
    );
    const criadas = novas.length ? await this.repo.criar(novas) : [];
    return { criadas, conflitos };
  }
}
