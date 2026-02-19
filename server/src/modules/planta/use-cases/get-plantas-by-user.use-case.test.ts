import { GetPlantasByUserUseCase } from './get-plantas-by-user.use-case';
import { PlantaRepository, PlantaWithEspecie } from '../types/planta.types';
import { ModoAquisicao } from '@prisma/client';

describe('GetPlantasByUserUseCase', () => {
  let getPlantasByUserUseCase: GetPlantasByUserUseCase;
  let mockPlantaRepository: jest.Mocked<PlantaRepository>;

  beforeEach(() => {
    mockPlantaRepository = {
      create: jest.fn(),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
    };

    getPlantasByUserUseCase = new GetPlantasByUserUseCase(mockPlantaRepository);
  });

  describe('execute', () => {
    const usuarioId = 'user-123';

    const mockPlantas: PlantaWithEspecie[] = [
      {
        id: 'planta-1',
        especieId: 'especie-1',
        usuarioId: 'user-123',
        nome: 'Planta 1',
        dataAquisicao: new Date('2024-01-01'),
        modoAquisicao: ModoAquisicao.SEMENTE,
        visao: 'Frente',
        observacoes: 'Primeira planta',
        fotoCapaUrl: null,
        plantaPublica: true,
        historicoPublico: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        especie: {
          nomeCientifico: 'Ficus benjamina',
          nomeComum: 'Ficus',
        },
      },
      {
        id: 'planta-2',
        especieId: 'especie-2',
        usuarioId: 'user-123',
        nome: 'Planta 2',
        dataAquisicao: new Date('2024-02-01'),
        modoAquisicao: ModoAquisicao.ESTACA,
        visao: 'Lateral',
        observacoes: 'Segunda planta',
        fotoCapaUrl: null,
        plantaPublica: false,
        historicoPublico: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
        especie: {
          nomeCientifico: 'Acer palmatum',
          nomeComum: 'Bordo japonês',
        },
      },
    ];

    it('deve retornar lista de plantas do usuário', async () => {
      // Arrange
      mockPlantaRepository.findManyByUser.mockResolvedValue(mockPlantas);

      // Act
      const result = await getPlantasByUserUseCase.execute(usuarioId);

      // Assert
      expect(mockPlantaRepository.findManyByUser).toHaveBeenCalledWith(usuarioId);
      expect(result).toEqual(mockPlantas);
      expect(result).toHaveLength(2);
    });

    it('deve retornar lista vazia quando usuário não tem plantas', async () => {
      // Arrange
      mockPlantaRepository.findManyByUser.mockResolvedValue([]);

      // Act
      const result = await getPlantasByUserUseCase.execute(usuarioId);

      // Assert
      expect(mockPlantaRepository.findManyByUser).toHaveBeenCalledWith(usuarioId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('deve propagar erro do repositório', async () => {
      // Arrange
      mockPlantaRepository.findManyByUser.mockRejectedValue(new Error('Erro do banco de dados'));

      // Act & Assert
      await expect(getPlantasByUserUseCase.execute(usuarioId))
        .rejects.toThrow('Erro do banco de dados');

      expect(mockPlantaRepository.findManyByUser).toHaveBeenCalledWith(usuarioId);
    });
  });
});