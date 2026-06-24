import { CreateFotoUseCase } from './create-foto.use-case';
import { FotoRepository } from '../foto.types';

describe('CreateFotoUseCase', () => {
  let createFotoUseCase: CreateFotoUseCase;
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

    createFotoUseCase = new CreateFotoUseCase(mockFotoRepository);
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
});