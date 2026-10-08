import { DeletePlantaUseCase } from './delete-planta.use-case';
import { PlantaRepository } from '../types/planta.types';
import { LimpezaDeMidia } from '../../midia/midia.types';

describe('DeletePlantaUseCase', () => {
  let deletePlantaUseCase: DeletePlantaUseCase;
  let mockPlantaRepository: jest.Mocked<PlantaRepository>;
  let mockLimpeza: jest.Mocked<LimpezaDeMidia>;

  beforeEach(() => {
    mockPlantaRepository = {
      create: jest.fn(),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      maiorIdentificador: jest.fn().mockResolvedValue(0),
      findUrlsDeMidia: jest.fn(),
      resolverGruposVencidos: jest.fn().mockResolvedValue(undefined),
      estadoPreTransplante: jest.fn().mockResolvedValue({ dias: 30, plantas: [], pendentes: [] }),
      aplicarMudancasPre: jest.fn().mockResolvedValue(undefined),
    };

    mockLimpeza = { execute: jest.fn().mockResolvedValue(undefined) };
    mockPlantaRepository.findUrlsDeMidia.mockResolvedValue([]);

    deletePlantaUseCase = new DeletePlantaUseCase(mockPlantaRepository, mockLimpeza);
  });

  describe('execute', () => {
    const plantaId = 'planta-123';
    const usuarioId = 'user-123';

    it('deve deletar planta com sucesso quando planta existe e pertence ao usuário', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.delete.mockResolvedValue();

      // Act
      await deletePlantaUseCase.execute(plantaId, usuarioId);

      // Assert
      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockPlantaRepository.delete).toHaveBeenCalledWith(plantaId, usuarioId);
    });

    it('deve remover do storage a capa e as mídias da galeria depois de deletar a planta', async () => {
      // Arrange
      const urls = ['https://cdn/capa.webp', 'https://cdn/foto1.webp', 'https://cdn/video-thumb.webp'];
      const ordem: string[] = [];
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.findUrlsDeMidia.mockResolvedValue(urls);
      mockPlantaRepository.delete.mockImplementation(async () => {
        ordem.push('delete');
      });
      mockLimpeza.execute.mockImplementation(async () => {
        ordem.push('limpeza');
      });

      // Act
      await deletePlantaUseCase.execute(plantaId, usuarioId);

      // Assert
      expect(mockPlantaRepository.findUrlsDeMidia).toHaveBeenCalledWith(plantaId);
      expect(mockLimpeza.execute).toHaveBeenCalledWith(urls);
      expect(ordem).toEqual(['delete', 'limpeza']);
    });

    it('não deve remover mídias quando a deleção da planta falha', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.findUrlsDeMidia.mockResolvedValue(['https://cdn/capa.webp']);
      mockPlantaRepository.delete.mockRejectedValue(new Error('Erro ao deletar'));

      // Act & Assert
      await expect(deletePlantaUseCase.execute(plantaId, usuarioId)).rejects.toThrow('Erro ao deletar');
      expect(mockLimpeza.execute).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando planta não existe', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(false);

      // Act & Assert
      await expect(deletePlantaUseCase.execute(plantaId, usuarioId))
        .rejects.toThrow('Planta não encontrada ou não pertence ao usuário');

      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockPlantaRepository.delete).not.toHaveBeenCalled();
      expect(mockLimpeza.execute).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando planta não pertence ao usuário', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(false);

      // Act & Assert
      await expect(deletePlantaUseCase.execute(plantaId, 'outro-usuario'))
        .rejects.toThrow('Planta não encontrada ou não pertence ao usuário');

      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, 'outro-usuario');
      expect(mockPlantaRepository.delete).not.toHaveBeenCalled();
    });

    it('deve propagar erro do repositório na verificação de existência', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockRejectedValue(new Error('Erro do banco de dados'));

      // Act & Assert
      await expect(deletePlantaUseCase.execute(plantaId, usuarioId))
        .rejects.toThrow('Erro do banco de dados');

      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockPlantaRepository.delete).not.toHaveBeenCalled();
    });

    it('deve propagar erro do repositório na deleção', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.delete.mockRejectedValue(new Error('Erro ao deletar'));

      // Act & Assert
      await expect(deletePlantaUseCase.execute(plantaId, usuarioId))
        .rejects.toThrow('Erro ao deletar');

      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockPlantaRepository.delete).toHaveBeenCalledWith(plantaId, usuarioId);
    });
  });
});