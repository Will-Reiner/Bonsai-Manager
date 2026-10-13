import { UnfollowUserUseCase } from './unfollow-user.use-case';
import { AmizadeRepository, UnfollowDTO } from '../amizade.types';

describe('UnfollowUserUseCase', () => {
  let unfollowUserUseCase: UnfollowUserUseCase;
  let mockAmizadeRepository: jest.Mocked<AmizadeRepository>;
  let aviso: { seguiu: jest.Mock; deixouDeSeguir: jest.Mock };

  beforeEach(() => {
    mockAmizadeRepository = {
      follow: jest.fn(),
      unfollow: jest.fn(),
      existsAmizade: jest.fn(),
      userExists: jest.fn(),
      perfilPublico: jest.fn(),
      findSeguindo: jest.fn(),
      findSeguidores: jest.fn(),
    };
    aviso = { seguiu: jest.fn(), deixouDeSeguir: jest.fn().mockResolvedValue(undefined) };
    unfollowUserUseCase = new UnfollowUserUseCase(mockAmizadeRepository, aviso);
  });

  it('should unfollow a user successfully', async () => {
    const unfollowData: UnfollowDTO = {
      seguidorId: 'user1',
      seguidoId: 'user2',
    };

    mockAmizadeRepository.existsAmizade.mockResolvedValue(true);
    mockAmizadeRepository.unfollow.mockResolvedValue();

    await unfollowUserUseCase.execute(unfollowData);

    expect(mockAmizadeRepository.existsAmizade).toHaveBeenCalledWith('user1', 'user2');
    expect(mockAmizadeRepository.unfollow).toHaveBeenCalledWith(unfollowData);
  });

  it('should throw error when not following the user', async () => {
    const unfollowData: UnfollowDTO = {
      seguidorId: 'user1',
      seguidoId: 'user2',
    };

    mockAmizadeRepository.existsAmizade.mockResolvedValue(false);

    await expect(unfollowUserUseCase.execute(unfollowData)).rejects.toThrow(
      'Não está a seguir este utilizador.'
    );

    expect(mockAmizadeRepository.existsAmizade).toHaveBeenCalledWith('user1', 'user2');
    expect(mockAmizadeRepository.unfollow).not.toHaveBeenCalled();
  });

  it('tira o aviso de "começou a seguir"', async () => {
    mockAmizadeRepository.existsAmizade.mockResolvedValue(true);
    mockAmizadeRepository.unfollow.mockResolvedValue(undefined);

    await unfollowUserUseCase.execute({ seguidorId: 'user1', seguidoId: 'user2' });

    expect(aviso.deixouDeSeguir).toHaveBeenCalledWith('user1', 'user2');
  });
});
