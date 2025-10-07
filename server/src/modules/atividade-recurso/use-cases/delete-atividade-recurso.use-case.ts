import {
  AtividadeRecursoRepository,
  DeleteAtividadeRecursoDTO,
} from '../atividade-recurso.types';

export class DeleteAtividadeRecursoUseCase {
  constructor(
    private atividadeRecursoRepository: AtividadeRecursoRepository
  ) {}

  async execute(data: DeleteAtividadeRecursoDTO): Promise<void> {
    // Verificar se a associação existe
    const associacaoExists = await this.atividadeRecursoRepository.exists(data);
    if (!associacaoExists) {
      throw new Error('Associação não encontrada');
    }

    await this.atividadeRecursoRepository.delete(data);
  }
}