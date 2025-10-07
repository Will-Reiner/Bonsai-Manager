import { RecursoRepository } from '../recurso.types';

export class DeleteRecursoUseCase {
  constructor(private recursoRepository: RecursoRepository) {}

  async execute(id: string, usuarioId: string): Promise<void> {
    const exists = await this.recursoRepository.existsByIdAndUser(id, usuarioId);
    
    if (!exists) {
      throw new Error('Recurso não encontrado ou não pertence a si.');
    }

    await this.recursoRepository.delete(id);
  }
}