import { AtividadeRecursoSugeridoRepository } from '../atividade-recurso-sugerido.types';

export class GetRecursosSugeridosByAtividadeUseCase {
  constructor(private repository: AtividadeRecursoSugeridoRepository) {}

  async execute(atividadeId: string): Promise<any[]> {
    const atividadeExists = await this.repository.atividadeExists(atividadeId);
    if (!atividadeExists) {
      throw new Error('Atividade não encontrada');
    }

    return await this.repository.findByAtividade(atividadeId);
  }
}
