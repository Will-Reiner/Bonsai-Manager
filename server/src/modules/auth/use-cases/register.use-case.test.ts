import { RegisterUseCase } from './register.use-case';
import { AuthRepository, PasswordService, RegisterDTO, UserResponseDTO } from '../types/auth.types';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockAuthRepository: jest.Mocked<AuthRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;

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
    useCase = new RegisterUseCase(mockAuthRepository, mockPasswordService);
  });

  describe('execute', () => {
    it('deve registrar usuário com sucesso', async () => {
      // Arrange
      const registerData: RegisterDTO = {
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123',
        nomePublico: 'João',
        localidade: 'Lisboa',
      };

      const hashedPassword = 'hashed_password';
      const expectedUser: UserResponseDTO = {
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
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockAuthRepository.createUser.mockResolvedValue(expectedUser);

      // Act
      const result = await useCase.execute(registerData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockPasswordService.hash).toHaveBeenCalledWith(registerData.senha);
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith({
        ...registerData,
        senha: hashedPassword,
      });
    });

    it('deve lançar erro quando email já está em uso', async () => {
      // Arrange
      const registerData: RegisterDTO = {
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123',
      };

      const existingUser = { id: '1', email: 'joao@example.com' };
      mockAuthRepository.findUserByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(useCase.execute(registerData)).rejects.toThrow('Este email já está em uso.');
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando repositório falha', async () => {
      // Arrange
      const registerData: RegisterDTO = {
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123',
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashed_password');
      mockAuthRepository.createUser.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(registerData)).rejects.toThrow('Database error');
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockPasswordService.hash).toHaveBeenCalledWith(registerData.senha);
    });

    it('deve lançar erro genérico quando erro não é instância de Error', async () => {
      // Arrange
      const registerData: RegisterDTO = {
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123',
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashed_password');
      mockAuthRepository.createUser.mockRejectedValue('Unknown error');

      // Act & Assert
      await expect(useCase.execute(registerData)).rejects.toThrow('Erro ao registrar usuário.');
    });
  });
});