import { DeleteFotoUseCase } from './delete-foto.use-case';
import { FotoRepository } from '../foto.types';
import { LimpezaDeMidia } from '../../midia/midia.types';

describe('DeleteFotoUseCase', () => {
  let deleteFotoUseCase: DeleteFotoUseCase;
  let mockFotoRepository: jest.Mocked<FotoRepository>;
  let mockLimpeza: jest.Mocked<LimpezaDeMidia>;

  const fotoId = 'foto-1';
  const usuarioId = 'user-1';
  const foto = {
    id: fotoId,
    caminhoArquivo: 'https://cdn/foto-1.webp',
    thumbnailUrl: null,
    plantaId: 'planta-1',
    usuarioId,
  };

  beforeEach(() => {
    mockFotoRepository = {
      create: jest.fn(),
      findManyByPlanta: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      checkPlantaBelongsToUser: jest.fn(),
      findCapaDaPlanta: jest.fn(),
      findFotoMaisRecente: jest.fn(),
      updateCapaDaPlanta: jest.fn(),
    };
    mockLimpeza = { execute: jest.fn().mockResolvedValue(undefined) };

    deleteFotoUseCase = new DeleteFotoUseCase(mockFotoRepository, mockLimpeza);
  });

  it('should delete foto successfully', async () => {
    mockFotoRepository.findByIdAndUser.mockResolvedValue(foto);
    mockFotoRepository.findCapaDaPlanta.mockResolvedValue('https://cdn/outra.webp');
    mockFotoRepository.delete.mockResolvedValue(undefined);

    await deleteFotoUseCase.execute(fotoId, usuarioId);

    expect(mockFotoRepository.findByIdAndUser).toHaveBeenCalledWith(fotoId, usuarioId);
    expect(mockFotoRepository.delete).toHaveBeenCalledWith(fotoId);
  });

  it('should throw error when foto does not exist or does not belong to user', async () => {
    mockFotoRepository.findByIdAndUser.mockResolvedValue(null);

    await expect(deleteFotoUseCase.execute(fotoId, usuarioId)).rejects.toThrow(
      'Foto não encontrada ou não pertence a si.'
    );

    expect(mockFotoRepository.findByIdAndUser).toHaveBeenCalledWith(fotoId, usuarioId);
    expect(mockFotoRepository.delete).not.toHaveBeenCalled();
    expect(mockLimpeza.execute).not.toHaveBeenCalled();
  });

  it('deve enviar o arquivo e a thumbnail para a limpeza depois de deletar', async () => {
    // Arrange
    const ordem: string[] = [];
    mockFotoRepository.findByIdAndUser.mockResolvedValue({ ...foto, thumbnailUrl: 'https://cdn/thumb.webp' });
    mockFotoRepository.findCapaDaPlanta.mockResolvedValue(null);
    mockFotoRepository.delete.mockImplementation(async () => {
      ordem.push('delete');
    });
    mockLimpeza.execute.mockImplementation(async () => {
      ordem.push('limpeza');
    });

    // Act
    await deleteFotoUseCase.execute(fotoId, usuarioId);

    // Assert
    expect(mockLimpeza.execute).toHaveBeenCalledWith(['https://cdn/foto-1.webp', 'https://cdn/thumb.webp']);
    expect(ordem).toEqual(['delete', 'limpeza']);
  });

  it('deve usar a foto mais recente como capa quando a foto deletada era a capa', async () => {
    // Arrange
    const ordem: string[] = [];
    mockFotoRepository.findByIdAndUser.mockResolvedValue(foto);
    mockFotoRepository.findCapaDaPlanta.mockResolvedValue('https://cdn/foto-1.webp');
    mockFotoRepository.findFotoMaisRecente.mockResolvedValue('https://cdn/foto-2.webp');
    mockFotoRepository.delete.mockImplementation(async () => {
      ordem.push('delete');
    });
    mockFotoRepository.updateCapaDaPlanta.mockImplementation(async () => {
      ordem.push('capa');
    });
    mockLimpeza.execute.mockImplementation(async () => {
      ordem.push('limpeza');
    });

    // Act
    await deleteFotoUseCase.execute(fotoId, usuarioId);

    // Assert
    expect(mockFotoRepository.findCapaDaPlanta).toHaveBeenCalledWith('planta-1');
    expect(mockFotoRepository.findFotoMaisRecente).toHaveBeenCalledWith('planta-1');
    expect(mockFotoRepository.updateCapaDaPlanta).toHaveBeenCalledWith('planta-1', 'https://cdn/foto-2.webp');
    // A capa precisa trocar antes da limpeza, senão a URL ainda conta como "em uso"
    expect(ordem).toEqual(['delete', 'capa', 'limpeza']);
  });

  it('deve deixar a planta sem capa quando a foto deletada era a capa e a única da galeria', async () => {
    // Arrange
    mockFotoRepository.findByIdAndUser.mockResolvedValue(foto);
    mockFotoRepository.findCapaDaPlanta.mockResolvedValue('https://cdn/foto-1.webp');
    mockFotoRepository.findFotoMaisRecente.mockResolvedValue(null);

    // Act
    await deleteFotoUseCase.execute(fotoId, usuarioId);

    // Assert
    expect(mockFotoRepository.updateCapaDaPlanta).toHaveBeenCalledWith('planta-1', null);
  });

  it('não deve mexer na capa quando a foto deletada não era a capa', async () => {
    // Arrange
    mockFotoRepository.findByIdAndUser.mockResolvedValue(foto);
    mockFotoRepository.findCapaDaPlanta.mockResolvedValue('https://cdn/outra.webp');

    // Act
    await deleteFotoUseCase.execute(fotoId, usuarioId);

    // Assert
    expect(mockFotoRepository.findFotoMaisRecente).not.toHaveBeenCalled();
    expect(mockFotoRepository.updateCapaDaPlanta).not.toHaveBeenCalled();
  });

  it('não deve consultar capa quando a foto não pertence a uma planta', async () => {
    // Arrange
    mockFotoRepository.findByIdAndUser.mockResolvedValue({ ...foto, plantaId: null });

    // Act
    await deleteFotoUseCase.execute(fotoId, usuarioId);

    // Assert
    expect(mockFotoRepository.findCapaDaPlanta).not.toHaveBeenCalled();
    expect(mockLimpeza.execute).toHaveBeenCalledWith(['https://cdn/foto-1.webp', null]);
  });
});
