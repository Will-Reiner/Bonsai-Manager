import {
  EspecieRepository,
  CreateEspecieRequestDTO,
  EspecieResponseDTO,
} from '../especie.types';

export interface CreateEspecieUseCaseRequest {
  data: CreateEspecieRequestDTO;
  userId: string;
  isAdmin: boolean;
}

export class CreateEspecieUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute({ data, userId, isAdmin }: CreateEspecieUseCaseRequest): Promise<EspecieResponseDTO> {
    // Usuário comum deve fornecer nomeComum
    if (!isAdmin && !data.nomeComum?.trim()) {
      throw new Error('O nome comum é obrigatório para sugestão de espécie.');
    }

    // Verificar unicidade de nomeCientifico, apenas se fornecido
    if (data.nomeCientifico) {
      const existingEspecie = await this.especieRepository.existsByNomeCientifico(data.nomeCientifico);
      if (existingEspecie) {
        throw new Error('Já existe uma espécie com este nome científico.');
      }
    }

    // Forçar status: admin pode escolher (default VERIFICADO), user sempre SUGERIDO
    const status = isAdmin ? (data.status || 'VERIFICADO') : 'SUGERIDO';

    return await this.especieRepository.create({
      ...data,
      status,
      criadoPorId: userId,
    });
  }
}
