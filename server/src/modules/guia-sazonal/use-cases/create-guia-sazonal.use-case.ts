import {
  GuiaSazonalRepository,
  CreateGuiaSazonalDTO,
  GuiaSazonalResponseDTO,
} from '../guia-sazonal.types';

export class CreateGuiaSazonalUseCase {
  constructor(private repository: GuiaSazonalRepository) {}

  async execute(data: CreateGuiaSazonalDTO): Promise<GuiaSazonalResponseDTO> {
    // Verificar se a espécie existe
    const especieExists = await this.repository.especieExists(data.especieId);
    if (!especieExists) {
      throw new Error('Espécie não encontrada');
    }

    // Verificar se a atividade existe
    const atividadeExists = await this.repository.atividadeExists(data.atividadeId);
    if (!atividadeExists) {
      throw new Error('Atividade não encontrada');
    }

    // Verificar se a associação já existe
    const associacaoExists = await this.repository.exists(
      data.especieId,
      data.atividadeId,
      data.estacao
    );
    if (associacaoExists) {
      throw new Error('Esta associação já existe');
    }

    return await this.repository.create(data);
  }
}