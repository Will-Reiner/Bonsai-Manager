import { UpdateTipoRecursoUseCase } from './update-tipo-recurso.use-case';
import { TipoRecursoRepository, UpdateTipoRecursoDTO } from '../types/tipo-recurso.types';
import { TipoRecurso } from '@prisma/client';

describe('UpdateTipoRecursoUseCase', () => {
  let updateTipoRecursoUseCase: UpdateTipoRecursoUseCase;
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

    updateTipoRecursoUseCase = new UpdateTipoRecursoUseCase(mockTipoRecursoRepository);
  });

  describe('execute', () => {
    const tipoRecursoId = 'tipo-recurso-123';
    const mockUpdatedTipoRecurso: TipoRecurso = {
      id: tipoRecursoId,
      nome: 'Fertilizante Atualizado',
    };

    it('deve atualizar um tipo de recurso com sucesso', async () => {
      // Arrange
      const updateData: UpdateTipoRecursoDTO = {
        nome: 'Fertilizante Atualizado',
      };

      mockTipoRecursoRepository.existsById.mockResolvedValue(true);
      mockTipoRecursoRepository.existsByNameExcludingId.mockResolvedValue(false);
      mockTipoRecursoRepository.update.mockResolvedValue(mockUpdatedTipoRecurso);

      // Act
      const result = await updateTipoRecursoUseCase.execute(tipoRecursoId, updateData);

      // Assert
      expect(mockTipoRecursoRepository.existsById).toHaveBeenCalledWith(tipoRecursoId);
      expect(mockTipoRecursoRepository.existsByNameExcludingId).toHaveBeenCalledWith('Fertilizante Atualizado', tipoRecursoId);
      expect(mockTipoRecursoRepository.update).toHaveBeenCalledWith(tipoRecursoId, updateData);
      expect(result).toEqual(mockUpdatedTipoRecurso);
    });

    it('deve lançar erro quando o tipo de recurso não existe', async () => {
      // Arrange
      const updateData: UpdateTipoRecursoDTO = {
        nome: 'Fertilizante Atualizado',
      };

      mockTipoRecursoRepository.existsById.mockResolvedValue(false);

      // Act & Assert
      await expect(updateTipoRecursoUseCase.execute(tipoRecursoId, updateData))
        .rejects.toThrow('Tipo de recurso não encontrado.');

      expect(mockTipoRecursoRepository.existsById).toHaveBeenCalledWith(tipoRecursoId);
      expect(mockTipoRecursoRepository.existsByNameExcludingId).not.toHaveBeenCalled();
      expect(mockTipoRecursoRepository.update).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando já existe outro tipo de recurso com o mesmo nome', async () => {
      // Arrange
      const updateData: UpdateTipoRecursoDTO = {
        nome: 'Nome Já Existente',
      };

      mockTipoRecursoRepository.existsById.mockResolvedValue(true);
      mockTipoRecursoRepository.existsByNameExcludingId.mockResolvedValue(true);

      // Act & Assert
      await expect(updateTipoRecursoUseCase.execute(tipoRecursoId, updateData))
        .rejects.toThrow('Já existe um tipo de recurso com este nome.');

      expect(mockTipoRecursoRepository.existsById).toHaveBeenCalledWith(tipoRecursoId);
      expect(mockTipoRecursoRepository.existsByNameExcludingId).toHaveBeenCalledWith('Nome Já Existente', tipoRecursoId);
      expect(mockTipoRecursoRepository.update).not.toHaveBeenCalled();
    });

    it('deve atualizar sem verificar nome quando nome não é fornecido', async () => {
      // Arrange
      const updateData: UpdateTipoRecursoDTO = {};

      const updatedTipoRecurso: TipoRecurso = {
        id: tipoRecursoId,
        nome: 'Nome Original',
      };

      mockTipoRecursoRepository.existsById.mockResolvedValue(true);
      mockTipoRecursoRepository.update.mockResolvedValue(updatedTipoRecurso);

      // Act
      const result = await updateTipoRecursoUseCase.execute(tipoRecursoId, updateData);

      // Assert
      expect(mockTipoRecursoRepository.existsById).toHaveBeenCalledWith(tipoRecursoId);
      expect(mockTipoRecursoRepository.existsByNameExcludingId).not.toHaveBeenCalled();
      expect(mockTipoRecursoRepository.update).toHaveBeenCalledWith(tipoRecursoId, updateData);
      expect(result).toEqual(updatedTipoRecurso);
    });
  });
});