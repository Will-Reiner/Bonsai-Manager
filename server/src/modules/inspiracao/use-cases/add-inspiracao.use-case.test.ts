import { AddInspiracaoUseCase } from './add-inspiracao.use-case';
import { InspiracaoRepository } from '../inspiracao.types';

describe('AddInspiracaoUseCase', () => {
  let useCase: AddInspiracaoUseCase;
  let mockRepository: jest.Mocked<InspiracaoRepository>;

  beforeEach(() => {
    mockRepository = {
      add: jest.fn(),
      remove: jest.fn(),
      exists: jest.fn(),
      plantaExistsAndBelongsToUser: jest.fn(),
      fotoExistsAndCanBeUsedAsInspiration: jest.fn(),
      inspiracaoExistsAndBelongsToUser: jest.fn(),
      findByPlanta: jest.fn(),
    };
    useCase = new AddInspiracaoUseCase(mockRepository);
  });

  it('should add inspiracao successfully', async () => {
    const data = {
      plantaId: 'planta-id',
      fotoId: 'foto-id',
      usuarioId: 'usuario-id',
    };

    const expectedResponse = {
      plantaId: 'planta-id',
      fotoId: 'foto-id',
      createdAt: new Date(),
    };

    mockRepository.plantaExistsAndBelongsToUser.mockResolvedValue(true);
    mockRepository.fotoExistsAndCanBeUsedAsInspiration.mockResolvedValue(true);
    mockRepository.exists.mockResolvedValue(false);
    mockRepository.add.mockResolvedValue(expectedResponse);

    const result = await useCase.execute(data);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(expectedResponse);
    expect(mockRepository.plantaExistsAndBelongsToUser).toHaveBeenCalledWith('planta-id', 'usuario-id');
    expect(mockRepository.fotoExistsAndCanBeUsedAsInspiration).toHaveBeenCalledWith('foto-id', 'usuario-id');
    expect(mockRepository.exists).toHaveBeenCalledWith('planta-id', 'foto-id');
    expect(mockRepository.add).toHaveBeenCalledWith(data);
  });

  it('should return error when planta does not exist or does not belong to user', async () => {
    const data = {
      plantaId: 'planta-id',
      fotoId: 'foto-id',
      usuarioId: 'usuario-id',
    };

    mockRepository.plantaExistsAndBelongsToUser.mockResolvedValue(false);

    const result = await useCase.execute(data);

    expect(result.success).toBe(false);
    expect(result.error).toBe('A sua planta não foi encontrada.');
    expect(mockRepository.plantaExistsAndBelongsToUser).toHaveBeenCalledWith('planta-id', 'usuario-id');
    expect(mockRepository.fotoExistsAndCanBeUsedAsInspiration).not.toHaveBeenCalled();
    expect(mockRepository.exists).not.toHaveBeenCalled();
    expect(mockRepository.add).not.toHaveBeenCalled();
  });

  it('should return error when foto cannot be used as inspiration', async () => {
    const data = {
      plantaId: 'planta-id',
      fotoId: 'foto-id',
      usuarioId: 'usuario-id',
    };

    mockRepository.plantaExistsAndBelongsToUser.mockResolvedValue(true);
    mockRepository.fotoExistsAndCanBeUsedAsInspiration.mockResolvedValue(false);

    const result = await useCase.execute(data);

    expect(result.success).toBe(false);
    expect(result.error).toBe('A foto de inspiração não foi encontrada ou não pode ser usada como inspiração.');
    expect(mockRepository.plantaExistsAndBelongsToUser).toHaveBeenCalledWith('planta-id', 'usuario-id');
    expect(mockRepository.fotoExistsAndCanBeUsedAsInspiration).toHaveBeenCalledWith('foto-id', 'usuario-id');
    expect(mockRepository.exists).not.toHaveBeenCalled();
    expect(mockRepository.add).not.toHaveBeenCalled();
  });

  it('should return error when inspiracao already exists', async () => {
    const data = {
      plantaId: 'planta-id',
      fotoId: 'foto-id',
      usuarioId: 'usuario-id',
    };

    mockRepository.plantaExistsAndBelongsToUser.mockResolvedValue(true);
    mockRepository.fotoExistsAndCanBeUsedAsInspiration.mockResolvedValue(true);
    mockRepository.exists.mockResolvedValue(true);

    const result = await useCase.execute(data);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Esta inspiração já existe para esta planta.');
    expect(mockRepository.plantaExistsAndBelongsToUser).toHaveBeenCalledWith('planta-id', 'usuario-id');
    expect(mockRepository.fotoExistsAndCanBeUsedAsInspiration).toHaveBeenCalledWith('foto-id', 'usuario-id');
    expect(mockRepository.exists).toHaveBeenCalledWith('planta-id', 'foto-id');
    expect(mockRepository.add).not.toHaveBeenCalled();
  });
});