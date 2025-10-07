import { PlantaRepository } from '../types/planta.types';

export class DeletePlantaUseCase {
  constructor(private plantaRepository: PlantaRepository) {}

  async execute(id: string, usuarioId: string): Promise<void> {
    // Verificar se a planta existe e pertence ao usuário
    const plantaExists = await this.plantaRepository.existsByIdAndUser(id, usuarioId);
    if (!plantaExists) {
      throw new Error('Planta não encontrada ou não pertence ao usuário');
    }

    // Deletar a planta
    await this.plantaRepository.delete(id, usuarioId);
  }
}