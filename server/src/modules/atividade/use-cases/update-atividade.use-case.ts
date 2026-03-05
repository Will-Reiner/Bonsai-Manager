import {
  AtividadeRepository,
  UpdateAtividadeRequestDTO,
  AtividadeResponseDTO,
} from '../atividade.types';

export interface UpdateAtividadeUseCaseRequest extends UpdateAtividadeRequestDTO {}

export class UpdateAtividadeUseCase {
  constructor(private atividadeRepository: AtividadeRepository) {}

  async execute(request: UpdateAtividadeUseCaseRequest): Promise<AtividadeResponseDTO> {
    // Verificar se a atividade existe
    const atividadeExistente = await this.atividadeRepository.findById(request.id);
    
    if (!atividadeExistente) {
      throw new Error('Atividade não encontrada.');
    }

    // Se o nome está sendo atualizado, verificar se não existe outra atividade com o mesmo nome
    if (request.nome) {
      const nomeJaExiste = await this.atividadeRepository.existsByNomeExcludingId(
        request.nome,
        request.id
      );
      
      if (nomeJaExiste) {
        throw new Error('Já existe uma atividade com este nome.');
      }
    }

    // Atualizar a atividade
    const atividadeAtualizada = await this.atividadeRepository.update(request);

    return atividadeAtualizada;
  }
}