import {
  EspecieRepository,
  UpdateEspecieRequestDTO,
  EspecieResponseDTO,
} from '../especie.types';

export interface UpdateEspecieUseCaseRequest extends UpdateEspecieRequestDTO {
  id: string;
}

export class UpdateEspecieUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute(data: UpdateEspecieUseCaseRequest): Promise<EspecieResponseDTO> {
    const { id, ...updateData } = data;

    // Verificar se a espécie existe
    const existingEspecie = await this.especieRepository.findById(id);
    if (!existingEspecie) {
      throw new Error('Espécie não encontrada.');
    }

    // Se está tentando alterar o nome científico, verificar se não existe outro com o mesmo nome
    if (updateData.nomeCientifico) {
      const duplicateEspecie = await this.especieRepository.existsByNomeCientificoExcludingId(
        updateData.nomeCientifico,
        id
      );
      if (duplicateEspecie) {
        throw new Error('Já existe uma espécie com este nome científico.');
      }
    }

    return await this.especieRepository.update(id, updateData);
  }
}