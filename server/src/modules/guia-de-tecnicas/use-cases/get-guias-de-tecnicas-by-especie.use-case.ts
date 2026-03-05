import { GuiaDeTecnicasRepository, GuiaDeTecnicasResponseDTO } from '../guia-de-tecnicas.types';

export class GetGuiasDeTecnicasByEspecieUseCase {
  constructor(private repository: GuiaDeTecnicasRepository) {}

  async execute(especieId: string): Promise<GuiaDeTecnicasResponseDTO[]> {
    const especieExists = await this.repository.especieExists(especieId);
    if (!especieExists) {
      throw new Error('Espécie não encontrada');
    }

    return await this.repository.findByEspecie(especieId);
  }
}
