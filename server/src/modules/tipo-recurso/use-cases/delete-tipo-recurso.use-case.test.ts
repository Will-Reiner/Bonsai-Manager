import { DeleteTipoRecursoUseCase } from './delete-tipo-recurso.use-case';
import { TipoRecursoRepository } from '../types/tipo-recurso.types';

describe('DeleteTipoRecursoUseCase', () => {
  let deleteTipoRecursoUseCase: DeleteTipoRecursoUseCase;
  let mockTipoRecursoRepository: jest.Mocked<TipoRecursoRepository>;

  beforeEach(() => {
    mockTipoRecursoRepository = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByName: jest.fn(),
      existsByNameExcludingId: jest.fn(),
    };

    deleteTipoRecursoUseCase = new DeleteTipoRecursoUseCase(mockTipoRecursoRepository);
  });

  describe('execute', () => {
    const tipoRecursoId = 'tipo-recurso-123';

    it('deve deletar um tipo de recurso com sucesso', async () => {
      // Arrange
      mockTipoRecursoRepository.existsById.mockResolvedValue(true);
      mockTipoRecursoRepository.delete.mockResolvedValue(undefined);

      // Act
      await deleteTipoRecursoUseCase.execute(tipoRecursoId);

      // Assert
      expect(mockTipoRecursoRepository.existsById).toHaveBeenCalledWith(tipoRecursoId);
      expect(mockTipoRecursoRepository.delete).toHaveBeenCalledWith(tipoRecursoId);
    });

    it('deve lançar erro quando o tipo de recurso não existe', async () => {
      // Arrange
      mockTipoRecursoRepository.existsById.mockResolvedValue(false);

      // Act & Assert
      await expect(deleteTipoRecursoUseCase.execute(tipoRecursoId))
        .rejects.toThrow('Tipo de recurso não encontrado.');

      expect(mockTipoRecursoRepository.existsById).toHaveBeenCalledWith(tipoRecursoId);
      expect(mockTipoRecursoRepository.delete).not.toHaveBeenCalled();
    });
  });
});