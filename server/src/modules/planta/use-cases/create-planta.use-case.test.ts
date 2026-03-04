import { CreatePlantaUseCase } from './create-planta.use-case';
import { PlantaRepository, EspecieRepository, CreatePlantaRequestDTO, PlantaWithEspecie } from '../types/planta.types';
import { ModoAquisicao } from '@prisma/client';

describe('CreatePlantaUseCase', () => {
  let createPlantaUseCase: CreatePlantaUseCase;
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

    createPlantaUseCase = new CreatePlantaUseCase(mockPlantaRepository, mockEspecieRepository);
  });

  describe('execute', () => {
    const mockCreatePlantaDTO: CreatePlantaRequestDTO = {
      especieId: 'especie-123',
      usuarioId: 'user-123',
      nome: 'Minha Planta',
      dataAquisicao: '2024-01-01T00:00:00.000Z',
      modoAquisicao: ModoAquisicao.SEMENTE,

      observacoes: 'Planta jovem',
      plantaPublica: true,
      historicoPublico: false,
    };

    const mockCreatedPlanta: PlantaWithEspecie = {
      id: 'planta-123',
      especieId: 'especie-123',
      usuarioId: 'user-123',
      nome: 'Minha Planta',
      identificador: null,
      dataAquisicao: new Date('2024-01-01'),
      modoAquisicao: ModoAquisicao.SEMENTE,

      observacoes: 'Planta jovem',
      fotoCapaUrl: null,
      plantaPublica: true,
      historicoPublico: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      especie: {
        nomeCientifico: 'Ficus benjamina',
        nomeComum: 'Ficus',
      },
    };

    it('deve criar uma planta com sucesso quando a espécie existe', async () => {
      // Arrange
      mockEspecieRepository.existsById.mockResolvedValue(true);
      mockPlantaRepository.create.mockResolvedValue(mockCreatedPlanta);

      // Act
      const result = await createPlantaUseCase.execute(mockCreatePlantaDTO);

      // Assert
      expect(mockEspecieRepository.existsById).toHaveBeenCalledWith('especie-123');
      expect(mockPlantaRepository.create).toHaveBeenCalledWith({
        ...mockCreatePlantaDTO,
        dataAquisicao: new Date('2024-01-01T00:00:00.000Z'),
      });
      expect(result).toEqual(mockCreatedPlanta);
    });

    it('deve lançar erro quando a espécie não existe', async () => {
      // Arrange
      mockEspecieRepository.existsById.mockResolvedValue(false);

      // Act & Assert
      await expect(createPlantaUseCase.execute(mockCreatePlantaDTO))
        .rejects.toThrow('Espécie não encontrada');

      expect(mockEspecieRepository.existsById).toHaveBeenCalledWith('especie-123');
      expect(mockPlantaRepository.create).not.toHaveBeenCalled();
    });

    it('deve criar uma planta com campos opcionais nulos', async () => {
      // Arrange
      const minimalCreateDTO: CreatePlantaRequestDTO = {
      especieId: 'especie-123',
      usuarioId: 'user-123',
    };

      const minimalCreatedPlanta: PlantaWithEspecie = {
        ...mockCreatedPlanta,
        nome: null,
        dataAquisicao: null,
        modoAquisicao: null,

        observacoes: null,
        fotoCapaUrl: null,
        plantaPublica: false,
        historicoPublico: false,
      };

      mockEspecieRepository.existsById.mockResolvedValue(true);
      mockPlantaRepository.create.mockResolvedValue(minimalCreatedPlanta);

      // Act
      const result = await createPlantaUseCase.execute(minimalCreateDTO);

      // Assert
      expect(mockEspecieRepository.existsById).toHaveBeenCalledWith('especie-123');
      expect(mockPlantaRepository.create).toHaveBeenCalledWith(minimalCreateDTO);
      expect(result).toEqual(minimalCreatedPlanta);
    });

    it('deve criar uma planta com fotoCapaUrl', async () => {
      // Arrange
      const createDTOWithCover: CreatePlantaRequestDTO = {
        ...mockCreatePlantaDTO,
        fotoCapaUrl: 'https://r2.example.com/cover.webp',
      };

      const plantaWithCover: PlantaWithEspecie = {
        ...mockCreatedPlanta,
        fotoCapaUrl: 'https://r2.example.com/cover.webp',
      };

      mockEspecieRepository.existsById.mockResolvedValue(true);
      mockPlantaRepository.create.mockResolvedValue(plantaWithCover);

      // Act
      const result = await createPlantaUseCase.execute(createDTOWithCover);

      // Assert
      expect(mockPlantaRepository.create).toHaveBeenCalledWith({
        ...createDTOWithCover,
        dataAquisicao: new Date('2024-01-01T00:00:00.000Z'),
      });
      expect(result.fotoCapaUrl).toBe('https://r2.example.com/cover.webp');
    });

    it('deve propagar erro do repositório', async () => {
      // Arrange
      mockEspecieRepository.existsById.mockResolvedValue(true);
      mockPlantaRepository.create.mockRejectedValue(new Error('Erro do banco de dados'));

      // Act & Assert
      await expect(createPlantaUseCase.execute(mockCreatePlantaDTO))
        .rejects.toThrow('Erro do banco de dados');

      expect(mockEspecieRepository.existsById).toHaveBeenCalledWith('especie-123');
      expect(mockPlantaRepository.create).toHaveBeenCalledWith({
        ...mockCreatePlantaDTO,
        dataAquisicao: new Date('2024-01-01T00:00:00.000Z'),
      });
    });
  });
});