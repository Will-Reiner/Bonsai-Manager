import { UpdateFotoUseCase } from './update-foto.use-case';
import { FotoRepository } from '../foto.types';

describe('UpdateFotoUseCase', () => {
  let updateFotoUseCase: UpdateFotoUseCase;
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

    updateFotoUseCase = new UpdateFotoUseCase(mockFotoRepository);
  });

  it('should update foto successfully', async () => {
    const fotoId = 'foto-1';
    const usuarioId = 'user-1';
    const updateData = {
      titulo: 'Título atualizado',
      tags: 'bonsai, crescimento, atualizado',
    };
    const expectedFoto = { id: fotoId, ...updateData };

    mockFotoRepository.existsByIdAndUser.mockResolvedValue(true);
    mockFotoRepository.update.mockResolvedValue(expectedFoto);

    const result = await updateFotoUseCase.execute(fotoId, updateData, usuarioId);

    expect(mockFotoRepository.existsByIdAndUser).toHaveBeenCalledWith(fotoId, usuarioId);
    expect(mockFotoRepository.update).toHaveBeenCalledWith(fotoId, updateData);
    expect(result).toEqual(expectedFoto);
  });

  it('should update foto with partial data', async () => {
    const fotoId = 'foto-1';
    const usuarioId = 'user-1';
    const updateData = {
      titulo: 'Apenas título atualizado',
    };
    const expectedFoto = { id: fotoId, titulo: 'Apenas título atualizado' };

    mockFotoRepository.existsByIdAndUser.mockResolvedValue(true);
    mockFotoRepository.update.mockResolvedValue(expectedFoto);

    const result = await updateFotoUseCase.execute(fotoId, updateData, usuarioId);

    expect(mockFotoRepository.existsByIdAndUser).toHaveBeenCalledWith(fotoId, usuarioId);
    expect(mockFotoRepository.update).toHaveBeenCalledWith(fotoId, updateData);
    expect(result).toEqual(expectedFoto);
  });

  it('should throw error when foto does not exist or does not belong to user', async () => {
    const fotoId = 'foto-1';
    const usuarioId = 'user-1';
    const updateData = {
      titulo: 'Título atualizado',
    };

    mockFotoRepository.existsByIdAndUser.mockResolvedValue(false);

    await expect(updateFotoUseCase.execute(fotoId, updateData, usuarioId)).rejects.toThrow(
      'Foto não encontrada ou não pertence a si.'
    );

    expect(mockFotoRepository.existsByIdAndUser).toHaveBeenCalledWith(fotoId, usuarioId);
    expect(mockFotoRepository.update).not.toHaveBeenCalled();
  });
});