import { UpdateGuiaDeTecnicasUseCase } from './update-guia-de-tecnicas.use-case';
import { GuiaDeTecnicasRepository } from '../guia-de-tecnicas.types';

describe('UpdateGuiaDeTecnicasUseCase', () => {
  let useCase: UpdateGuiaDeTecnicasUseCase;
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
    useCase = new UpdateGuiaDeTecnicasUseCase(mockRepository);
  });

  it('should update a guia de tecnicas successfully', async () => {
    const especieId = 'especie-id';
    const atividadeId = 'atividade-id';
    const updateData = {
      recomendacao: 'COM_CUIDADO' as const,
      observacoes: 'Observações atualizadas',
    };

    const expectedResult = {
      especieId: 'especie-id',
      atividadeId: 'atividade-id',
      recomendacao: 'COM_CUIDADO' as const,
      observacoes: 'Observações atualizadas',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepository.exists.mockResolvedValue(true);
    mockRepository.update.mockResolvedValue(expectedResult);

    const result = await useCase.execute(especieId, atividadeId, updateData);

    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id');
    expect(mockRepository.update).toHaveBeenCalledWith('especie-id', 'atividade-id', updateData);
    expect(result).toEqual(expectedResult);
  });

  it('should throw error when association does not exist', async () => {
    const especieId = 'especie-id';
    const atividadeId = 'atividade-id';
    const updateData = {
      recomendacao: 'COM_CUIDADO' as const,
    };

    mockRepository.exists.mockResolvedValue(false);

    await expect(useCase.execute(especieId, atividadeId, updateData)).rejects.toThrow('Associação não encontrada');
    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id');
    expect(mockRepository.update).not.toHaveBeenCalled();
  });
});