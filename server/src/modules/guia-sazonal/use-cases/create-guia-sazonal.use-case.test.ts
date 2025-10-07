import { CreateGuiaSazonalUseCase } from './create-guia-sazonal.use-case';
import { GuiaSazonalRepository } from '../guia-sazonal.types';

describe('CreateGuiaSazonalUseCase', () => {
  let useCase: CreateGuiaSazonalUseCase;
  let mockRepository: jest.Mocked<GuiaSazonalRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      especieExists: jest.fn(),
      atividadeExists: jest.fn(),
    };
    useCase = new CreateGuiaSazonalUseCase(mockRepository);
  });

  it('should create a guia sazonal successfully', async () => {
    const data = {
      especieId: 'especie-id',
      atividadeId: 'atividade-id',
      estacao: 'PRIMAVERA' as const,
      momentoIdeal: 'DEVE_FAZER' as const,
      observacoes: 'Observações de teste',
    };

    const expectedResult = {
      especieId: 'especie-id',
      atividadeId: 'atividade-id',
      estacao: 'PRIMAVERA' as const,
      momentoIdeal: 'DEVE_FAZER' as const,
      observacoes: 'Observações de teste',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepository.especieExists.mockResolvedValue(true);
    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.exists.mockResolvedValue(false);
    mockRepository.create.mockResolvedValue(expectedResult);

    const result = await useCase.execute(data);

    expect(mockRepository.especieExists).toHaveBeenCalledWith('especie-id');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith('atividade-id');
    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id', 'PRIMAVERA');
    expect(mockRepository.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(expectedResult);
  });

  it('should throw error when especie does not exist', async () => {
    const data = {
      especieId: 'non-existent-especie',
      atividadeId: 'atividade-id',
      estacao: 'PRIMAVERA' as const,
      momentoIdeal: 'DEVE_FAZER' as const,
    };

    mockRepository.especieExists.mockResolvedValue(false);

    await expect(useCase.execute(data)).rejects.toThrow('Espécie não encontrada');
    expect(mockRepository.especieExists).toHaveBeenCalledWith('non-existent-especie');
    expect(mockRepository.atividadeExists).not.toHaveBeenCalled();
    expect(mockRepository.exists).not.toHaveBeenCalled();
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should throw error when atividade does not exist', async () => {
    const data = {
      especieId: 'especie-id',
      atividadeId: 'non-existent-atividade',
      estacao: 'PRIMAVERA' as const,
      momentoIdeal: 'DEVE_FAZER' as const,
    };

    mockRepository.especieExists.mockResolvedValue(true);
    mockRepository.atividadeExists.mockResolvedValue(false);

    await expect(useCase.execute(data)).rejects.toThrow('Atividade não encontrada');
    expect(mockRepository.especieExists).toHaveBeenCalledWith('especie-id');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith('non-existent-atividade');
    expect(mockRepository.exists).not.toHaveBeenCalled();
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should throw error when association already exists', async () => {
    const data = {
      especieId: 'especie-id',
      atividadeId: 'atividade-id',
      estacao: 'PRIMAVERA' as const,
      momentoIdeal: 'DEVE_FAZER' as const,
    };

    mockRepository.especieExists.mockResolvedValue(true);
    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.exists.mockResolvedValue(true);

    await expect(useCase.execute(data)).rejects.toThrow('Esta associação já existe');
    expect(mockRepository.especieExists).toHaveBeenCalledWith('especie-id');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith('atividade-id');
    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id', 'PRIMAVERA');
    expect(mockRepository.create).not.toHaveBeenCalled();
  });
});