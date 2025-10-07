import { DeleteGuiaSazonalUseCase } from './delete-guia-sazonal.use-case';
import { GuiaSazonalRepository } from '../guia-sazonal.types';

describe('DeleteGuiaSazonalUseCase', () => {
  let useCase: DeleteGuiaSazonalUseCase;
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
    useCase = new DeleteGuiaSazonalUseCase(mockRepository);
  });

  it('should delete a guia sazonal successfully', async () => {
    const especieId = 'especie-id';
    const atividadeId = 'atividade-id';
    const estacao = 'PRIMAVERA' as const;

    mockRepository.exists.mockResolvedValue(true);
    mockRepository.delete.mockResolvedValue(undefined);

    await useCase.execute(especieId, atividadeId, estacao);

    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id', 'PRIMAVERA');
    expect(mockRepository.delete).toHaveBeenCalledWith({ especieId: 'especie-id', atividadeId: 'atividade-id', estacao: 'PRIMAVERA' });
  });

  it('should throw error when association does not exist', async () => {
    const especieId = 'especie-id';
    const atividadeId = 'atividade-id';
    const estacao = 'PRIMAVERA' as const;

    mockRepository.exists.mockResolvedValue(false);

    await expect(useCase.execute(especieId, atividadeId, estacao)).rejects.toThrow('Associação não encontrada');
    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id', 'PRIMAVERA');
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});