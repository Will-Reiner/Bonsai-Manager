import { PlantaWithEspecie, PlantaRepository } from '../types/planta.types';

export class GetPlantasByUserUseCase {
  constructor(private plantaRepository: PlantaRepository) {}

  async execute(usuarioId: string): Promise<PlantaWithEspecie[]> {
    await this.plantaRepository.resolverGruposVencidos(usuarioId, new Date());
    return await this.plantaRepository.findManyByUser(usuarioId);
  }
}