import { GetSeguidoresUseCase } from './get-seguidores.use-case';
import { AmizadeRepository } from '../amizade.types';

describe('GetSeguidoresUseCase', () => {
  let useCase: GetSeguidoresUseCase;
  let mockRepository: jest.Mocked<AmizadeRepository>;

  beforeEach(() => {
    mockRepository = {
      follow: jest.fn(),
      unfollow: jest.fn(),
      existsAmizade: jest.fn(),
      userExists: jest.fn(),
      findSeguidores: jest.fn(),
      findSeguindo: jest.fn(),
    };
    useCase = new GetSeguidoresUseCase(mockRepository);
  });

  it('should return followers of a user', async () => {
    // Arrange
    const userId = 'user-1';
    const expected = [
      { seguidorId: 'user-2', seguidoId: userId },
      { seguidorId: 'user-3', seguidoId: userId },
    ];
    mockRepository.findSeguidores.mockResolvedValue(expected);

    // Act
    const result = await useCase.execute(userId);

    // Assert
    expect(mockRepository.findSeguidores).toHaveBeenCalledWith(userId);
    expect(result).toEqual(expected);
  });

  it('should return empty array when user has no followers', async () => {
    mockRepository.findSeguidores.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result).toEqual([]);
  });
});
