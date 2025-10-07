import { DeleteFotoUseCase } from './delete-foto.use-case';
import { FotoRepository } from '../foto.types';

describe('DeleteFotoUseCase', () => {
  let deleteFotoUseCase: DeleteFotoUseCase;
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

    deleteFotoUseCase = new DeleteFotoUseCase(mockFotoRepository);
  });

  it('should delete foto successfully', async () => {
    const fotoId = 'foto-1';
    const usuarioId = 'user-1';

    mockFotoRepository.existsByIdAndUser.mockResolvedValue(true);
    mockFotoRepository.delete.mockResolvedValue(undefined);

    await deleteFotoUseCase.execute(fotoId, usuarioId);

    expect(mockFotoRepository.existsByIdAndUser).toHaveBeenCalledWith(fotoId, usuarioId);
    expect(mockFotoRepository.delete).toHaveBeenCalledWith(fotoId);
  });

  it('should throw error when foto does not exist or does not belong to user', async () => {
    const fotoId = 'foto-1';
    const usuarioId = 'user-1';

    mockFotoRepository.existsByIdAndUser.mockResolvedValue(false);

    await expect(deleteFotoUseCase.execute(fotoId, usuarioId)).rejects.toThrow(
      'Foto não encontrada ou não pertence a si.'
    );

    expect(mockFotoRepository.existsByIdAndUser).toHaveBeenCalledWith(fotoId, usuarioId);
    expect(mockFotoRepository.delete).not.toHaveBeenCalled();
  });
});