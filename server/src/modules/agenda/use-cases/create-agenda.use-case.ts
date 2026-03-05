import { CreateAgendaDTO, AgendaRepository } from '../agenda.types';

export class CreateAgendaUseCase {
  constructor(private agendaRepository: AgendaRepository) {}

  async execute(data: CreateAgendaDTO, usuarioId: string) {
    // Verifica se a planta pertence ao usuário
    const plantaBelongsToUser = await this.agendaRepository.checkPlantaBelongsToUser(data.plantaId, usuarioId);
    
    if (!plantaBelongsToUser) {
      throw new Error('Acesso negado. A planta não pertence a si.');
    }

    return await this.agendaRepository.create(data);
  }
}