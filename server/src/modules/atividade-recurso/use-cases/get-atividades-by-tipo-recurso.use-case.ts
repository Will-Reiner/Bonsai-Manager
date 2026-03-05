import {
  AtividadeRecursoRepository,
  AtividadeRecursoWithAtividadeDTO,
} from '../atividade-recurso.types';

export class GetAtividadesByTipoRecursoUseCase {
  constructor(
    private atividadeRecursoRepository: AtividadeRecursoRepository
  ) {}

  async execute(tipoRecursoId: string): Promise<AtividadeRecursoWithAtividadeDTO[]> {
    // Verificar se o tipo de recurso existe
    const tipoRecursoExists = await this.atividadeRecursoRepository.tipoRecursoExists(tipoRecursoId);
    if (!tipoRecursoExists) {
      throw new Error('Tipo de recurso não encontrado');
    }

    return await this.atividadeRecursoRepository.getByTipoRecurso(tipoRecursoId);
  }
}