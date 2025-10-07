import { GetFerramentaByIdUseCase } from './get-ferramenta-by-id.use-case';
import { FerramentaRepository } from '../types/ferramenta.types';
import { Ferramenta } from '@prisma/client';

describe('GetFerramentaByIdUseCase', () => {
  let getFerramentaByIdUseCase: GetFerramentaByIdUseCase;
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

    getFerramentaByIdUseCase = new GetFerramentaByIdUseCase(mockFerramentaRepository);
  });

  describe('execute', () => {
    const mockFerramenta: Ferramenta = {
      id: 'ferramenta-123',
      nome: 'Tesoura de Poda',
      descricao: 'Tesoura especializada para poda de bonsai',
    };

    it('deve retornar a ferramenta quando encontrada', async () => {
      // Arrange
      mockFerramentaRepository.findById.mockResolvedValue(mockFerramenta);

      // Act
      const result = await getFerramentaByIdUseCase.execute('ferramenta-123');

      // Assert
      expect(mockFerramentaRepository.findById).toHaveBeenCalledWith('ferramenta-123');
      expect(result).toEqual(mockFerramenta);
    });

    it('deve lançar erro quando a ferramenta não é encontrada', async () => {
      // Arrange
      mockFerramentaRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(getFerramentaByIdUseCase.execute('ferramenta-inexistente'))
        .rejects.toThrow('Ferramenta não encontrada.');

      expect(mockFerramentaRepository.findById).toHaveBeenCalledWith('ferramenta-inexistente');
    });
  });
});