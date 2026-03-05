import { FerramentaRepository, CreateFerramentaDTO } from '../types/ferramenta.types';
import { Ferramenta } from '@prisma/client';

export class CreateFerramentaUseCase {
  constructor(private ferramentaRepository: FerramentaRepository) {}

  async execute(data: CreateFerramentaDTO): Promise<Ferramenta> {
    // Verificar se já existe uma ferramenta com este nome
    const ferramentaExists = await this.ferramentaRepository.existsByName(data.nome);
    if (ferramentaExists) {
      throw new Error('Já existe uma ferramenta com este nome.');
    }

    return await this.ferramentaRepository.create(data);
  }
}