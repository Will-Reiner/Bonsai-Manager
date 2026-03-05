import {
  EspecieRepository,
  EspecieResponseDTO,
} from '../especie.types';

export class GetAllEspeciesUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute(): Promise<EspecieResponseDTO[]> {
    return await this.especieRepository.findAll();
  }
}