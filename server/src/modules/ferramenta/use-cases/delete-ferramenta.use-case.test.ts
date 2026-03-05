import { DeleteFerramentaUseCase } from './delete-ferramenta.use-case';
import { FerramentaRepository } from '../types/ferramenta.types';

describe('DeleteFerramentaUseCase', () => {
  let deleteFerramentaUseCase: DeleteFerramentaUseCase;
  let mockFerramentaRepository: jest.Mocked<FerramentaRepository>;

  beforeEach(() => {
    mockFerramentaRepository = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByName: jest.fn(),
      existsByNameExcludingId: jest.fn(),
    };

    deleteFerramentaUseCase = new DeleteFerramentaUseCase(mockFerramentaRepository);
  });

  describe('execute', () => {
    const ferramentaId = 'ferramenta-123';

    it('deve deletar uma ferramenta com sucesso', async () => {
      // Arrange
      mockFerramentaRepository.existsById.mockResolvedValue(true);
      mockFerramentaRepository.delete.mockResolvedValue(undefined);

      // Act
      await deleteFerramentaUseCase.execute(ferramentaId);

      // Assert
      expect(mockFerramentaRepository.existsById).toHaveBeenCalledWith(ferramentaId);
      expect(mockFerramentaRepository.delete).toHaveBeenCalledWith(ferramentaId);
    });

    it('deve lançar erro quando a ferramenta não existe', async () => {
      // Arrange
      mockFerramentaRepository.existsById.mockResolvedValue(false);

      // Act & Assert
      await expect(deleteFerramentaUseCase.execute(ferramentaId))
        .rejects.toThrow('Ferramenta não encontrada.');

      expect(mockFerramentaRepository.existsById).toHaveBeenCalledWith(ferramentaId);
      expect(mockFerramentaRepository.delete).not.toHaveBeenCalled();
    });
  });
});