import { PlantaRepository } from '../types/planta.types';
import { LimpezaDeMidia } from '../../midia/midia.types';

export class DeletePlantaUseCase {
  constructor(
    private plantaRepository: PlantaRepository,
    private limpezaDeMidia: LimpezaDeMidia,
  ) {}

  async execute(id: string, usuarioId: string): Promise<void> {
    // Verificar se a planta existe e pertence ao usuário
    const plantaExists = await this.plantaRepository.existsByIdAndUser(id, usuarioId);
    if (!plantaExists) {
      throw new Error('Planta não encontrada ou não pertence ao usuário');
    }

    // Guarda as URLs antes: as fotos somem junto com a planta (cascade)
    const urls = await this.plantaRepository.findUrlsDeMidia(id);

    // Deletar a planta
    await this.plantaRepository.delete(id, usuarioId);

    await this.limpezaDeMidia.execute(urls);
  }
}
