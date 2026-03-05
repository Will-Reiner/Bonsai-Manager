import { GetAllTiposRecursoUseCase } from './get-all-tipos-recurso.use-case';
import { TipoRecursoRepository } from '../types/tipo-recurso.types';
import { TipoRecurso } from '@prisma/client';

describe('GetAllTiposRecursoUseCase', () => {
  let getAllTiposRecursoUseCase: GetAllTiposRecursoUseCase;
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

    getAllTiposRecursoUseCase = new GetAllTiposRecursoUseCase(mockTipoRecursoRepository);
  });

  describe('execute', () => {
    it('deve retornar todos os tipos de recurso', async () => {
      // Arrange
      const mockTiposRecurso: TipoRecurso[] = [
        {
          id: 'tipo-recurso-1',
          nome: 'Fertilizante',
        },
        {
          id: 'tipo-recurso-2',
          nome: 'Substrato',
        },
        {
          id: 'tipo-recurso-3',
          nome: 'Vaso',
        },
      ];

      mockTipoRecursoRepository.findMany.mockResolvedValue(mockTiposRecurso);

      // Act
      const result = await getAllTiposRecursoUseCase.execute();

      // Assert
      expect(mockTipoRecursoRepository.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTiposRecurso);
    });

    it('deve retornar array vazio quando não há tipos de recurso', async () => {
      // Arrange
      mockTipoRecursoRepository.findMany.mockResolvedValue([]);

      // Act
      const result = await getAllTiposRecursoUseCase.execute();

      // Assert
      expect(mockTipoRecursoRepository.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });
});