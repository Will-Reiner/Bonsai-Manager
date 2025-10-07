import { TipoRecursoRepository } from '../types/tipo-recurso.types';
import { TipoRecurso } from '@prisma/client';

export class GetAllTiposRecursoUseCase {
  constructor(private tipoRecursoRepository: TipoRecursoRepository) {}

  async execute(): Promise<TipoRecurso[]> {
    return await this.tipoRecursoRepository.findMany();
  }
}