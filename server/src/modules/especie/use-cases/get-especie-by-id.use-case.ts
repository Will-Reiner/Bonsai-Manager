import {
  EspecieRepository,
  EspecieWithRelationsResponseDTO,
} from '../especie.types';

export class GetEspecieByIdUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute(id: string): Promise<EspecieWithRelationsResponseDTO> {
    const especie = await this.especieRepository.findById(id);
    
    if (!especie) {
      throw new Error('Espécie não encontrada.');
    }

    return especie;
  }
}