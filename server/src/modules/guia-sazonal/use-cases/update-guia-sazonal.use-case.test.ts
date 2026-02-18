import { UpdateGuiaSazonalUseCase } from './update-guia-sazonal.use-case';
import { GuiaSazonalRepository } from '../guia-sazonal.types';

describe('UpdateGuiaSazonalUseCase', () => {
  let useCase: UpdateGuiaSazonalUseCase;
  let mockRepository: jest.Mocked<GuiaSazonalRepository>;

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
    useCase = new UpdateGuiaSazonalUseCase(mockRepository);
  });

  it('should update a guia sazonal successfully', async () => {
    const especieId = 'especie-id';
    const atividadeId = 'atividade-id';
    const estacao = 'PRIMAVERA' as const;
    const updateData = {
      momentoIdeal: 'PODE_FAZER' as const,
      observacoes: 'Observações atualizadas',
    };

    const expectedResult = {
      especieId: 'especie-id',
      atividadeId: 'atividade-id',
      estacao: 'PRIMAVERA' as const,
      momentoIdeal: 'PODE_FAZER' as const,
      observacoes: 'Observações atualizadas',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepository.exists.mockResolvedValue(true);
    mockRepository.update.mockResolvedValue(expectedResult);

    const result = await useCase.execute(especieId, atividadeId, estacao, updateData);

    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id', 'PRIMAVERA');
    expect(mockRepository.update).toHaveBeenCalledWith('especie-id', 'atividade-id', 'PRIMAVERA', updateData);
    expect(result).toEqual(expectedResult);
  });

  it('should throw error when association does not exist', async () => {
    const especieId = 'especie-id';
    const atividadeId = 'atividade-id';
    const estacao = 'PRIMAVERA' as const;
    const updateData = {
      momentoIdeal: 'PODE_FAZER' as const,
    };

    mockRepository.exists.mockResolvedValue(false);

    await expect(useCase.execute(especieId, atividadeId, estacao, updateData)).rejects.toThrow('Associação não encontrada');
    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id', 'PRIMAVERA');
    expect(mockRepository.update).not.toHaveBeenCalled();
  });
});