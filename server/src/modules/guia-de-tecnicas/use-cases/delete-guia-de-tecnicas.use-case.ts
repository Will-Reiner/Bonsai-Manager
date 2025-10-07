import { GuiaDeTecnicasRepository } from '../guia-de-tecnicas.types';

export class DeleteGuiaDeTecnicasUseCase {
  constructor(private repository: GuiaDeTecnicasRepository) {}

  async execute(especieId: string, atividadeId: string): Promise<void> {
    const exists = await this.repository.exists(especieId, atividadeId);
    
    if (!exists) {
      throw new Error('Associação não encontrada');
    }

    await this.repository.delete({ especieId, atividadeId });
  }
}