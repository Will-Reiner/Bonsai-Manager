import { InspiracaoRepository } from '../inspiracao.types';

export class GetInspiracoesByPlantaUseCase {
  constructor(private inspiracaoRepository: InspiracaoRepository) {}

  async execute(plantaId: string, usuarioId: string): Promise<any[]> {
    const plantaExists = await this.inspiracaoRepository.plantaExistsAndBelongsToUser(plantaId, usuarioId);
    if (!plantaExists) {
      throw new Error('Planta não encontrada ou não pertence ao utilizador.');
    }

    return await this.inspiracaoRepository.findByPlanta(plantaId);
  }
}
