import { FerramentaRepository } from '../types/ferramenta.types';

export class DeleteFerramentaUseCase {
  constructor(private ferramentaRepository: FerramentaRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar se a ferramenta existe
    const ferramentaExists = await this.ferramentaRepository.existsById(id);
    if (!ferramentaExists) {
      throw new Error('Ferramenta não encontrada.');
    }

    await this.ferramentaRepository.delete(id);
  }
}