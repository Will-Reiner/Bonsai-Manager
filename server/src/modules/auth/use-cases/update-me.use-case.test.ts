import { UpdateMeUseCase } from './update-me.use-case';
import { AuthRepository, GetMeResponseDTO, UpdateMeDTO, UserResponseDTO } from '../types/auth.types';
import { LimpezaDeMidia } from '../../midia/midia.types';

describe('UpdateMeUseCase', () => {
  let useCase: UpdateMeUseCase;
  let mockAuthRepository: jest.Mocked<AuthRepository>;
  let mockLimpeza: jest.Mocked<LimpezaDeMidia>;

  beforeEach(() => {
    mockAuthRepository = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
      findUserById: jest.fn(),
      updateUser: jest.fn(),
    };
    mockLimpeza = { execute: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpdateMeUseCase(mockAuthRepository, mockLimpeza);
  });

  describe('execute', () => {
    it('deve atualizar dados do usuário com sucesso', async () => {
      // Arrange
      const updateData: UpdateMeDTO = {
        userId: '1',
        nome: 'João Silva Atualizado',
        nomePublico: 'João Novo',
        localidade: 'Porto',
        bio: 'Nova bio',
        fotoPerfilUrl: 'https://example.com/foto.jpg',
        perfilPublico: true,
        recursosHabilitado: true,
      };

      const existingUser = {
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
        seguindo: [],
        seguidores: [],
        plantas: [],
      };

      const updatedUser = {
        id: '1',
        nome: 'João Silva Atualizado',
        email: 'joao@example.com',
        nomePublico: 'João Novo',
        localidade: 'Porto',
        fotoPerfilUrl: 'https://example.com/foto.jpg',
        bio: 'Nova bio',
        perfilPublico: true,
        recursosHabilitado: true,
        createdAt: existingUser.createdAt,
        role: 'USER',
      };

      const expectedResponse: UserResponseDTO = {
        id: '1',
        nome: 'João Silva Atualizado',
        email: 'joao@example.com',
        nomePublico: 'João Novo',
        localidade: 'Porto',
        fotoPerfilUrl: 'https://example.com/foto.jpg',
        bio: 'Nova bio',
        perfilPublico: true,
        recursosHabilitado: true,
        createdAt: existingUser.createdAt,
        role: 'USER',
      };

      mockAuthRepository.findUserById.mockResolvedValue(existingUser);
      mockAuthRepository.updateUser.mockResolvedValue(updatedUser);

      // Act
      const result = await useCase.execute(updateData);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(updateData.userId);
      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(updateData.userId, {
        nome: updateData.nome,
        nomePublico: updateData.nomePublico,
        localidade: updateData.localidade,
        bio: updateData.bio,
        fotoPerfilUrl: updateData.fotoPerfilUrl,
        perfilPublico: updateData.perfilPublico,
        recursosHabilitado: updateData.recursosHabilitado,
      });
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      // Arrange
      const updateData: UpdateMeDTO = {
        userId: '1',
        nome: 'João Silva Atualizado',
        perfilPublico: true,
      };

      const existingUser = {
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
        seguindo: [],
        seguidores: [],
        plantas: [],
      };

      const updatedUser = {
        ...existingUser,
        nome: 'João Silva Atualizado',
        perfilPublico: true,
      };

      mockAuthRepository.findUserById.mockResolvedValue(existingUser);
      mockAuthRepository.updateUser.mockResolvedValue(updatedUser);

      // Act
      const result = await useCase.execute(updateData);

      // Assert
      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(updateData.userId, {
        nome: updateData.nome,
        perfilPublico: updateData.perfilPublico,
      });
    });

    it('deve lançar erro quando usuário não existe', async () => {
      // Arrange
      const updateData: UpdateMeDTO = {
        userId: '1',
        nome: 'João Silva Atualizado',
      };

      mockAuthRepository.findUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(updateData)).rejects.toThrow('Utilizador não encontrado.');
      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(updateData.userId);
      expect(mockAuthRepository.updateUser).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando repositório falha na busca', async () => {
      // Arrange
      const updateData: UpdateMeDTO = {
        userId: '1',
        nome: 'João Silva Atualizado',
      };

      mockAuthRepository.findUserById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(updateData)).rejects.toThrow('Database error');
      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(updateData.userId);
    });

    it('deve lançar erro quando repositório falha na atualização', async () => {
      // Arrange
      const updateData: UpdateMeDTO = {
        userId: '1',
        nome: 'João Silva Atualizado',
      };

      const existingUser = {
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
        seguindo: [],
        seguidores: [],
        plantas: [],
      };

      mockAuthRepository.findUserById.mockResolvedValue(existingUser);
      mockAuthRepository.updateUser.mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(useCase.execute(updateData)).rejects.toThrow('Update failed');
      expect(mockAuthRepository.updateUser).toHaveBeenCalled();
    });

    it('deve lançar erro genérico quando erro não é instância de Error', async () => {
      // Arrange
      const updateData: UpdateMeDTO = {
        userId: '1',
        nome: 'João Silva Atualizado',
      };

      mockAuthRepository.findUserById.mockRejectedValue('Unknown error');

      // Act & Assert
      await expect(useCase.execute(updateData)).rejects.toThrow('Erro ao atualizar dados do utilizador.');
    });
  });
  describe('troca de foto de perfil', () => {
    const usuario = (fotoPerfilUrl: string | null) =>
      ({ id: '1', nome: 'João', fotoPerfilUrl, seguindo: [], seguidores: [], plantas: [] }) as unknown as GetMeResponseDTO;

    beforeEach(() => {
      mockAuthRepository.updateUser.mockResolvedValue(usuario('https://cdn/nova.webp'));
    });

    it('deve enviar a foto de perfil antiga para a limpeza depois de atualizar', async () => {
      // Arrange
      const ordem: string[] = [];
      mockAuthRepository.findUserById.mockResolvedValue(usuario('https://cdn/antiga.webp'));
      mockAuthRepository.updateUser.mockImplementation(async () => {
        ordem.push('update');
        return usuario('https://cdn/nova.webp');
      });
      mockLimpeza.execute.mockImplementation(async () => {
        ordem.push('limpeza');
      });

      // Act
      await useCase.execute({ userId: '1', fotoPerfilUrl: 'https://cdn/nova.webp' });

      // Assert
      expect(mockLimpeza.execute).toHaveBeenCalledWith(['https://cdn/antiga.webp']);
      expect(ordem).toEqual(['update', 'limpeza']);
    });

    it('não deve limpar nada quando a foto de perfil não muda', async () => {
      // Arrange
      mockAuthRepository.findUserById.mockResolvedValue(usuario('https://cdn/nova.webp'));

      // Act
      await useCase.execute({ userId: '1', fotoPerfilUrl: 'https://cdn/nova.webp' });

      // Assert
      expect(mockLimpeza.execute).not.toHaveBeenCalled();
    });

    it('não deve limpar nada quando a foto de perfil não está na atualização', async () => {
      // Arrange
      mockAuthRepository.findUserById.mockResolvedValue(usuario('https://cdn/antiga.webp'));

      // Act
      await useCase.execute({ userId: '1', nome: 'Outro nome' });

      // Assert
      expect(mockLimpeza.execute).not.toHaveBeenCalled();
    });

    it('não deve limpar nada quando o usuário não tinha foto de perfil', async () => {
      // Arrange
      mockAuthRepository.findUserById.mockResolvedValue(usuario(null));

      // Act
      await useCase.execute({ userId: '1', fotoPerfilUrl: 'https://cdn/nova.webp' });

      // Assert
      expect(mockLimpeza.execute).not.toHaveBeenCalled();
    });
  });
});