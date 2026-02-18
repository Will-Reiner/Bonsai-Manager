import { GuiaSazonalRepository, GuiaSazonalResponseDTO } from '../guia-sazonal.types';

export class GetAllGuiasSazonaisUseCase {
  constructor(private guiaSazonalRepository: GuiaSazonalRepository) {}

  async execute(): Promise<GuiaSazonalResponseDTO[]> {
    return await this.guiaSazonalRepository.findAll();
  }
}
