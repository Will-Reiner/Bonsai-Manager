import { GetTipoRecursoByIdUseCase } from './get-tipo-recurso-by-id.use-case';
import { TipoRecursoRepository } from '../types/tipo-recurso.types';
import { TipoRecurso } from '@prisma/client';

describe('GetTipoRecursoByIdUseCase', () => {
  let getTipoRecursoByIdUseCase: GetTipoRecursoByIdUseCase;
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

    getTipoRecursoByIdUseCase = new GetTipoRecursoByIdUseCase(mockTipoRecursoRepository);
  });

  describe('execute', () => {
    const mockTipoRecurso: TipoRecurso = {
      id: 'tipo-recurso-123',
      nome: 'Fertilizante',
    };

    it('deve retornar o tipo de recurso quando encontrado', async () => {
      // Arrange
      mockTipoRecursoRepository.findById.mockResolvedValue(mockTipoRecurso);

      // Act
      const result = await getTipoRecursoByIdUseCase.execute('tipo-recurso-123');

      // Assert
      expect(mockTipoRecursoRepository.findById).toHaveBeenCalledWith('tipo-recurso-123');
      expect(result).toEqual(mockTipoRecurso);
    });

    it('deve lançar erro quando o tipo de recurso não é encontrado', async () => {
      // Arrange
      mockTipoRecursoRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(getTipoRecursoByIdUseCase.execute('tipo-recurso-inexistente'))
        .rejects.toThrow('Tipo de recurso não encontrado.');

      expect(mockTipoRecursoRepository.findById).toHaveBeenCalledWith('tipo-recurso-inexistente');
    });
  });
});