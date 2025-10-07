import { AmizadeRepository, UnfollowDTO } from '../amizade.types';

export class UnfollowUserUseCase {
  constructor(private amizadeRepository: AmizadeRepository) {}

  async execute(data: UnfollowDTO): Promise<void> {
    const { seguidorId, seguidoId } = data;

    // Verifica se a amizade existe antes de apagar
    const amizadeExists = await this.amizadeRepository.existsAmizade(seguidorId, seguidoId);
    if (!amizadeExists) {
      throw new Error('Não está a seguir este utilizador.');
    }

    await this.amizadeRepository.unfollow(data);
  }
}