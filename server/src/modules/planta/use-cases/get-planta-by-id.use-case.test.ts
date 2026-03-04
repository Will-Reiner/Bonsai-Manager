import { GetPlantaByIdUseCase } from './get-planta-by-id.use-case';
import { PlantaRepository, PlantaWithEspecie } from '../types/planta.types';
import { ModoAquisicao } from '@prisma/client';

describe('GetPlantaByIdUseCase', () => {
  let getPlantaByIdUseCase: GetPlantaByIdUseCase;
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

    getPlantaByIdUseCase = new GetPlantaByIdUseCase(mockPlantaRepository);
  });

  describe('execute', () => {
    const plantaId = 'planta-123';
    const usuarioId = 'user-123';

    const mockPlanta: PlantaWithEspecie = {
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

    it('deve retornar planta quando encontrada e pertence ao usuário', async () => {
      // Arrange
      mockPlantaRepository.findByIdAndUser.mockResolvedValue(mockPlanta);

      // Act
      const result = await getPlantaByIdUseCase.execute(plantaId, usuarioId);

      // Assert
      expect(mockPlantaRepository.findByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(result).toEqual(mockPlanta);
    });

    it('deve lançar erro quando planta não é encontrada', async () => {
      // Arrange
      mockPlantaRepository.findByIdAndUser.mockResolvedValue(null);

      // Act & Assert
      await expect(getPlantaByIdUseCase.execute(plantaId, usuarioId))
        .rejects.toThrow('Planta não encontrada ou não pertence ao usuário');

      expect(mockPlantaRepository.findByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
    });

    it('deve lançar erro quando planta não pertence ao usuário', async () => {
      // Arrange
      mockPlantaRepository.findByIdAndUser.mockResolvedValue(null);

      // Act & Assert
      await expect(getPlantaByIdUseCase.execute(plantaId, 'outro-usuario'))
        .rejects.toThrow('Planta não encontrada ou não pertence ao usuário');

      expect(mockPlantaRepository.findByIdAndUser).toHaveBeenCalledWith(plantaId, 'outro-usuario');
    });

    it('deve propagar erro do repositório', async () => {
      // Arrange
      mockPlantaRepository.findByIdAndUser.mockRejectedValue(new Error('Erro do banco de dados'));

      // Act & Assert
      await expect(getPlantaByIdUseCase.execute(plantaId, usuarioId))
        .rejects.toThrow('Erro do banco de dados');

      expect(mockPlantaRepository.findByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
    });
  });
});