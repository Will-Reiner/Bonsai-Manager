import {
  AtividadeRecursoSugeridoRepository,
  DeleteAtividadeRecursoSugeridoDTO,
} from '../atividade-recurso-sugerido.types';

export class DeleteAtividadeRecursoSugeridoUseCase {
  constructor(
    private atividadeRecursoSugeridoRepository: AtividadeRecursoSugeridoRepository
  ) {}

  async execute(data: DeleteAtividadeRecursoSugeridoDTO): Promise<void> {
    // Verificar se a associação existe
    const associacaoExists = await this.atividadeRecursoSugeridoRepository.exists(
      data.atividadeId,
      data.tipoRecursoId
    );
    if (!associacaoExists) {
      throw new Error('Associação não encontrada');
    }

    // Deletar a associação
    await this.atividadeRecursoSugeridoRepository.delete(data);
  }
}