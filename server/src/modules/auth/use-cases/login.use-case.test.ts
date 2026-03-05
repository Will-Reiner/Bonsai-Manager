import { LoginUseCase } from './login.use-case';
import { AuthRepository, PasswordService, TokenService, LoginDTO, LoginResponseDTO } from '../types/auth.types';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockAuthRepository: jest.Mocked<AuthRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockTokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    mockAuthRepository = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
      findUserById: jest.fn(),
      updateUser: jest.fn(),
    };
    mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    mockTokenService = {
      sign: jest.fn(),
    };
    useCase = new LoginUseCase(mockAuthRepository, mockPasswordService, mockTokenService);
  });

  describe('execute', () => {
    it('deve fazer login com sucesso', async () => {
      // Arrange
      const loginData: LoginDTO = {
        email: 'joao@example.com',
        senha: 'senha123',
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
        senhaHash: 'hashed_password',
      };

      const token = 'jwt_token';
      const expectedResponse: LoginResponseDTO = {
        token,
        user: {
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
        },
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue(userFromDb);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.sign.mockReturnValue(token);

      // Act
      const result = await useCase.execute(loginData);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(loginData.senha, userFromDb.senhaHash);
      expect(mockTokenService.sign).toHaveBeenCalledWith({ userId: userFromDb.id });
    });

    it('deve lançar erro quando usuário não existe', async () => {
      // Arrange
      const loginData: LoginDTO = {
        email: 'joao@example.com',
        senha: 'senha123',
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(loginData)).rejects.toThrow('Email ou senha inválidos.');
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(mockTokenService.sign).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando senha é inválida', async () => {
      // Arrange
      const loginData: LoginDTO = {
        email: 'joao@example.com',
        senha: 'senha_errada',
      };

      const userFromDb = {
        id: '1',
        email: 'joao@example.com',
        senhaHash: 'hashed_password',
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue(userFromDb);
      mockPasswordService.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute(loginData)).rejects.toThrow('Email ou senha inválidos.');
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(loginData.senha, userFromDb.senhaHash);
      expect(mockTokenService.sign).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando repositório falha', async () => {
      // Arrange
      const loginData: LoginDTO = {
        email: 'joao@example.com',
        senha: 'senha123',
      };

      mockAuthRepository.findUserByEmail.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(loginData)).rejects.toThrow('Database error');
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(loginData.email);
    });

    it('deve lançar erro genérico quando erro não é instância de Error', async () => {
      // Arrange
      const loginData: LoginDTO = {
        email: 'joao@example.com',
        senha: 'senha123',
      };

      mockAuthRepository.findUserByEmail.mockRejectedValue('Unknown error');

      // Act & Assert
      await expect(useCase.execute(loginData)).rejects.toThrow('Erro ao fazer login.');
    });
  });
});