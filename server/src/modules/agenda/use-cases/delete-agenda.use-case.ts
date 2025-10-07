import { AgendaRepository } from '../agenda.types';

export class DeleteAgendaUseCase {
  constructor(private agendaRepository: AgendaRepository) {}

  async execute(id: string, usuarioId: string): Promise<void> {
    const exists = await this.agendaRepository.existsByIdAndUser(id, usuarioId);
    
    if (!exists) {
      throw new Error('Acesso negado ou agendamento não encontrado.');
    }

    await this.agendaRepository.delete(id);
  }
}