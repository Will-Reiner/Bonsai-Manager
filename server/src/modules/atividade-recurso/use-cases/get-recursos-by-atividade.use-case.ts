import {
  AtividadeRecursoRepository,
  AtividadeRecursoWithTipoRecursoDTO,
} from '../atividade-recurso.types';

export class GetRecursosByAtividadeUseCase {
  constructor(
    private atividadeRecursoRepository: AtividadeRecursoRepository
  ) {}

  async execute(atividadeId: string): Promise<AtividadeRecursoWithTipoRecursoDTO[]> {
    // Verificar se a atividade existe
    const atividadeExists = await this.atividadeRecursoRepository.atividadeExists(atividadeId);
    if (!atividadeExists) {
      throw new Error('Atividade não encontrada');
    }

    return await this.atividadeRecursoRepository.getByAtividade(atividadeId);
  }
}