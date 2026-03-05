import { CreateGuiaDeTecnicasUseCase } from './create-guia-de-tecnicas.use-case';
import { GuiaDeTecnicasRepository } from '../guia-de-tecnicas.types';

describe('CreateGuiaDeTecnicasUseCase', () => {
  let useCase: CreateGuiaDeTecnicasUseCase;
  let mockRepository: jest.Mocked<GuiaDeTecnicasRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      especieExists: jest.fn(),
      atividadeExists: jest.fn(),
      findByEspecie: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new CreateGuiaDeTecnicasUseCase(mockRepository);
  });

  it('should create a guia de tecnicas successfully', async () => {
    const data = {
      especieId: 'especie-id',
      atividadeId: 'atividade-id',
      recomendacao: 'RECOMENDADA' as const,
      observacoes: 'Observações de teste',
    };

    const expectedResult = {
      especieId: 'especie-id',
      atividadeId: 'atividade-id',
      recomendacao: 'RECOMENDADA' as const,
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
    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id');
    expect(mockRepository.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(expectedResult);
  });

  it('should throw error when especie does not exist', async () => {
    const data = {
      especieId: 'non-existent-especie',
      atividadeId: 'atividade-id',
      recomendacao: 'RECOMENDADA' as const,
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
      recomendacao: 'RECOMENDADA' as const,
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
      recomendacao: 'RECOMENDADA' as const,
    };

    mockRepository.especieExists.mockResolvedValue(true);
    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.exists.mockResolvedValue(true);

    await expect(useCase.execute(data)).rejects.toThrow('Esta associação já existe');
    expect(mockRepository.especieExists).toHaveBeenCalledWith('especie-id');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith('atividade-id');
    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id');
    expect(mockRepository.create).not.toHaveBeenCalled();
  });
});