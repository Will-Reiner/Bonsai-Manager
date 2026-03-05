import { CreateRecursoDTO, RecursoRepository } from '../recurso.types';

export class CreateRecursoUseCase {
  constructor(private recursoRepository: RecursoRepository) {}

  async execute(data: CreateRecursoDTO, usuarioId: string) {
    return await this.recursoRepository.create(data, usuarioId);
  }
}