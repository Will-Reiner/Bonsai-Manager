import { FerramentaRepository } from '../types/ferramenta.types';
import { Ferramenta } from '@prisma/client';

export class GetAllFerramentasUseCase {
  constructor(private ferramentaRepository: FerramentaRepository) {}

  async execute(): Promise<Ferramenta[]> {
    return await this.ferramentaRepository.findMany();
  }
}