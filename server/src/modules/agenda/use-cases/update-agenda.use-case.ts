import { UpdateAgendaDTO, AgendaRepository } from '../agenda.types';
import { ReavaliadorDeGrupos } from '../../planta/use-cases/reavaliar-grupos';

export class UpdateAgendaUseCase {
  constructor(
    private agendaRepository: AgendaRepository,
    private reavaliar: ReavaliadorDeGrupos,
  ) {}

  async execute(id: string, data: UpdateAgendaDTO, usuarioId: string) {
    const agenda = await this.agendaRepository.findByIdAndUser(id, usuarioId);

    if (!agenda) {
      throw new Error('Acesso negado ou agendamento não encontrado.');
    }

    // Se há recursos utilizados, usa o método com transação; senão o método simples
    const { recursosUtilizados, ...updateData } = data;
    const atualizada =
      recursosUtilizados && recursosUtilizados.length > 0
        ? await this.agendaRepository.updateWithResources(id, data)
        : await this.agendaRepository.update(id, updateData);

    // Mudar data/status de um Transplante pode mexer no grupo da planta
    await this.reavaliar.execute({ plantaIds: [agenda.plantaId], agendaIds: [id] }, usuarioId);
    return atualizada;
  }
}
