import { UpdatePlantaUseCase } from './update-planta.use-case';
import { PlantaRepository, EspecieRepository, UpdatePlantaRequestDTO, PlantaWithEspecie } from '../types/planta.types';
import { ModoAquisicao } from '@prisma/client';

describe('UpdatePlantaUseCase', () => {
  let updatePlantaUseCase: UpdatePlantaUseCase;
  let mockPlantaRepository: jest.Mocked<PlantaRepository>;
  let mockEspecieRepository: jest.Mocked<EspecieRepository>;

  beforeEach(() => {
    mockPlantaRepository = {
      create: jest.fn(),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
    };

    mockEspecieRepository = {
      existsById: jest.fn(),
    };

    updatePlantaUseCase = new UpdatePlantaUseCase(mockPlantaRepository, mockEspecieRepository);
  });

  describe('execute', () => {
    const plantaId = 'planta-123';
    const usuarioId = 'user-123';

    const mockUpdatePlantaDTO: UpdatePlantaRequestDTO = {
      nome: 'Nome Atualizado',
      dataAquisicao: '2024-02-01T00:00:00.000Z',
      modoAquisicao: ModoAquisicao.ESTACA,
      visao: 'Lateral',
      observacoes: 'Observações atualizadas',
      plantaPublica: false,
      historicoPublico: true,
    };

    const mockUpdatedPlanta: PlantaWithEspecie = {
      id: 'planta-123',
      especieId: 'especie-123',
      usuarioId: 'user-123',
      nome: 'Nome Atualizado',
      dataAquisicao: new Date('2024-02-01'),
      modoAquisicao: ModoAquisicao.ESTACA,
      visao: 'Lateral',
      observacoes: 'Observações atualizadas',
      plantaPublica: false,
      historicoPublico: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      especie: {
        nomeCientifico: 'Ficus benjamina',
        nomeComum: 'Ficus',
      },
    };

    it('deve atualizar planta com sucesso quando planta existe e pertence ao usuário', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.update.mockResolvedValue(mockUpdatedPlanta);

      // Act
      const result = await updatePlantaUseCase.execute(plantaId, usuarioId, mockUpdatePlantaDTO);

      // Assert
      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockPlantaRepository.update).toHaveBeenCalledWith(plantaId, usuarioId, {
        ...mockUpdatePlantaDTO,
        dataAquisicao: new Date('2024-02-01T00:00:00.000Z'),
      });
      expect(result).toEqual(mockUpdatedPlanta);
    });

    it('deve lançar erro quando planta não existe ou não pertence ao usuário', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(false);

      // Act & Assert
      await expect(updatePlantaUseCase.execute(plantaId, usuarioId, mockUpdatePlantaDTO))
        .rejects.toThrow('Planta não encontrada ou não pertence ao usuário');

      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockPlantaRepository.update).not.toHaveBeenCalled();
    });

    it('deve validar espécie quando especieId é fornecido na atualização', async () => {
      // Arrange
      const updateWithEspecie = {
        ...mockUpdatePlantaDTO,
        especieId: 'nova-especie-123',
      };

      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockEspecieRepository.existsById.mockResolvedValue(true);
      mockPlantaRepository.update.mockResolvedValue(mockUpdatedPlanta);

      // Act
      const result = await updatePlantaUseCase.execute(plantaId, usuarioId, updateWithEspecie);

      // Assert
      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockEspecieRepository.existsById).toHaveBeenCalledWith('nova-especie-123');
      expect(mockPlantaRepository.update).toHaveBeenCalledWith(plantaId, usuarioId, {
        ...updateWithEspecie,
        dataAquisicao: new Date('2024-02-01T00:00:00.000Z'),
      });
      expect(result).toEqual(mockUpdatedPlanta);
    });

    it('deve lançar erro quando especieId fornecido não existe', async () => {
      // Arrange
      const updateWithEspecie: UpdatePlantaRequestDTO = {
        ...mockUpdatePlantaDTO,
        especieId: 'especie-inexistente',
      };

      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockEspecieRepository.existsById.mockResolvedValue(false);

      // Act & Assert
      await expect(updatePlantaUseCase.execute(plantaId, usuarioId, updateWithEspecie))
        .rejects.toThrow('Espécie não encontrada');

      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockEspecieRepository.existsById).toHaveBeenCalledWith('especie-inexistente');
      expect(mockPlantaRepository.update).not.toHaveBeenCalled();
    });

    it('deve atualizar sem validar espécie quando especieId não é fornecido', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.update.mockResolvedValue(mockUpdatedPlanta);

      // Act
      const result = await updatePlantaUseCase.execute(plantaId, usuarioId, mockUpdatePlantaDTO);

      // Assert
      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockEspecieRepository.existsById).not.toHaveBeenCalled();
      expect(mockPlantaRepository.update).toHaveBeenCalledWith(plantaId, usuarioId, {
        ...mockUpdatePlantaDTO,
        dataAquisicao: new Date('2024-02-01T00:00:00.000Z'),
      });
      expect(result).toEqual(mockUpdatedPlanta);
    });

    it('deve propagar erro do repositório', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.update.mockRejectedValue(new Error('Erro do banco de dados'));

      // Act & Assert
      await expect(updatePlantaUseCase.execute(plantaId, usuarioId, mockUpdatePlantaDTO))
        .rejects.toThrow('Erro do banco de dados');

      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockPlantaRepository.update).toHaveBeenCalledWith(plantaId, usuarioId, {
        ...mockUpdatePlantaDTO,
        dataAquisicao: new Date('2024-02-01T00:00:00.000Z'),
      });
    });
  });
});