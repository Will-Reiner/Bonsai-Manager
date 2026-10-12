import { CuidadoRepository } from '../agenda.types';
import { ReavaliadorDeGrupos } from '../../planta/use-cases/reavaliar-grupos';
import { plantaDoCuidado } from './cuidado-do-dia';

/** Apaga o cuidado do dia (as tarefas; fotos ficam na galeria) e reavalia o grupo da planta. */
export class ExcluirCuidadoUseCase {
  constructor(
    private repo: CuidadoRepository,
    private reavaliar: ReavaliadorDeGrupos,
  ) {}

  async execute(agendaIds: string[], usuarioId: string): Promise<void> {
    const ids = [...new Set(agendaIds)];
    const plantaId = await plantaDoCuidado(this.repo, ids, usuarioId);
    await this.repo.excluir(ids, (db) => this.reavaliar.execute({ plantaIds: [plantaId], agendaIds: ids }, usuarioId, db));
  }
}
