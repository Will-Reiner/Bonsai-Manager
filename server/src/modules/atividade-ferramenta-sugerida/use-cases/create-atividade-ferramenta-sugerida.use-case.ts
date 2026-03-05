import {
  AtividadeFerramentaSugeridaRepository,
  CreateAtividadeFerramentaSugeridaDTO,
  AtividadeFerramentaSugeridaResponseDTO,
} from '../atividade-ferramenta-sugerida.types';

export class CreateAtividadeFerramentaSugeridaUseCase {
  constructor(
    private atividadeFerramentaSugeridaRepository: AtividadeFerramentaSugeridaRepository
  ) {}

  async execute(data: CreateAtividadeFerramentaSugeridaDTO): Promise<AtividadeFerramentaSugeridaResponseDTO> {
    // Verificar se a atividade existe
    const atividadeExists = await this.atividadeFerramentaSugeridaRepository.atividadeExists(data.atividadeId);
    if (!atividadeExists) {
      throw new Error('Atividade não encontrada');
    }

    // Verificar se a ferramenta existe
    const ferramentaExists = await this.atividadeFerramentaSugeridaRepository.ferramentaExists(data.ferramentaId);
    if (!ferramentaExists) {
      throw new Error('Ferramenta não encontrada');
    }

    // Verificar se a associação já existe
    const associacaoExists = await this.atividadeFerramentaSugeridaRepository.exists(data);
    if (associacaoExists) {
      throw new Error('Associação já existe');
    }

    return await this.atividadeFerramentaSugeridaRepository.create(data);
  }
}