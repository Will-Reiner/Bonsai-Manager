import { AgendaRepository, CreateAgendasLoteDTO } from '../agenda.types';

export const MAX_AGENDAS_LOTE = 2000;

/** Agenda vários cuidados de uma vez para várias plantas, na mesma data (tudo ou nada). */
export class CreateAgendasLoteUseCase {
  constructor(private agendaRepository: AgendaRepository) {}

  async execute(data: CreateAgendasLoteDTO, usuarioId: string) {
    const atividadeIds = [...new Set(data.atividadeIds)];
    const plantaIds = [...new Set(data.plantaIds)];
    if (!atividadeIds.length) throw new Error('Informe ao menos um cuidado.');
    if (!plantaIds.length) throw new Error('Informe ao menos uma planta.');
    if (atividadeIds.length * plantaIds.length > MAX_AGENDAS_LOTE) {
      throw new Error(`Máximo de ${MAX_AGENDAS_LOTE} tarefas por vez.`);
    }

    const doUsuario = await this.agendaRepository.contarPlantasDoUsuario(plantaIds, usuarioId);
    if (doUsuario !== plantaIds.length) {
      throw new Error('Acesso negado. A planta não pertence a si.');
    }

    const detalhes = data.detalhes?.trim() || undefined;
    return await this.agendaRepository.createMany(
      plantaIds.flatMap((plantaId) =>
        atividadeIds.map((atividadeId) => ({
          plantaId,
          atividadeId,
          dataAgendada: data.dataAgendada,
          ...(detalhes && { detalhes }),
        })),
      ),
    );
  }
}
