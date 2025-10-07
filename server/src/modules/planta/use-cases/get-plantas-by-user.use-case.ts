import { PlantaWithEspecie, PlantaRepository } from '../types/planta.types';

export class GetPlantasByUserUseCase {
  constructor(private plantaRepository: PlantaRepository) {}

  async execute(usuarioId: string): Promise<PlantaWithEspecie[]> {
    return await this.plantaRepository.findManyByUser(usuarioId);
  }
}