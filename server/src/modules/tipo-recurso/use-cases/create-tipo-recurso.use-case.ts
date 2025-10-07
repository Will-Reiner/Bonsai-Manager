import { TipoRecursoRepository, CreateTipoRecursoDTO } from '../types/tipo-recurso.types';
import { TipoRecurso } from '@prisma/client';

export class CreateTipoRecursoUseCase {
  constructor(private tipoRecursoRepository: TipoRecursoRepository) {}

  async execute(data: CreateTipoRecursoDTO): Promise<TipoRecurso> {
    // Verificar se já existe um tipo de recurso com este nome
    const nameExists = await this.tipoRecursoRepository.existsByName(data.nome);
    if (nameExists) {
      throw new Error('Já existe um tipo de recurso com este nome.');
    }

    return await this.tipoRecursoRepository.create(data);
  }
}