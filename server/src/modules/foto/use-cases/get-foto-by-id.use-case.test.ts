import { GetFotoByIdUseCase } from './get-foto-by-id.use-case';
import { FotoRepository } from '../foto.types';

describe('GetFotoByIdUseCase', () => {
  let getFotoByIdUseCase: GetFotoByIdUseCase;
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

    getFotoByIdUseCase = new GetFotoByIdUseCase(mockFotoRepository);
  });

  it('should return foto when it exists and belongs to user', async () => {
    const fotoId = 'foto-1';
    const usuarioId = 'user-1';
    const expectedFoto = {
      id: fotoId,
      caminhoArquivo: '/uploads/foto1.jpg',
      plantaId: 'planta-1',
      usuarioId,
      titulo: 'Minha foto',
      tags: 'bonsai',
    };

    mockFotoRepository.findByIdAndUser.mockResolvedValue(expectedFoto);

    const result = await getFotoByIdUseCase.execute(fotoId, usuarioId);

    expect(mockFotoRepository.findByIdAndUser).toHaveBeenCalledWith(fotoId, usuarioId);
    expect(result).toEqual(expectedFoto);
  });

  it('should throw error when foto does not exist or does not belong to user', async () => {
    const fotoId = 'foto-1';
    const usuarioId = 'user-1';

    mockFotoRepository.findByIdAndUser.mockResolvedValue(null);

    await expect(getFotoByIdUseCase.execute(fotoId, usuarioId)).rejects.toThrow(
      'Foto não encontrada ou não pertence a si.'
    );

    expect(mockFotoRepository.findByIdAndUser).toHaveBeenCalledWith(fotoId, usuarioId);
  });
});