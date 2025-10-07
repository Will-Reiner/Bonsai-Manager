import { GetMeUseCase } from './get-me.use-case';
import { AuthRepository, GetMeDTO, GetMeResponseDTO } from '../types/auth.types';

describe('GetMeUseCase', () => {
  let useCase: GetMeUseCase;
  let mockAuthRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    mockAuthRepository = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
      findUserById: jest.fn(),
      updateUser: jest.fn(),
    };
    useCase = new GetMeUseCase(mockAuthRepository);
  });

  describe('execute', () => {
    it('deve retornar dados do usuário com sucesso', async () => {
      // Arrange
      const getMeData: GetMeDTO = {
        userId: '1',
      };

      const userFromDb = {
        id: '1',
        nome: 'João Silva',
        email: 'joao@example.com',
        nomePublico: 'João',
        localidade: 'Lisboa',
        fotoPerfilUrl: null,
        bio: null,
        perfilPublico: false,
        recursosHabilitado: false,
        createdAt: new Date(),
        role: 'USER',
        seguindo: [
          {
            seguido: {
              id: '2',
              nomePublico: 'Maria',
              fotoPerfilUrl: null,
            },
          },
        ],
        seguidores: [
          {
            seguidor: {
              id: '3',
              nomePublico: 'Pedro',
              fotoPerfilUrl: null,
            },
          },
        ],
        plantas: [
          {
            id: '1',
          },
          {
            id: '2',
          },
        ],
      };

      const expectedResponse: GetMeResponseDTO = {
        id: '1',
        nome: 'João Silva',
        email: 'joao@example.com',
        nomePublico: 'João',
        localidade: 'Lisboa',
        fotoPerfilUrl: null,
        bio: null,
        perfilPublico: false,
        recursosHabilitado: false,
        createdAt: userFromDb.createdAt,
        role: 'USER',
        seguindo: [
          {
            seguido: {
              id: '2',
              nomePublico: 'Maria',
              fotoPerfilUrl: null,
            },
          },
        ],
        seguidores: [
          {
            seguidor: {
              id: '3',
              nomePublico: 'Pedro',
              fotoPerfilUrl: null,
            },
          },
        ],
        plantas: [
          {
            id: '1',
          },
          {
            id: '2',
          },
        ],
      };

      mockAuthRepository.findUserById.mockResolvedValue(userFromDb);

      // Act
      const result = await useCase.execute(getMeData);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(getMeData.userId);
    });

    it('deve lançar erro quando usuário não existe', async () => {
      // Arrange
      const getMeData: GetMeDTO = {
        userId: '1',
      };

      mockAuthRepository.findUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(getMeData)).rejects.toThrow('Utilizador não encontrado.');
      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(getMeData.userId);
    });

    it('deve lançar erro quando repositório falha', async () => {
      // Arrange
      const getMeData: GetMeDTO = {
        userId: '1',
      };

      mockAuthRepository.findUserById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(getMeData)).rejects.toThrow('Database error');
      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(getMeData.userId);
    });

    it('deve lançar erro genérico quando erro não é instância de Error', async () => {
      // Arrange
      const getMeData: GetMeDTO = {
        userId: '1',
      };

      mockAuthRepository.findUserById.mockRejectedValue('Unknown error');

      // Act & Assert
      await expect(useCase.execute(getMeData)).rejects.toThrow('Erro ao buscar dados do utilizador.');
    });
  });
});