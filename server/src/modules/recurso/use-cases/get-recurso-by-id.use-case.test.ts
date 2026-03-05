import { GetRecursoByIdUseCase } from './get-recurso-by-id.use-case';
import { RecursoRepository } from '../recurso.types';

describe('GetRecursoByIdUseCase', () => {
  let getRecursoByIdUseCase: GetRecursoByIdUseCase;
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

    getRecursoByIdUseCase = new GetRecursoByIdUseCase(mockRecursoRepository);
  });

  it('should return a recurso when found', async () => {
    const id = 'recurso-id';
    const usuarioId = 'user-id';
    const expectedRecurso = { id, tipoRecursoId: 'tipo-id', quantidadeDisponivel: 10, usuarioId };

    mockRecursoRepository.findByIdAndUser.mockResolvedValue(expectedRecurso);

    const result = await getRecursoByIdUseCase.execute(id, usuarioId);

    expect(mockRecursoRepository.findByIdAndUser).toHaveBeenCalledWith(id, usuarioId);
    expect(result).toEqual(expectedRecurso);
  });

  it('should throw error when recurso is not found', async () => {
    const id = 'non-existent-id';
    const usuarioId = 'user-id';

    mockRecursoRepository.findByIdAndUser.mockResolvedValue(null);

    await expect(getRecursoByIdUseCase.execute(id, usuarioId)).rejects.toThrow(
      'Recurso não encontrado ou não pertence a si.'
    );

    expect(mockRecursoRepository.findByIdAndUser).toHaveBeenCalledWith(id, usuarioId);
  });
});