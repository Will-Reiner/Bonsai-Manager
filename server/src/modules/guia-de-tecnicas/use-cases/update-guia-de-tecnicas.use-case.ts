import {
  GuiaDeTecnicasRepository,
  UpdateGuiaDeTecnicasDTO,
  GuiaDeTecnicasResponseDTO,
} from '../guia-de-tecnicas.types';

export class UpdateGuiaDeTecnicasUseCase {
  constructor(
    private guiaDeTecnicasRepository: GuiaDeTecnicasRepository
  ) {}

  async execute(especieId: string, atividadeId: string, data: UpdateGuiaDeTecnicasDTO): Promise<GuiaDeTecnicasResponseDTO> {
    // Verificar se a associação existe
    const associacaoExists = await this.guiaDeTecnicasRepository.exists(
      especieId,
      atividadeId
    );
    if (!associacaoExists) {
      throw new Error('Associação não encontrada');
    }

    // Atualizar a associação
    return await this.guiaDeTecnicasRepository.update(especieId, atividadeId, data);
  }
}