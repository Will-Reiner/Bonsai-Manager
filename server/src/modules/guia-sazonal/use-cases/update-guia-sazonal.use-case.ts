import {
  GuiaSazonalRepository,
  UpdateGuiaSazonalDTO,
  GuiaSazonalResponseDTO,
  Estacao,
} from '../guia-sazonal.types';

export class UpdateGuiaSazonalUseCase {
  constructor(private repository: GuiaSazonalRepository) {}

  async execute(
    especieId: string,
    atividadeId: string,
    estacao: Estacao,
    data: UpdateGuiaSazonalDTO
  ): Promise<GuiaSazonalResponseDTO> {
    // Verificar se a associação existe
    const exists = await this.repository.exists(especieId, atividadeId, estacao);
    if (!exists) {
      throw new Error('Associação não encontrada');
    }

    return await this.repository.update(especieId, atividadeId, estacao, data);
  }
}