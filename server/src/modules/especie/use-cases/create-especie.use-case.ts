import {
  EspecieRepository,
  CreateEspecieRequestDTO,
  EspecieResponseDTO,
} from '../especie.types';

export class CreateEspecieUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute(data: CreateEspecieRequestDTO): Promise<EspecieResponseDTO> {
    // Verificar se já existe uma espécie com o mesmo nome científico
    const existingEspecie = await this.especieRepository.existsByNomeCientifico(data.nomeCientifico);
    if (existingEspecie) {
      throw new Error('Já existe uma espécie com este nome científico.');
    }

    return await this.especieRepository.create(data);
  }
}