import { UnfollowUserUseCase } from './unfollow-user.use-case';
import { AmizadeRepository, UnfollowDTO } from '../amizade.types';

describe('UnfollowUserUseCase', () => {
  let unfollowUserUseCase: UnfollowUserUseCase;
  let mockAmizadeRepository: jest.Mocked<AmizadeRepository>;

  beforeEach(() => {
    mockAmizadeRepository = {
      follow: jest.fn(),
      unfollow: jest.fn(),
      existsAmizade: jest.fn(),
      userExists: jest.fn(),
      findSeguindo: jest.fn(),
      findSeguidores: jest.fn(),
    };
    unfollowUserUseCase = new UnfollowUserUseCase(mockAmizadeRepository);
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
});