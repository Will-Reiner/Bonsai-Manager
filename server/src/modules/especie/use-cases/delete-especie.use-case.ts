import { EspecieRepository } from '../especie.types';

export class DeleteEspecieUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar se a espécie existe
    const existingEspecie = await this.especieRepository.findById(id);
    if (!existingEspecie) {
      throw new Error('Espécie não encontrada.');
    }

    await this.especieRepository.delete(id);
  }
}