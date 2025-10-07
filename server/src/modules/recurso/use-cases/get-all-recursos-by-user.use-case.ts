import { RecursoRepository } from '../recurso.types';

export class GetAllRecursosByUserUseCase {
  constructor(private recursoRepository: RecursoRepository) {}

  async execute(usuarioId: string) {
    return await this.recursoRepository.findManyByUser(usuarioId);
  }
}