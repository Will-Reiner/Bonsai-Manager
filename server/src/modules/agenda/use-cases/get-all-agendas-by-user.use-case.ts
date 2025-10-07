import { AgendaRepository } from '../agenda.types';

export class GetAllAgendasByUserUseCase {
  constructor(private agendaRepository: AgendaRepository) {}

  async execute(usuarioId: string) {
    return await this.agendaRepository.findManyByUser(usuarioId);
  }
}