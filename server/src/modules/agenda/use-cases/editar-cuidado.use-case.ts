import { CuidadoRepository, EditarCuidadoDTO } from '../agenda.types';
import { ReavaliadorDeGrupos } from '../../planta/use-cases/reavaliar-grupos';
import { plantaDoCuidado } from './cuidado-do-dia';

/** Folga para o fuso do aparelho (mesma do registrar). */
const FOLGA_FUTURO_MS = 86_400_000;

/** Edita o cuidado do dia: data, textos e tarefas tiradas, numa transação; reavalia o grupo da planta. */
export class EditarCuidadoUseCase {
  constructor(
    private repo: CuidadoRepository,
    private reavaliar: ReavaliadorDeGrupos,
  ) {}

  async execute(dto: EditarCuidadoDTO, usuarioId: string) {
    const ids = [...new Set(dto.agendaIds)];
    const remover = [...new Set(dto.removerAgendaIds ?? [])];
    const textos = dto.textos ?? [];
    if (remover.some((id) => !ids.includes(id))) throw new Error('Tarefa fora do cuidado.');
    if (textos.some((t) => !ids.includes(t.agendaId) || remover.includes(t.agendaId))) throw new Error('Tarefa fora do cuidado.');
    if (remover.length >= ids.length) throw new Error('Para tirar todas as tarefas, exclua o cuidado.');
    if (dto.dataConcluida && new Date(dto.dataConcluida).getTime() > Date.now() + FOLGA_FUTURO_MS) {
      throw new Error('A data não pode ser no futuro.');
    }

    const plantaId = await plantaDoCuidado(this.repo, ids, usuarioId);
    return this.repo.editar(
      {
        manter: ids.filter((id) => !remover.includes(id)),
        remover,
        dataConcluida: dto.dataConcluida ? new Date(dto.dataConcluida) : undefined,
        textos,
      },
      (db) => this.reavaliar.execute([plantaId], usuarioId, db),
    );
  }
}
