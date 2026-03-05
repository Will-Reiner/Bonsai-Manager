import { AmizadeRepository } from '../amizade.types';

export class GetSeguindoUseCase {
  constructor(private amizadeRepository: AmizadeRepository) {}

  async execute(userId: string): Promise<any[]> {
    return await this.amizadeRepository.findSeguindo(userId);
  }
}
