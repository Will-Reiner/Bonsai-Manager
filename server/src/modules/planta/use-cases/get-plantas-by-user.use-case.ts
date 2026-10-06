import { atualizarGruposAutomaticos } from './atualizar-grupos-automaticos';
import { PlantaWithEspecie, PlantaRepository } from '../types/planta.types';

export class GetPlantasByUserUseCase {
  constructor(private plantaRepository: PlantaRepository) {}

  async execute(usuarioId: string): Promise<PlantaWithEspecie[]> {
    await atualizarGruposAutomaticos(this.plantaRepository, usuarioId, new Date());
    return await this.plantaRepository.findManyByUser(usuarioId);
  }
}