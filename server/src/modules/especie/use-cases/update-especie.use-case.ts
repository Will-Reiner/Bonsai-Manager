import {
  EspecieRepository,
  UpdateEspecieRequestDTO,
  EspecieResponseDTO,
} from '../especie.types';

export interface UpdateEspecieUseCaseRequest extends UpdateEspecieRequestDTO {
  id: string;
  isAdmin?: boolean;
}

export class UpdateEspecieUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute(data: UpdateEspecieUseCaseRequest): Promise<EspecieResponseDTO> {
    const { id, isAdmin, ...updateData } = data;

    // Verificar se a espécie existe
    const existingEspecie = await this.especieRepository.findById(id);
    if (!existingEspecie) {
      throw new Error('Espécie não encontrada.');
    }

    // Apenas administradores podem alterar o status
    if (updateData.status && !isAdmin) {
      throw new Error('Apenas administradores podem alterar o status da espécie.');
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
