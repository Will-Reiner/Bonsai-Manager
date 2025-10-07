import { UpdateFerramentaUseCase } from './update-ferramenta.use-case';
import { FerramentaRepository, UpdateFerramentaDTO } from '../types/ferramenta.types';
import { Ferramenta } from '@prisma/client';

describe('UpdateFerramentaUseCase', () => {
  let updateFerramentaUseCase: UpdateFerramentaUseCase;
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

    updateFerramentaUseCase = new UpdateFerramentaUseCase(mockFerramentaRepository);
  });

  describe('execute', () => {
    const ferramentaId = 'ferramenta-123';
    const mockUpdatedFerramenta: Ferramenta = {
      id: ferramentaId,
      nome: 'Tesoura de Poda Atualizada',
      descricao: 'Descrição atualizada',
    };

    it('deve atualizar uma ferramenta com sucesso', async () => {
      // Arrange
      const updateData: UpdateFerramentaDTO = {
        nome: 'Tesoura de Poda Atualizada',
        descricao: 'Descrição atualizada',
      };

      mockFerramentaRepository.existsById.mockResolvedValue(true);
      mockFerramentaRepository.existsByNameExcludingId.mockResolvedValue(false);
      mockFerramentaRepository.update.mockResolvedValue(mockUpdatedFerramenta);

      // Act
      const result = await updateFerramentaUseCase.execute(ferramentaId, updateData);

      // Assert
      expect(mockFerramentaRepository.existsById).toHaveBeenCalledWith(ferramentaId);
      expect(mockFerramentaRepository.existsByNameExcludingId).toHaveBeenCalledWith('Tesoura de Poda Atualizada', ferramentaId);
      expect(mockFerramentaRepository.update).toHaveBeenCalledWith(ferramentaId, updateData);
      expect(result).toEqual(mockUpdatedFerramenta);
    });

    it('deve lançar erro quando a ferramenta não existe', async () => {
      // Arrange
      const updateData: UpdateFerramentaDTO = {
        nome: 'Tesoura de Poda Atualizada',
      };

      mockFerramentaRepository.existsById.mockResolvedValue(false);

      // Act & Assert
      await expect(updateFerramentaUseCase.execute(ferramentaId, updateData))
        .rejects.toThrow('Ferramenta não encontrada.');

      expect(mockFerramentaRepository.existsById).toHaveBeenCalledWith(ferramentaId);
      expect(mockFerramentaRepository.existsByNameExcludingId).not.toHaveBeenCalled();
      expect(mockFerramentaRepository.update).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando já existe outra ferramenta com o mesmo nome', async () => {
      // Arrange
      const updateData: UpdateFerramentaDTO = {
        nome: 'Nome Já Existente',
      };

      mockFerramentaRepository.existsById.mockResolvedValue(true);
      mockFerramentaRepository.existsByNameExcludingId.mockResolvedValue(true);

      // Act & Assert
      await expect(updateFerramentaUseCase.execute(ferramentaId, updateData))
        .rejects.toThrow('Já existe uma ferramenta com este nome.');

      expect(mockFerramentaRepository.existsById).toHaveBeenCalledWith(ferramentaId);
      expect(mockFerramentaRepository.existsByNameExcludingId).toHaveBeenCalledWith('Nome Já Existente', ferramentaId);
      expect(mockFerramentaRepository.update).not.toHaveBeenCalled();
    });

    it('deve atualizar apenas a descrição sem verificar nome', async () => {
      // Arrange
      const updateData: UpdateFerramentaDTO = {
        descricao: 'Nova descrição',
      };

      const updatedFerramenta: Ferramenta = {
        id: ferramentaId,
        nome: 'Nome Original',
        descricao: 'Nova descrição',
      };

      mockFerramentaRepository.existsById.mockResolvedValue(true);
      mockFerramentaRepository.update.mockResolvedValue(updatedFerramenta);

      // Act
      const result = await updateFerramentaUseCase.execute(ferramentaId, updateData);

      // Assert
      expect(mockFerramentaRepository.existsById).toHaveBeenCalledWith(ferramentaId);
      expect(mockFerramentaRepository.existsByNameExcludingId).not.toHaveBeenCalled();
      expect(mockFerramentaRepository.update).toHaveBeenCalledWith(ferramentaId, updateData);
      expect(result).toEqual(updatedFerramenta);
    });
  });
});