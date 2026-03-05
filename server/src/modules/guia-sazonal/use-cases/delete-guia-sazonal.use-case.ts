import {
  GuiaSazonalRepository,
  Estacao,
} from '../guia-sazonal.types';

export class DeleteGuiaSazonalUseCase {
  constructor(private repository: GuiaSazonalRepository) {}

  async execute(especieId: string, atividadeId: string, estacao: Estacao): Promise<void> {
    // Verificar se a associação existe
    const exists = await this.repository.exists(especieId, atividadeId, estacao);
    if (!exists) {
      throw new Error('Associação não encontrada');
    }

    await this.repository.delete({ especieId, atividadeId, estacao });
  }
}