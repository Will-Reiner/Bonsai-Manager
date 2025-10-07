import { UpdateRecursoDTO, RecursoRepository } from '../recurso.types';

export class UpdateRecursoUseCase {
  constructor(private recursoRepository: RecursoRepository) {}

  async execute(id: string, data: UpdateRecursoDTO, usuarioId: string) {
    const exists = await this.recursoRepository.existsByIdAndUser(id, usuarioId);
    
    if (!exists) {
      throw new Error('Recurso não encontrado ou não pertence a si.');
    }

    return await this.recursoRepository.update(id, data);
  }
}