import { PlantaWithEspecie, PlantaRepository } from '../types/planta.types';

export class GetPlantaByIdUseCase {
  constructor(private plantaRepository: PlantaRepository) {}

  async execute(id: string, usuarioId: string): Promise<PlantaWithEspecie> {
    const planta = await this.plantaRepository.findByIdAndUser(id, usuarioId);
    
    if (!planta) {
      throw new Error('Planta não encontrada ou não pertence ao usuário');
    }

    return planta;
  }
}