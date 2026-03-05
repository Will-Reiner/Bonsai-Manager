import { DeleteAtividadeRecursoUseCase } from './delete-atividade-recurso.use-case';
import { AtividadeRecursoRepository } from '../atividade-recurso.types';

describe('DeleteAtividadeRecursoUseCase', () => {
  let useCase: DeleteAtividadeRecursoUseCase;
  let mockRepository: jest.Mocked<AtividadeRecursoRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      delete: jest.fn(),
      getByAtividade: jest.fn(),
      getByTipoRecurso: jest.fn(),
      exists: jest.fn(),
      atividadeExists: jest.fn(),
      tipoRecursoExists: jest.fn(),
    };
    useCase = new DeleteAtividadeRecursoUseCase(mockRepository);
  });

  it('deve deletar uma associação com sucesso', async () => {
    const data = {
      atividadeId: 'atividade-id',
      tipoRecursoId: 'tipo-recurso-id',
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
      tipoRecursoId: 'tipo-recurso-id',
    };

    mockRepository.exists.mockResolvedValue(false);

    await expect(useCase.execute(data)).rejects.toThrow('Associação não encontrada');
    expect(mockRepository.exists).toHaveBeenCalledWith(data);
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});