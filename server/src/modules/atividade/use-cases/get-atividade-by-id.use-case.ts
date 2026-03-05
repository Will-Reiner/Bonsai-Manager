import {
  AtividadeRepository,
  AtividadeWithRelationsResponseDTO,
} from '../atividade.types';

export class GetAtividadeByIdUseCase {
  constructor(private atividadeRepository: AtividadeRepository) {}

  async execute(id: string): Promise<AtividadeWithRelationsResponseDTO> {
    const atividade = await this.atividadeRepository.findById(id);
    
    if (!atividade) {
      throw new Error('Atividade não encontrada.');
    }

    return atividade;
  }
}