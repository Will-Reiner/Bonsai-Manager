import { GetAllPublicProfilesUseCase } from './get-all-public-profiles.use-case';
import { UserRepository, PublicUserProfileDTO } from '../types/user.types';

describe('GetAllPublicProfilesUseCase', () => {
  let useCase: GetAllPublicProfilesUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findAllPublicProfiles: jest.fn(),
      findPublicProfileById: jest.fn(),
    };
    useCase = new GetAllPublicProfilesUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('deve retornar lista de perfis públicos com sucesso', async () => {
      // Arrange
      const mockUsers: PublicUserProfileDTO[] = [
        {
          id: '1',
          nomePublico: 'João Silva',
          localidade: 'Lisboa',
          fotoPerfilUrl: 'https://example.com/foto1.jpg',
          bio: 'Amante de bonsais',
        },
        {
          id: '2',
          nomePublico: 'Maria Santos',
          localidade: 'Porto',
          fotoPerfilUrl: null,
          bio: null,
        },
      ];

      mockUserRepository.findAllPublicProfiles.mockResolvedValue(mockUsers);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.findAllPublicProfiles).toHaveBeenCalledTimes(1);
    });

    it('deve retornar lista vazia quando não há perfis públicos', async () => {
      // Arrange
      mockUserRepository.findAllPublicProfiles.mockResolvedValue([]);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result).toEqual([]);
      expect(mockUserRepository.findAllPublicProfiles).toHaveBeenCalledTimes(1);
    });

    it('deve lançar erro quando repositório falha', async () => {
      // Arrange
      mockUserRepository.findAllPublicProfiles.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute({})).rejects.toThrow('Erro ao buscar utilizadores.');
      expect(mockUserRepository.findAllPublicProfiles).toHaveBeenCalledTimes(1);
    });
  });
});