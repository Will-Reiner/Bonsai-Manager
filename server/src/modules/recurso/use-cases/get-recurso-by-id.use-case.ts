import { RecursoRepository } from '../recurso.types';

export class GetRecursoByIdUseCase {
  constructor(private recursoRepository: RecursoRepository) {}

  async execute(id: string, usuarioId: string) {
    const recurso = await this.recursoRepository.findByIdAndUser(id, usuarioId);
    
    if (!recurso) {
      throw new Error('Recurso não encontrado ou não pertence a si.');
    }

    return recurso;
  }
}