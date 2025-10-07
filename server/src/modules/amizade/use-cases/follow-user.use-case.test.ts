import { FollowUserUseCase } from './follow-user.use-case';
import { AmizadeRepository, FollowDTO } from '../amizade.types';

describe('FollowUserUseCase', () => {
  let followUserUseCase: FollowUserUseCase;
  let mockAmizadeRepository: jest.Mocked<AmizadeRepository>;

  beforeEach(() => {
    mockAmizadeRepository = {
      follow: jest.fn(),
      unfollow: jest.fn(),
      existsAmizade: jest.fn(),
      userExists: jest.fn(),
    };
    followUserUseCase = new FollowUserUseCase(mockAmizadeRepository);
  });

  it('should follow a user successfully', async () => {
    const followData: FollowDTO = {
      seguidorId: 'user1',
      seguidoId: 'user2',
    };

    const expectedResult = {
      id: 'amizade1',
      seguidorId: 'user1',
      seguidoId: 'user2',
      createdAt: new Date(),
    };

    mockAmizadeRepository.userExists.mockResolvedValue(true);
    mockAmizadeRepository.existsAmizade.mockResolvedValue(false);
    mockAmizadeRepository.follow.mockResolvedValue(expectedResult);

    const result = await followUserUseCase.execute(followData);

    expect(mockAmizadeRepository.userExists).toHaveBeenCalledWith('user2');
    expect(mockAmizadeRepository.existsAmizade).toHaveBeenCalledWith('user1', 'user2');
    expect(mockAmizadeRepository.follow).toHaveBeenCalledWith(followData);
    expect(result).toEqual(expectedResult);
  });

  it('should throw error when trying to follow oneself', async () => {
    const followData: FollowDTO = {
      seguidorId: 'user1',
      seguidoId: 'user1',
    };

    await expect(followUserUseCase.execute(followData)).rejects.toThrow(
      'Não pode seguir a si mesmo.'
    );

    expect(mockAmizadeRepository.userExists).not.toHaveBeenCalled();
    expect(mockAmizadeRepository.existsAmizade).not.toHaveBeenCalled();
    expect(mockAmizadeRepository.follow).not.toHaveBeenCalled();
  });

  it('should throw error when user to follow does not exist', async () => {
    const followData: FollowDTO = {
      seguidorId: 'user1',
      seguidoId: 'nonexistent',
    };

    mockAmizadeRepository.userExists.mockResolvedValue(false);

    await expect(followUserUseCase.execute(followData)).rejects.toThrow(
      'Utilizador a ser seguido não encontrado.'
    );

    expect(mockAmizadeRepository.userExists).toHaveBeenCalledWith('nonexistent');
    expect(mockAmizadeRepository.existsAmizade).not.toHaveBeenCalled();
    expect(mockAmizadeRepository.follow).not.toHaveBeenCalled();
  });

  it('should throw error when already following the user', async () => {
    const followData: FollowDTO = {
      seguidorId: 'user1',
      seguidoId: 'user2',
    };

    mockAmizadeRepository.userExists.mockResolvedValue(true);
    mockAmizadeRepository.existsAmizade.mockResolvedValue(true);

    await expect(followUserUseCase.execute(followData)).rejects.toThrow(
      'Já está a seguir este utilizador.'
    );

    expect(mockAmizadeRepository.userExists).toHaveBeenCalledWith('user2');
    expect(mockAmizadeRepository.existsAmizade).toHaveBeenCalledWith('user1', 'user2');
    expect(mockAmizadeRepository.follow).not.toHaveBeenCalled();
  });
});