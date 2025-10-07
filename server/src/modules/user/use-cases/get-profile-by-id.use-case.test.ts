import { GetProfileByIdUseCase } from './get-profile-by-id.use-case';
import { UserRepository, DetailedUserProfileDTO } from '../types/user.types';

describe('GetProfileByIdUseCase', () => {
  let useCase: GetProfileByIdUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findAllPublicProfiles: jest.fn(),
      findPublicProfileById: jest.fn(),
    };
    useCase = new GetProfileByIdUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('deve retornar perfil detalhado quando usuário existe e é público', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUser: DetailedUserProfileDTO = {
        id: userId,
        nomePublico: 'João Silva',
        localidade: 'Lisboa',
        fotoPerfilUrl: 'https://example.com/foto.jpg',
        bio: 'Amante de bonsais há 10 anos',
        createdAt: new Date('2023-01-01'),
        plantas: [
          {
            id: 'planta-1',
            nome: 'Meu Ficus',
            dataAquisicao: new Date('2023-06-01'),
            plantaPublica: true,
            especie: {
              id: 'especie-1',
              nomeComum: 'Ficus',
              nomeCientifico: 'Ficus benjamina',
            },
          },
        ],
      };

      mockUserRepository.findPublicProfileById.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute({ id: userId });

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findPublicProfileById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findPublicProfileById).toHaveBeenCalledTimes(1);
    });

    it('deve lançar erro quando usuário não existe', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockUserRepository.findPublicProfileById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute({ id: userId })).rejects.toThrow('Perfil não encontrado ou é privado.');
      expect(mockUserRepository.findPublicProfileById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findPublicProfileById).toHaveBeenCalledTimes(1);
    });

    it('deve lançar erro quando usuário tem perfil privado', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockUserRepository.findPublicProfileById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute({ id: userId })).rejects.toThrow('Perfil não encontrado ou é privado.');
      expect(mockUserRepository.findPublicProfileById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findPublicProfileById).toHaveBeenCalledTimes(1);
    });

    it('deve lançar erro quando repositório falha', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockUserRepository.findPublicProfileById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute({ id: userId })).rejects.toThrow('Database error');
      expect(mockUserRepository.findPublicProfileById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findPublicProfileById).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro específico quando é uma instância de Error', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const specificError = new Error('Perfil não encontrado ou é privado.');
      mockUserRepository.findPublicProfileById.mockRejectedValue(specificError);

      // Act & Assert
      await expect(useCase.execute({ id: userId })).rejects.toThrow('Perfil não encontrado ou é privado.');
      expect(mockUserRepository.findPublicProfileById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findPublicProfileById).toHaveBeenCalledTimes(1);
    });
  });
});