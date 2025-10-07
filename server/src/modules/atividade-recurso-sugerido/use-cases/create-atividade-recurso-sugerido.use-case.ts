import {
  AtividadeRecursoSugeridoRepository,
  CreateAtividadeRecursoSugeridoDTO,
  AtividadeRecursoSugeridoResponseDTO,
} from '../atividade-recurso-sugerido.types';

export class CreateAtividadeRecursoSugeridoUseCase {
  constructor(
    private atividadeRecursoSugeridoRepository: AtividadeRecursoSugeridoRepository
  ) {}

  async execute(data: CreateAtividadeRecursoSugeridoDTO): Promise<AtividadeRecursoSugeridoResponseDTO> {
    // Verificar se a atividade existe
    const atividadeExists = await this.atividadeRecursoSugeridoRepository.atividadeExists(data.atividadeId);
    if (!atividadeExists) {
      throw new Error('Atividade não encontrada');
    }

    // Verificar se o tipo de recurso existe
    const tipoRecursoExists = await this.atividadeRecursoSugeridoRepository.tipoRecursoExists(data.tipoRecursoId);
    if (!tipoRecursoExists) {
      throw new Error('Tipo de recurso não encontrado');
    }

    // Verificar se a associação já existe
    const associacaoExists = await this.atividadeRecursoSugeridoRepository.exists(
      data.atividadeId,
      data.tipoRecursoId
    );
    if (associacaoExists) {
      throw new Error('Esta associação já existe');
    }

    // Criar a associação
    return await this.atividadeRecursoSugeridoRepository.create(data);
  }
}