import { TipoRecursoRepository } from '../types/tipo-recurso.types';

export class DeleteTipoRecursoUseCase {
  constructor(private tipoRecursoRepository: TipoRecursoRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar se o tipo de recurso existe
    const tipoRecursoExists = await this.tipoRecursoRepository.existsById(id);
    if (!tipoRecursoExists) {
      throw new Error('Tipo de recurso não encontrado.');
    }

    await this.tipoRecursoRepository.delete(id);
  }
}