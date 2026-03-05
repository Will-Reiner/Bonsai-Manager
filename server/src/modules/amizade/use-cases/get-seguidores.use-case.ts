import { AmizadeRepository } from '../amizade.types';

export class GetSeguidoresUseCase {
  constructor(private amizadeRepository: AmizadeRepository) {}

  async execute(userId: string): Promise<any[]> {
    return await this.amizadeRepository.findSeguidores(userId);
  }
}
