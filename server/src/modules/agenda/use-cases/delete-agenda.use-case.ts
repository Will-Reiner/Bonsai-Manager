import { AgendaRepository } from '../agenda.types';
import { ReavaliadorDeGrupos } from '../../planta/use-cases/reavaliar-grupos';

export class DeleteAgendaUseCase {
  constructor(
    private agendaRepository: AgendaRepository,
    private reavaliar: ReavaliadorDeGrupos,
  ) {}

  async execute(id: string, usuarioId: string): Promise<void> {
    const agenda = await this.agendaRepository.findByIdAndUser(id, usuarioId);

    if (!agenda) {
      throw new Error('Acesso negado ou agendamento não encontrado.');
    }

    await this.agendaRepository.delete(id);
    // Apagar o Transplante que pôs a planta em Recém transplantada a tira de lá
    await this.reavaliar.execute([agenda.plantaId], usuarioId);
  }
}
