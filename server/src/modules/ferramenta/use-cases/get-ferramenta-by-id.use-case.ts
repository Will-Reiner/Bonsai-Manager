import { FerramentaRepository } from '../types/ferramenta.types';
import { Ferramenta } from '@prisma/client';

export class GetFerramentaByIdUseCase {
  constructor(private ferramentaRepository: FerramentaRepository) {}

  async execute(id: string): Promise<Ferramenta> {
    const ferramenta = await this.ferramentaRepository.findById(id);
    if (!ferramenta) {
      throw new Error('Ferramenta não encontrada.');
    }

    return ferramenta;
  }
}