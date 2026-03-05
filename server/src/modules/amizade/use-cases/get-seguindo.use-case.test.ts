import { GetSeguindoUseCase } from './get-seguindo.use-case';
import { AmizadeRepository } from '../amizade.types';

describe('GetSeguindoUseCase', () => {
  let useCase: GetSeguindoUseCase;
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
    useCase = new GetSeguindoUseCase(mockRepository);
  });

  it('should return users that a user is following', async () => {
    // Arrange
    const userId = 'user-1';
    const expected = [
      { seguidorId: userId, seguidoId: 'user-2' },
      { seguidorId: userId, seguidoId: 'user-3' },
    ];
    mockRepository.findSeguindo.mockResolvedValue(expected);

    // Act
    const result = await useCase.execute(userId);

    // Assert
    expect(mockRepository.findSeguindo).toHaveBeenCalledWith(userId);
    expect(result).toEqual(expected);
  });

  it('should return empty array when user follows no one', async () => {
    mockRepository.findSeguindo.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result).toEqual([]);
  });
});
