import { TipoRecursoRepository } from '../types/tipo-recurso.types';
import { TipoRecurso } from '@prisma/client';

export class GetTipoRecursoByIdUseCase {
  constructor(private tipoRecursoRepository: TipoRecursoRepository) {}

  async execute(id: string): Promise<TipoRecurso> {
    const tipoRecurso = await this.tipoRecursoRepository.findById(id);
    if (!tipoRecurso) {
      throw new Error('Tipo de recurso não encontrado.');
    }

    return tipoRecurso;
  }
}