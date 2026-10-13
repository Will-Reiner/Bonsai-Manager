import { CreateFotoUseCase } from './create-foto.use-case';
import { FotoRepository } from '../foto.types';

describe('CreateFotoUseCase', () => {
  let createFotoUseCase: CreateFotoUseCase;
  let mockFotoRepository: jest.Mocked<FotoRepository>;
  let mockPosts: { execute: jest.Mock };

  beforeEach(() => {
    mockFotoRepository = {
      create: jest.fn(),
      findManyByPlanta: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      checkPlantaBelongsToUser: jest.fn(),
      findCapaDaPlanta: jest.fn(),
      findFotoMaisRecente: jest.fn(),
      updateCapaDaPlanta: jest.fn(),
    };

    mockPosts = { execute: jest.fn().mockResolvedValue(undefined) };
    createFotoUseCase = new CreateFotoUseCase(mockFotoRepository, mockPosts);
  });

  it('should create foto successfully without plantaId', async () => {
    const createData = {
      caminhoArquivo: '/uploads/foto1.jpg',
      titulo: 'Minha primeira foto',
      tags: 'bonsai, crescimento',
    };
    const usuarioId = 'user-1';
    const expectedFoto = { id: 'foto-1', ...createData, usuarioId };

    mockFotoRepository.create.mockResolvedValue(expectedFoto);

    const result = await createFotoUseCase.execute(createData, usuarioId);

    expect(mockFotoRepository.create).toHaveBeenCalledWith({
      ...createData,
      usuarioId,
    });
    expect(mockFotoRepository.checkPlantaBelongsToUser).not.toHaveBeenCalled();
    expect(result).toEqual(expectedFoto);
  });

  it('should create foto successfully with valid plantaId', async () => {
    const createData = {
      caminhoArquivo: '/uploads/foto1.jpg',
      plantaId: 'planta-1',
      titulo: 'Foto da minha planta',
      tags: 'bonsai, crescimento',
    };
    const usuarioId = 'user-1';
    const expectedFoto = { id: 'foto-1', ...createData, usuarioId };

    mockFotoRepository.checkPlantaBelongsToUser.mockResolvedValue(true);
    mockFotoRepository.create.mockResolvedValue(expectedFoto);

    const result = await createFotoUseCase.execute(createData, usuarioId);

    expect(mockFotoRepository.checkPlantaBelongsToUser).toHaveBeenCalledWith('planta-1', 'user-1');
    expect(mockFotoRepository.create).toHaveBeenCalledWith({
      ...createData,
      usuarioId,
    });
    expect(result).toEqual(expectedFoto);
  });

  it('should throw error when planta does not belong to user', async () => {
    const createData = {
      caminhoArquivo: '/uploads/foto1.jpg',
      plantaId: 'planta-1',
      titulo: 'Foto da minha planta',
    };
    const usuarioId = 'user-1';

    mockFotoRepository.checkPlantaBelongsToUser.mockResolvedValue(false);

    await expect(createFotoUseCase.execute(createData, usuarioId)).rejects.toThrow(
      'Planta não encontrada ou não pertence a si.'
    );

    expect(mockFotoRepository.checkPlantaBelongsToUser).toHaveBeenCalledWith('planta-1', 'user-1');
    expect(mockFotoRepository.create).not.toHaveBeenCalled();
  });

  it('repassa dataCaptura ao repositório', async () => {
    const createData = {
      caminhoArquivo: '/uploads/foto1.jpg',
      tipo: 'FOTO' as const,
      dataCaptura: '2023-05-01T00:00:00.000Z',
    };
    const usuarioId = 'user-1';
    const expectedFoto = { id: 'foto-1', ...createData, usuarioId };
    mockFotoRepository.create.mockResolvedValue(expectedFoto);

    await createFotoUseCase.execute(createData, usuarioId);

    expect(mockFotoRepository.create).toHaveBeenCalledWith({
      ...createData,
      usuarioId,
    });
  });

  it('sincroniza os posts da planta da foto', async () => {
    mockFotoRepository.checkPlantaBelongsToUser.mockResolvedValue(true);
    mockFotoRepository.create.mockResolvedValue({ id: 'f1', plantaId: 'planta-1' });

    await createFotoUseCase.execute({ caminhoArquivo: '/x.webp', plantaId: 'planta-1' }, 'user-1');

    expect(mockPosts.execute).toHaveBeenCalledWith({ plantaIds: ['planta-1'] });
  });

  it('foto sem planta não sincroniza', async () => {
    mockFotoRepository.create.mockResolvedValue({ id: 'f1', plantaId: null });

    await createFotoUseCase.execute({ caminhoArquivo: '/x.webp' }, 'user-1');

    expect(mockPosts.execute).not.toHaveBeenCalled();
  });
});
