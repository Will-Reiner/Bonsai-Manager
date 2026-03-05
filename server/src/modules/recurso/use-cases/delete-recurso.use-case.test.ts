import { DeleteRecursoUseCase } from './delete-recurso.use-case';
import { RecursoRepository } from '../recurso.types';

describe('DeleteRecursoUseCase', () => {
  let deleteRecursoUseCase: DeleteRecursoUseCase;
  let mockRecursoRepository: jest.Mocked<RecursoRepository>;

  beforeEach(() => {
    mockRecursoRepository = {
      create: jest.fn(),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
    };

    deleteRecursoUseCase = new DeleteRecursoUseCase(mockRecursoRepository);
  });

  it('should delete a recurso successfully', async () => {
    const id = 'recurso-id';
    const usuarioId = 'user-id';

    mockRecursoRepository.existsByIdAndUser.mockResolvedValue(true);
    mockRecursoRepository.delete.mockResolvedValue(undefined);

    await deleteRecursoUseCase.execute(id, usuarioId);

    expect(mockRecursoRepository.existsByIdAndUser).toHaveBeenCalledWith(id, usuarioId);
    expect(mockRecursoRepository.delete).toHaveBeenCalledWith(id);
  });

  it('should throw error when recurso does not exist', async () => {
    const id = 'non-existent-id';
    const usuarioId = 'user-id';

    mockRecursoRepository.existsByIdAndUser.mockResolvedValue(false);

    await expect(deleteRecursoUseCase.execute(id, usuarioId)).rejects.toThrow(
      'Recurso não encontrado ou não pertence a si.'
    );

    expect(mockRecursoRepository.existsByIdAndUser).toHaveBeenCalledWith(id, usuarioId);
    expect(mockRecursoRepository.delete).not.toHaveBeenCalled();
  });
});