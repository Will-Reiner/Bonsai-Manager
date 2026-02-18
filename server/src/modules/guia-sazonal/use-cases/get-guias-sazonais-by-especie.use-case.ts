import { GuiaSazonalRepository, GuiaSazonalResponseDTO } from '../guia-sazonal.types';

export class GetGuiasSazonaisByEspecieUseCase {
  constructor(private guiaSazonalRepository: GuiaSazonalRepository) {}

  async execute(especieId: string): Promise<GuiaSazonalResponseDTO[]> {
    const especieExists = await this.guiaSazonalRepository.especieExists(especieId);
    if (!especieExists) {
      throw new Error('Espécie não encontrada');
    }

    return await this.guiaSazonalRepository.findByEspecie(especieId);
  }
}
