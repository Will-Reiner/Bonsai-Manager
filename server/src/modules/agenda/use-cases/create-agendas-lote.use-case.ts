import { AgendaRepository, CreateAgendasLoteDTO } from '../agenda.types';

/** Agenda vários cuidados de uma vez para a mesma planta e data. */
export class CreateAgendasLoteUseCase {
  constructor(private agendaRepository: AgendaRepository) {}

  async execute(data: CreateAgendasLoteDTO, usuarioId: string) {
    const atividadeIds = [...new Set(data.atividadeIds)];
    if (!atividadeIds.length) {
      throw new Error('Informe ao menos um cuidado.');
    }

    const plantaBelongsToUser = await this.agendaRepository.checkPlantaBelongsToUser(data.plantaId, usuarioId);
    if (!plantaBelongsToUser) {
      throw new Error('Acesso negado. A planta não pertence a si.');
    }

    const { plantaId, dataAgendada, observacoes } = data;
    return await this.agendaRepository.createMany(
      atividadeIds.map((atividadeId) => ({
        plantaId,
        atividadeId,
        dataAgendada,
        ...(observacoes !== undefined && { observacoes }),
      })),
    );
  }
}
