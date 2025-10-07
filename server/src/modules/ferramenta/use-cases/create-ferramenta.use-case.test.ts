import { CreateFerramentaUseCase } from './create-ferramenta.use-case';
import { FerramentaRepository, CreateFerramentaDTO } from '../types/ferramenta.types';
import { Ferramenta } from '@prisma/client';

describe('CreateFerramentaUseCase', () => {
  let createFerramentaUseCase: CreateFerramentaUseCase;
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

    createFerramentaUseCase = new CreateFerramentaUseCase(mockFerramentaRepository);
  });

  describe('execute', () => {
    const mockCreateFerramentaDTO: CreateFerramentaDTO = {
      nome: 'Tesoura de Poda',
      descricao: 'Tesoura especializada para poda de bonsai',
    };

    const mockCreatedFerramenta: Ferramenta = {
      id: 'ferramenta-123',
      nome: 'Tesoura de Poda',
      descricao: 'Tesoura especializada para poda de bonsai',
    };

    it('deve criar uma ferramenta com sucesso', async () => {
      // Arrange
      mockFerramentaRepository.existsByName.mockResolvedValue(false);
      mockFerramentaRepository.create.mockResolvedValue(mockCreatedFerramenta);

      // Act
      const result = await createFerramentaUseCase.execute(mockCreateFerramentaDTO);

      // Assert
      expect(mockFerramentaRepository.existsByName).toHaveBeenCalledWith('Tesoura de Poda');
      expect(mockFerramentaRepository.create).toHaveBeenCalledWith(mockCreateFerramentaDTO);
      expect(result).toEqual(mockCreatedFerramenta);
    });

    it('deve lançar erro quando já existe uma ferramenta com o mesmo nome', async () => {
      // Arrange
      mockFerramentaRepository.existsByName.mockResolvedValue(true);

      // Act & Assert
      await expect(createFerramentaUseCase.execute(mockCreateFerramentaDTO))
        .rejects.toThrow('Já existe uma ferramenta com este nome.');

      expect(mockFerramentaRepository.existsByName).toHaveBeenCalledWith('Tesoura de Poda');
      expect(mockFerramentaRepository.create).not.toHaveBeenCalled();
    });

    it('deve criar uma ferramenta sem descrição', async () => {
      // Arrange
      const minimalCreateDTO: CreateFerramentaDTO = {
        nome: 'Arame',
      };

      const minimalCreatedFerramenta: Ferramenta = {
        id: 'ferramenta-456',
        nome: 'Arame',
        descricao: null,
      };

      mockFerramentaRepository.existsByName.mockResolvedValue(false);
      mockFerramentaRepository.create.mockResolvedValue(minimalCreatedFerramenta);

      // Act
      const result = await createFerramentaUseCase.execute(minimalCreateDTO);

      // Assert
      expect(mockFerramentaRepository.existsByName).toHaveBeenCalledWith('Arame');
      expect(mockFerramentaRepository.create).toHaveBeenCalledWith(minimalCreateDTO);
      expect(result).toEqual(minimalCreatedFerramenta);
    });
  });
});