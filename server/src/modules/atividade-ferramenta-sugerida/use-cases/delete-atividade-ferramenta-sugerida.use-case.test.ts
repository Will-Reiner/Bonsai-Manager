import { DeleteAtividadeFerramentaSugeridaUseCase } from './delete-atividade-ferramenta-sugerida.use-case';
import { AtividadeFerramentaSugeridaRepository } from '../atividade-ferramenta-sugerida.types';

describe('DeleteAtividadeFerramentaSugeridaUseCase', () => {
  let useCase: DeleteAtividadeFerramentaSugeridaUseCase;
  let mockRepository: jest.Mocked<AtividadeFerramentaSugeridaRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      atividadeExists: jest.fn(),
      ferramentaExists: jest.fn(),
    };
    useCase = new DeleteAtividadeFerramentaSugeridaUseCase(mockRepository);
  });

  it('deve deletar uma associação com sucesso', async () => {
    const data = {
      atividadeId: 'atividade-id',
      ferramentaId: 'ferramenta-id',
    };

    mockRepository.exists.mockResolvedValue(true);
    mockRepository.delete.mockResolvedValue();

    await useCase.execute(data);

    expect(mockRepository.exists).toHaveBeenCalledWith(data);
    expect(mockRepository.delete).toHaveBeenCalledWith(data);
  });

  it('deve lançar erro se a associação não existir', async () => {
    const data = {
      atividadeId: 'atividade-id',
      ferramentaId: 'ferramenta-id',
    };

    mockRepository.exists.mockResolvedValue(false);

    await expect(useCase.execute(data)).rejects.toThrow('Associação não encontrada');
    expect(mockRepository.exists).toHaveBeenCalledWith(data);
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});