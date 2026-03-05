import { DeleteGuiaDeTecnicasUseCase } from './delete-guia-de-tecnicas.use-case';
import { GuiaDeTecnicasRepository } from '../guia-de-tecnicas.types';

describe('DeleteGuiaDeTecnicasUseCase', () => {
  let useCase: DeleteGuiaDeTecnicasUseCase;
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
    useCase = new DeleteGuiaDeTecnicasUseCase(mockRepository);
  });

  it('should delete a guia de tecnicas successfully', async () => {
    const especieId = 'especie-id';
    const atividadeId = 'atividade-id';

    mockRepository.exists.mockResolvedValue(true);
    mockRepository.delete.mockResolvedValue(undefined);

    await useCase.execute(especieId, atividadeId);

    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id');
    expect(mockRepository.delete).toHaveBeenCalledWith({ especieId: 'especie-id', atividadeId: 'atividade-id' });
  });

  it('should throw error when association does not exist', async () => {
    const especieId = 'especie-id';
    const atividadeId = 'atividade-id';

    mockRepository.exists.mockResolvedValue(false);

    await expect(useCase.execute(especieId, atividadeId)).rejects.toThrow('Associação não encontrada');
    expect(mockRepository.exists).toHaveBeenCalledWith('especie-id', 'atividade-id');
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});