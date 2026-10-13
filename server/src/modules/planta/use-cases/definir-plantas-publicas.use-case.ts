import { PlantaRepository } from '../types/planta.types';

/** "Todas" ou a seleção da gaveta: as plantas informadas ficam públicas e as demais do usuário, privadas. */
export class DefinirPlantasPublicasUseCase {
  constructor(private plantaRepository: PlantaRepository) {}

  async execute(usuarioId: string, plantaIds: string[]): Promise<void> {
    await this.plantaRepository.definirPublicas(usuarioId, [...new Set(plantaIds)]);
  }
}
