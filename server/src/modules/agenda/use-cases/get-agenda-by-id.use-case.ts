import { AgendaRepository } from '../agenda.types';

export class GetAgendaByIdUseCase {
  constructor(private agendaRepository: AgendaRepository) {}

  async execute(id: string, usuarioId: string): Promise<any> {
    const agenda = await this.agendaRepository.findByIdAndUser(id, usuarioId);

    if (!agenda) {
      throw new Error('Agendamento não encontrado.');
    }

    return agenda;
  }
}
