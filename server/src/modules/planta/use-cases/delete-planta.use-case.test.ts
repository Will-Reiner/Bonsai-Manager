import { DeletePlantaUseCase } from './delete-planta.use-case';
import { PlantaRepository } from '../types/planta.types';

describe('DeletePlantaUseCase', () => {
  let deletePlantaUseCase: DeletePlantaUseCase;
  let mockPlantaRepository: jest.Mocked<PlantaRepository>;

  beforeEach(() => {
    mockPlantaRepository = {
      create: jest.fn(),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
    };

    deletePlantaUseCase = new DeletePlantaUseCase(mockPlantaRepository);
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

    it('deve lançar erro quando planta não existe', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(false);

      // Act & Assert
      await expect(deletePlantaUseCase.execute(plantaId, usuarioId))
        .rejects.toThrow('Planta não encontrada ou não pertence ao usuário');

      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockPlantaRepository.delete).not.toHaveBeenCalled();
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