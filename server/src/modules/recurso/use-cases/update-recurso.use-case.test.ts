import { UpdateRecursoUseCase } from './update-recurso.use-case';
import { RecursoRepository } from '../recurso.types';

describe('UpdateRecursoUseCase', () => {
  let updateRecursoUseCase: UpdateRecursoUseCase;
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

    updateRecursoUseCase = new UpdateRecursoUseCase(mockRecursoRepository);
  });

  it('should update a recurso successfully', async () => {
    const id = 'recurso-id';
    const usuarioId = 'user-id';
    const updateData = {
      quantidadeDisponivel: 15,
      unidadeMedida: 'KG' as any,
      observacoes: 'Updated observations',
    };
    const expectedRecurso = { id, ...updateData };

    mockRecursoRepository.existsByIdAndUser.mockResolvedValue(true);
    mockRecursoRepository.update.mockResolvedValue(expectedRecurso);

    const result = await updateRecursoUseCase.execute(id, updateData, usuarioId);

    expect(mockRecursoRepository.existsByIdAndUser).toHaveBeenCalledWith(id, usuarioId);
    expect(mockRecursoRepository.update).toHaveBeenCalledWith(id, updateData);
    expect(result).toEqual(expectedRecurso);
  });

  it('should throw error when recurso does not exist', async () => {
    const id = 'non-existent-id';
    const usuarioId = 'user-id';
    const updateData = { quantidadeDisponivel: 15 };

    mockRecursoRepository.existsByIdAndUser.mockResolvedValue(false);

    await expect(updateRecursoUseCase.execute(id, updateData, usuarioId)).rejects.toThrow(
      'Recurso não encontrado ou não pertence a si.'
    );

    expect(mockRecursoRepository.existsByIdAndUser).toHaveBeenCalledWith(id, usuarioId);
    expect(mockRecursoRepository.update).not.toHaveBeenCalled();
  });

  it('should update only provided fields', async () => {
    const id = 'recurso-id';
    const usuarioId = 'user-id';
    const updateData = { quantidadeDisponivel: 20 };
    const expectedRecurso = { id, ...updateData };

    mockRecursoRepository.existsByIdAndUser.mockResolvedValue(true);
    mockRecursoRepository.update.mockResolvedValue(expectedRecurso);

    const result = await updateRecursoUseCase.execute(id, updateData, usuarioId);

    expect(mockRecursoRepository.existsByIdAndUser).toHaveBeenCalledWith(id, usuarioId);
    expect(mockRecursoRepository.update).toHaveBeenCalledWith(id, updateData);
    expect(result).toEqual(expectedRecurso);
  });
});