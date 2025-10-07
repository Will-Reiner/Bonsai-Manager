import {
  AtividadeRepository,
  CreateAtividadeRequestDTO,
  AtividadeResponseDTO,
} from '../atividade.types';

export interface CreateAtividadeUseCaseRequest extends CreateAtividadeRequestDTO {}

export class CreateAtividadeUseCase {
  constructor(private atividadeRepository: AtividadeRepository) {}

  async execute(request: CreateAtividadeUseCaseRequest): Promise<AtividadeResponseDTO> {
    // Verificar se já existe uma atividade com o mesmo nome
    const atividadeExistente = await this.atividadeRepository.existsByNome(request.nome);
    
    if (atividadeExistente) {
      throw new Error('Já existe uma atividade com este nome.');
    }

    // Criar a nova atividade
    const novaAtividade = await this.atividadeRepository.create(request);

    return novaAtividade;
  }
}