import { TipoRecursoRepository, UpdateTipoRecursoDTO } from '../types/tipo-recurso.types';
import { TipoRecurso } from '@prisma/client';

export class UpdateTipoRecursoUseCase {
  constructor(private tipoRecursoRepository: TipoRecursoRepository) {}

  async execute(id: string, data: UpdateTipoRecursoDTO): Promise<TipoRecurso> {
    // Verificar se o tipo de recurso existe
    const tipoRecursoExists = await this.tipoRecursoRepository.existsById(id);
    if (!tipoRecursoExists) {
      throw new Error('Tipo de recurso não encontrado.');
    }

    // Se está tentando alterar o nome, verificar se já existe outro tipo de recurso com este nome
    if (data.nome) {
      const nameExists = await this.tipoRecursoRepository.existsByNameExcludingId(data.nome, id);
      if (nameExists) {
        throw new Error('Já existe um tipo de recurso com este nome.');
      }
    }

    return await this.tipoRecursoRepository.update(id, data);
  }
}