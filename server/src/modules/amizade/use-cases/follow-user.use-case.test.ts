import { FollowUserUseCase } from './follow-user.use-case';
import { AmizadeRepository, FollowDTO } from '../amizade.types';

describe('FollowUserUseCase', () => {
  let followUserUseCase: FollowUserUseCase;
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
    aviso = { seguiu: jest.fn().mockResolvedValue(undefined), deixouDeSeguir: jest.fn() };
    followUserUseCase = new FollowUserUseCase(mockAmizadeRepository, aviso);
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

    mockAmizadeRepository.perfilPublico.mockResolvedValue(true);
    mockAmizadeRepository.existsAmizade.mockResolvedValue(false);
    mockAmizadeRepository.follow.mockResolvedValue(expectedResult);

    const result = await followUserUseCase.execute(followData);

    expect(mockAmizadeRepository.perfilPublico).toHaveBeenCalledWith('user2');
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

    expect(mockAmizadeRepository.perfilPublico).not.toHaveBeenCalled();
    expect(mockAmizadeRepository.existsAmizade).not.toHaveBeenCalled();
    expect(mockAmizadeRepository.follow).not.toHaveBeenCalled();
  });

  it('should throw error when user to follow does not exist', async () => {
    const followData: FollowDTO = {
      seguidorId: 'user1',
      seguidoId: 'nonexistent',
    };

    mockAmizadeRepository.perfilPublico.mockResolvedValue(null);

    await expect(followUserUseCase.execute(followData)).rejects.toThrow(
      'Utilizador a ser seguido não encontrado.'
    );

    expect(mockAmizadeRepository.perfilPublico).toHaveBeenCalledWith('nonexistent');
    expect(mockAmizadeRepository.existsAmizade).not.toHaveBeenCalled();
    expect(mockAmizadeRepository.follow).not.toHaveBeenCalled();
  });

  it('should throw error when already following the user', async () => {
    const followData: FollowDTO = {
      seguidorId: 'user1',
      seguidoId: 'user2',
    };

    mockAmizadeRepository.perfilPublico.mockResolvedValue(true);
    mockAmizadeRepository.existsAmizade.mockResolvedValue(true);

    await expect(followUserUseCase.execute(followData)).rejects.toThrow(
      'Já está a seguir este utilizador.'
    );

    expect(mockAmizadeRepository.perfilPublico).toHaveBeenCalledWith('user2');
    expect(mockAmizadeRepository.existsAmizade).toHaveBeenCalledWith('user1', 'user2');
    expect(mockAmizadeRepository.follow).not.toHaveBeenCalled();
  });

  it('não segue perfil privado', async () => {
    mockAmizadeRepository.perfilPublico.mockResolvedValue(false);

    await expect(followUserUseCase.execute({ seguidorId: 'user1', seguidoId: 'user2' })).rejects.toThrow('Este perfil é privado.');
    expect(mockAmizadeRepository.follow).not.toHaveBeenCalled();
  });

  it('avisa quem foi seguido', async () => {
    mockAmizadeRepository.perfilPublico.mockResolvedValue(true);
    mockAmizadeRepository.existsAmizade.mockResolvedValue(false);
    mockAmizadeRepository.follow.mockResolvedValue({ seguidorId: 'user1', seguidoId: 'user2' });

    await followUserUseCase.execute({ seguidorId: 'user1', seguidoId: 'user2' });

    expect(aviso.seguiu).toHaveBeenCalledWith('user1', 'user2');
  });

  it('não avisa quando não chegou a seguir (perfil privado)', async () => {
    mockAmizadeRepository.perfilPublico.mockResolvedValue(false);
    await expect(followUserUseCase.execute({ seguidorId: 'user1', seguidoId: 'user2' })).rejects.toThrow();
    expect(aviso.seguiu).not.toHaveBeenCalled();
  });
});
