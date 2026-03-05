import { UpdateAgendaDTO, AgendaRepository } from '../agenda.types';

export class UpdateAgendaUseCase {
  constructor(private agendaRepository: AgendaRepository) {}

  async execute(id: string, data: UpdateAgendaDTO, usuarioId: string) {
    const exists = await this.agendaRepository.existsByIdAndUser(id, usuarioId);
    
    if (!exists) {
      throw new Error('Acesso negado ou agendamento não encontrado.');
    }

    // Se há recursos utilizados, usa o método com transação
    if (data.recursosUtilizados && data.recursosUtilizados.length > 0) {
      return await this.agendaRepository.updateWithResources(id, data);
    }

    // Caso contrário, usa o método simples
    const { recursosUtilizados, ...updateData } = data;
    return await this.agendaRepository.update(id, updateData);
  }
}