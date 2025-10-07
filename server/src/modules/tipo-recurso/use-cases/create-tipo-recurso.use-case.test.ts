import { CreateTipoRecursoUseCase } from './create-tipo-recurso.use-case';
import { TipoRecursoRepository, CreateTipoRecursoDTO } from '../types/tipo-recurso.types';
import { TipoRecurso } from '@prisma/client';

describe('CreateTipoRecursoUseCase', () => {
  let createTipoRecursoUseCase: CreateTipoRecursoUseCase;
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

    createTipoRecursoUseCase = new CreateTipoRecursoUseCase(mockTipoRecursoRepository);
  });

  describe('execute', () => {
    const mockCreateTipoRecursoDTO: CreateTipoRecursoDTO = {
      nome: 'Fertilizante',
    };

    const mockCreatedTipoRecurso: TipoRecurso = {
      id: 'tipo-recurso-123',
      nome: 'Fertilizante',
    };

    it('deve criar um tipo de recurso com sucesso', async () => {
      // Arrange
      mockTipoRecursoRepository.existsByName.mockResolvedValue(false);
      mockTipoRecursoRepository.create.mockResolvedValue(mockCreatedTipoRecurso);

      // Act
      const result = await createTipoRecursoUseCase.execute(mockCreateTipoRecursoDTO);

      // Assert
      expect(mockTipoRecursoRepository.existsByName).toHaveBeenCalledWith('Fertilizante');
      expect(mockTipoRecursoRepository.create).toHaveBeenCalledWith(mockCreateTipoRecursoDTO);
      expect(result).toEqual(mockCreatedTipoRecurso);
    });

    it('deve lançar erro quando já existe um tipo de recurso com o mesmo nome', async () => {
      // Arrange
      mockTipoRecursoRepository.existsByName.mockResolvedValue(true);

      // Act & Assert
      await expect(createTipoRecursoUseCase.execute(mockCreateTipoRecursoDTO))
        .rejects.toThrow('Já existe um tipo de recurso com este nome.');

      expect(mockTipoRecursoRepository.existsByName).toHaveBeenCalledWith('Fertilizante');
      expect(mockTipoRecursoRepository.create).not.toHaveBeenCalled();
    });
  });
});