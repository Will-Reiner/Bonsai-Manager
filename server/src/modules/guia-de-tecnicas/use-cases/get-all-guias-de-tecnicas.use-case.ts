import { GuiaDeTecnicasRepository, GuiaDeTecnicasResponseDTO } from '../guia-de-tecnicas.types';

export class GetAllGuiasDeTecnicasUseCase {
  constructor(private repository: GuiaDeTecnicasRepository) {}

  async execute(): Promise<GuiaDeTecnicasResponseDTO[]> {
    return await this.repository.findAll();
  }
}
