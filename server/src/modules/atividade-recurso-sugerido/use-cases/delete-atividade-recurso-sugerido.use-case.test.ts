import { DeleteAtividadeRecursoSugeridoUseCase } from './delete-atividade-recurso-sugerido.use-case';
import { AtividadeRecursoSugeridoRepository } from '../atividade-recurso-sugerido.types';

describe('DeleteAtividadeRecursoSugeridoUseCase', () => {
  let useCase: DeleteAtividadeRecursoSugeridoUseCase;
  let mockRepository: jest.Mocked<AtividadeRecursoSugeridoRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      atividadeExists: jest.fn(),
      tipoRecursoExists: jest.fn(),
    };
    useCase = new DeleteAtividadeRecursoSugeridoUseCase(mockRepository);
  });

  it('should delete an association successfully', async () => {
    const data = {
      atividadeId: 'atividade-id',
      tipoRecursoId: 'tipo-recurso-id',
    };

    mockRepository.exists.mockResolvedValue(true);
    mockRepository.delete.mockResolvedValue();

    await useCase.execute(data);

    expect(mockRepository.exists).toHaveBeenCalledWith('atividade-id', 'tipo-recurso-id');
    expect(mockRepository.delete).toHaveBeenCalledWith(data);
  });

  it('should throw error when association does not exist', async () => {
    const data = {
      atividadeId: 'atividade-id',
      tipoRecursoId: 'tipo-recurso-id',
    };

    mockRepository.exists.mockResolvedValue(false);

    await expect(useCase.execute(data)).rejects.toThrow('Associação não encontrada');
    expect(mockRepository.exists).toHaveBeenCalledWith('atividade-id', 'tipo-recurso-id');
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});