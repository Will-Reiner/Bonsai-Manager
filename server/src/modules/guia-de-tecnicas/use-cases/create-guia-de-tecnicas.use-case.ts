import {
  GuiaDeTecnicasRepository,
  CreateGuiaDeTecnicasDTO,
  GuiaDeTecnicasResponseDTO,
} from '../guia-de-tecnicas.types';

export class CreateGuiaDeTecnicasUseCase {
  constructor(
    private guiaDeTecnicasRepository: GuiaDeTecnicasRepository
  ) {}

  async execute(data: CreateGuiaDeTecnicasDTO): Promise<GuiaDeTecnicasResponseDTO> {
    // Verificar se a espécie existe
    const especieExists = await this.guiaDeTecnicasRepository.especieExists(data.especieId);
    if (!especieExists) {
      throw new Error('Espécie não encontrada');
    }

    // Verificar se a atividade existe
    const atividadeExists = await this.guiaDeTecnicasRepository.atividadeExists(data.atividadeId);
    if (!atividadeExists) {
      throw new Error('Atividade não encontrada');
    }

    // Verificar se a associação já existe
    const associacaoExists = await this.guiaDeTecnicasRepository.exists(
      data.especieId,
      data.atividadeId
    );
    if (associacaoExists) {
      throw new Error('Esta associação já existe');
    }

    // Criar a associação
    return await this.guiaDeTecnicasRepository.create(data);
  }
}