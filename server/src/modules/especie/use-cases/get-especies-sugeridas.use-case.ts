import { EspecieRepository, EspecieResponseDTO } from '../especie.types';

export class GetEspeciesSugeridasUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute(): Promise<EspecieResponseDTO[]> {
    return await this.especieRepository.findByStatus('SUGERIDO');
  }
}
