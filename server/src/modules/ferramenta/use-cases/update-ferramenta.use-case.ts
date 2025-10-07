import { FerramentaRepository, UpdateFerramentaDTO } from '../types/ferramenta.types';
import { Ferramenta } from '@prisma/client';

export class UpdateFerramentaUseCase {
  constructor(private ferramentaRepository: FerramentaRepository) {}

  async execute(id: string, data: UpdateFerramentaDTO): Promise<Ferramenta> {
    // Verificar se a ferramenta existe
    const ferramentaExists = await this.ferramentaRepository.existsById(id);
    if (!ferramentaExists) {
      throw new Error('Ferramenta não encontrada.');
    }

    // Se está tentando alterar o nome, verificar se já existe outra ferramenta com este nome
    if (data.nome) {
      const nameExists = await this.ferramentaRepository.existsByNameExcludingId(data.nome, id);
      if (nameExists) {
        throw new Error('Já existe uma ferramenta com este nome.');
      }
    }

    return await this.ferramentaRepository.update(id, data);
  }
}