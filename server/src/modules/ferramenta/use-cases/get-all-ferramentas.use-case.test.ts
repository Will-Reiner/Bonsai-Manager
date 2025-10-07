import { GetAllFerramentasUseCase } from './get-all-ferramentas.use-case';
import { FerramentaRepository } from '../types/ferramenta.types';
import { Ferramenta } from '@prisma/client';

describe('GetAllFerramentasUseCase', () => {
  let getAllFerramentasUseCase: GetAllFerramentasUseCase;
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

    getAllFerramentasUseCase = new GetAllFerramentasUseCase(mockFerramentaRepository);
  });

  describe('execute', () => {
    it('deve retornar todas as ferramentas', async () => {
      // Arrange
      const mockFerramentas: Ferramenta[] = [
        {
          id: 'ferramenta-1',
          nome: 'Tesoura de Poda',
          descricao: 'Tesoura especializada para poda de bonsai',
        },
        {
          id: 'ferramenta-2',
          nome: 'Arame',
          descricao: null,
        },
        {
          id: 'ferramenta-3',
          nome: 'Regador',
          descricao: 'Regador pequeno para bonsai',
        },
      ];

      mockFerramentaRepository.findMany.mockResolvedValue(mockFerramentas);

      // Act
      const result = await getAllFerramentasUseCase.execute();

      // Assert
      expect(mockFerramentaRepository.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFerramentas);
    });

    it('deve retornar array vazio quando não há ferramentas', async () => {
      // Arrange
      mockFerramentaRepository.findMany.mockResolvedValue([]);

      // Act
      const result = await getAllFerramentasUseCase.execute();

      // Assert
      expect(mockFerramentaRepository.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });
});