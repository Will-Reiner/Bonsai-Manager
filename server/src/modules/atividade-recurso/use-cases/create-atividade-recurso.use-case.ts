import {
  AtividadeRecursoRepository,
  CreateAtividadeRecursoDTO,
  AtividadeRecursoResponseDTO,
} from '../atividade-recurso.types';

export class CreateAtividadeRecursoUseCase {
  constructor(
    private atividadeRecursoRepository: AtividadeRecursoRepository
  ) {}

  async execute(data: CreateAtividadeRecursoDTO): Promise<AtividadeRecursoResponseDTO> {
    // Verificar se a atividade existe
    const atividadeExists = await this.atividadeRecursoRepository.atividadeExists(data.atividadeId);
    if (!atividadeExists) {
      throw new Error('Atividade não encontrada');
    }

    // Verificar se o tipo de recurso existe
    const tipoRecursoExists = await this.atividadeRecursoRepository.tipoRecursoExists(data.tipoRecursoId);
    if (!tipoRecursoExists) {
      throw new Error('Tipo de recurso não encontrado');
    }

    // Verificar se a associação já existe
    const associacaoExists = await this.atividadeRecursoRepository.exists(data);
    if (associacaoExists) {
      throw new Error('Esta associação já existe');
    }

    return await this.atividadeRecursoRepository.create(data);
  }
}