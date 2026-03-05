import { GetAllRecursosByUserUseCase } from './get-all-recursos-by-user.use-case';
import { RecursoRepository } from '../recurso.types';

describe('GetAllRecursosByUserUseCase', () => {
  let getAllRecursosByUserUseCase: GetAllRecursosByUserUseCase;
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

    getAllRecursosByUserUseCase = new GetAllRecursosByUserUseCase(mockRecursoRepository);
  });

  it('should return all recursos for a user', async () => {
    const usuarioId = 'user-id';
    const expectedRecursos = [
      { id: 'recurso-1', tipoRecursoId: 'tipo-1', quantidadeDisponivel: 10, usuarioId },
      { id: 'recurso-2', tipoRecursoId: 'tipo-2', quantidadeDisponivel: 5, usuarioId },
    ];

    mockRecursoRepository.findManyByUser.mockResolvedValue(expectedRecursos);

    const result = await getAllRecursosByUserUseCase.execute(usuarioId);

    expect(mockRecursoRepository.findManyByUser).toHaveBeenCalledWith(usuarioId);
    expect(result).toEqual(expectedRecursos);
  });

  it('should return empty array when user has no recursos', async () => {
    const usuarioId = 'user-id';

    mockRecursoRepository.findManyByUser.mockResolvedValue([]);

    const result = await getAllRecursosByUserUseCase.execute(usuarioId);

    expect(mockRecursoRepository.findManyByUser).toHaveBeenCalledWith(usuarioId);
    expect(result).toEqual([]);
  });
});