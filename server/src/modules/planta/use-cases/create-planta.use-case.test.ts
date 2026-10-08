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
      maiorIdentificador: jest.fn().mockResolvedValue(0),
      findUrlsDeMidia: jest.fn(),
      resolverGruposVencidos: jest.fn().mockResolvedValue(undefined),
      estadoPreTransplante: jest.fn().mockResolvedValue({ dias: 30, plantas: [], pendentes: [] }),
      aplicarMudancasPre: jest.fn().mockResolvedValue(undefined),
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
      identificador: 1,
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
        identificador: 1,
      });
      expect(result).toEqual(mockCreatedPlanta);
    });

    it('deve criar uma planta sem espécie (só código e capa)', async () => {
      // Arrange
      const dto: CreatePlantaRequestDTO = {
        usuarioId: 'user-123',
        identificador: 42,
        fotoCapaUrl: 'https://r2.example.com/capa.webp',
      };
      mockPlantaRepository.create.mockResolvedValue({ ...mockCreatedPlanta, especieId: null, especie: null });

      // Act
      const result = await createPlantaUseCase.execute(dto);

      // Assert
      expect(mockEspecieRepository.existsById).not.toHaveBeenCalled();
      expect(mockPlantaRepository.create).toHaveBeenCalledWith(dto);
      expect(result.especie).toBeNull();
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
      expect(mockPlantaRepository.create).toHaveBeenCalledWith({ ...minimalCreateDTO, identificador: 1 });
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
        identificador: 1,
      });
      expect(result.fotoCapaUrl).toBe('https://r2.example.com/cover.webp');
    });

    describe('ID automático', () => {
      const conflito = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });

      it('sem ID, usa o maior ID do usuário + 1', async () => {
        mockPlantaRepository.maiorIdentificador.mockResolvedValue(13);
        mockPlantaRepository.create.mockResolvedValue({ ...mockCreatedPlanta, identificador: 14 });

        await createPlantaUseCase.execute({ usuarioId: 'user-123' });

        expect(mockPlantaRepository.maiorIdentificador).toHaveBeenCalledWith('user-123');
        expect(mockPlantaRepository.create).toHaveBeenCalledWith(expect.objectContaining({ identificador: 14 }));
      });

      it('primeira planta do usuário recebe 1', async () => {
        mockPlantaRepository.maiorIdentificador.mockResolvedValue(0);
        mockPlantaRepository.create.mockResolvedValue(mockCreatedPlanta);

        await createPlantaUseCase.execute({ usuarioId: 'user-123' });

        expect(mockPlantaRepository.create).toHaveBeenCalledWith(expect.objectContaining({ identificador: 1 }));
      });

      it('com ID informado, respeita e não consulta o maior', async () => {
        mockPlantaRepository.create.mockResolvedValue({ ...mockCreatedPlanta, identificador: 7 });

        await createPlantaUseCase.execute({ usuarioId: 'user-123', identificador: 7 });

        expect(mockPlantaRepository.maiorIdentificador).not.toHaveBeenCalled();
        expect(mockPlantaRepository.create).toHaveBeenCalledWith(expect.objectContaining({ identificador: 7 }));
      });

      it('conflito no ID gerado (criação simultânea): recalcula e tenta de novo', async () => {
        mockPlantaRepository.maiorIdentificador.mockResolvedValueOnce(4).mockResolvedValueOnce(5);
        mockPlantaRepository.create.mockRejectedValueOnce(conflito).mockResolvedValueOnce(mockCreatedPlanta);

        await createPlantaUseCase.execute({ usuarioId: 'user-123' });

        expect(mockPlantaRepository.create).toHaveBeenCalledTimes(2);
        expect(mockPlantaRepository.create).toHaveBeenLastCalledWith(expect.objectContaining({ identificador: 6 }));
      });

      it('desiste depois de 3 conflitos seguidos', async () => {
        mockPlantaRepository.maiorIdentificador.mockResolvedValue(4);
        mockPlantaRepository.create.mockRejectedValue(conflito);

        await expect(createPlantaUseCase.execute({ usuarioId: 'user-123' })).rejects.toBe(conflito);
        expect(mockPlantaRepository.create).toHaveBeenCalledTimes(3);
      });

      it('conflito com ID informado pelo usuário não tenta de novo', async () => {
        mockPlantaRepository.create.mockRejectedValue(conflito);

        await expect(createPlantaUseCase.execute({ usuarioId: 'user-123', identificador: 7 })).rejects.toBe(conflito);
        expect(mockPlantaRepository.create).toHaveBeenCalledTimes(1);
      });
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
        identificador: 1,
      });
    });
  });
});
