import { GetFotosByPlantaUseCase } from './get-fotos-by-planta.use-case';
import { FotoRepository } from '../foto.types';

describe('GetFotosByPlantaUseCase', () => {
  let getFotosByPlantaUseCase: GetFotosByPlantaUseCase;
  let mockFotoRepository: jest.Mocked<FotoRepository>;

  beforeEach(() => {
    mockFotoRepository = {
      create: jest.fn(),
      findManyByPlanta: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      checkPlantaBelongsToUser: jest.fn(),
    };

    getFotosByPlantaUseCase = new GetFotosByPlantaUseCase(mockFotoRepository);
  });

  it('should return fotos when planta belongs to user', async () => {
    const plantaId = 'planta-1';
    const usuarioId = 'user-1';
    const expectedFotos = [
      {
        id: 'foto-1',
        caminhoArquivo: '/uploads/foto1.jpg',
        plantaId,
        usuarioId,
        titulo: 'Foto 1',
      },
      {
        id: 'foto-2',
        caminhoArquivo: '/uploads/foto2.jpg',
        plantaId,
        usuarioId,
        titulo: 'Foto 2',
      },
    ];

    mockFotoRepository.checkPlantaBelongsToUser.mockResolvedValue(true);
    mockFotoRepository.findManyByPlanta.mockResolvedValue(expectedFotos);

    const result = await getFotosByPlantaUseCase.execute(plantaId, usuarioId);

    expect(mockFotoRepository.checkPlantaBelongsToUser).toHaveBeenCalledWith(plantaId, usuarioId);
    expect(mockFotoRepository.findManyByPlanta).toHaveBeenCalledWith(plantaId);
    expect(result).toEqual(expectedFotos);
  });

  it('should return empty array when planta has no fotos', async () => {
    const plantaId = 'planta-1';
    const usuarioId = 'user-1';

    mockFotoRepository.checkPlantaBelongsToUser.mockResolvedValue(true);
    mockFotoRepository.findManyByPlanta.mockResolvedValue([]);

    const result = await getFotosByPlantaUseCase.execute(plantaId, usuarioId);

    expect(mockFotoRepository.checkPlantaBelongsToUser).toHaveBeenCalledWith(plantaId, usuarioId);
    expect(mockFotoRepository.findManyByPlanta).toHaveBeenCalledWith(plantaId);
    expect(result).toEqual([]);
  });

  it('should throw error when planta does not belong to user', async () => {
    const plantaId = 'planta-1';
    const usuarioId = 'user-1';

    mockFotoRepository.checkPlantaBelongsToUser.mockResolvedValue(false);

    await expect(getFotosByPlantaUseCase.execute(plantaId, usuarioId)).rejects.toThrow(
      'Planta não encontrada ou não pertence a si.'
    );

    expect(mockFotoRepository.checkPlantaBelongsToUser).toHaveBeenCalledWith(plantaId, usuarioId);
    expect(mockFotoRepository.findManyByPlanta).not.toHaveBeenCalled();
  });
});