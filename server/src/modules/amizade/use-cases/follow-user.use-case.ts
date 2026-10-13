import { AmizadeRepository, AvisoDeSeguir, FollowDTO, AmizadeResponseDTO } from '../amizade.types';

export class FollowUserUseCase {
  constructor(
    private amizadeRepository: AmizadeRepository,
    private aviso: AvisoDeSeguir,
  ) {}

  async execute(data: FollowDTO): Promise<AmizadeResponseDTO> {
    const { seguidorId, seguidoId } = data;

    // Verifica se o usuário não está tentando seguir a si mesmo
    if (seguidorId === seguidoId) {
      throw new Error('Não pode seguir a si mesmo.');
    }

    // Só perfis públicos podem ser seguidos (Comunidade aberta, sem aprovação)
    const publico = await this.amizadeRepository.perfilPublico(seguidoId);
    if (publico === null) {
      throw new Error('Utilizador a ser seguido não encontrado.');
    }
    if (!publico) {
      throw new Error('Este perfil é privado.');
    }

    // Verifica se a amizade já existe
    const amizadeExists = await this.amizadeRepository.existsAmizade(seguidorId, seguidoId);
    if (amizadeExists) {
      throw new Error('Já está a seguir este utilizador.');
    }

    const amizade = await this.amizadeRepository.follow(data);
    await this.aviso.seguiu(seguidorId, seguidoId);
    return amizade;
  }
}