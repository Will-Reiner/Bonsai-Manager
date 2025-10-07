import { CreateRecursoUseCase } from './create-recurso.use-case';
import { RecursoRepository } from '../recurso.types';

describe('CreateRecursoUseCase', () => {
  let createRecursoUseCase: CreateRecursoUseCase;
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

    createRecursoUseCase = new CreateRecursoUseCase(mockRecursoRepository);
  });

  it('should create a recurso successfully', async () => {
    const createData = {
      tipoRecursoId: 'tipo-id',
      quantidadeDisponivel: 10,
      unidadeMedida: 'UNIDADE' as any,
      observacoes: 'Test observations',
    };
    const usuarioId = 'user-id';
    const expectedRecurso = { id: 'recurso-id', ...createData, usuarioId };

    mockRecursoRepository.create.mockResolvedValue(expectedRecurso);

    const result = await createRecursoUseCase.execute(createData, usuarioId);

    expect(mockRecursoRepository.create).toHaveBeenCalledWith(createData, usuarioId);
    expect(result).toEqual(expectedRecurso);
  });

  it('should create a recurso without optional fields', async () => {
    const createData = {
      tipoRecursoId: 'tipo-id',
      quantidadeDisponivel: 5,
    };
    const usuarioId = 'user-id';
    const expectedRecurso = { id: 'recurso-id', ...createData, usuarioId };

    mockRecursoRepository.create.mockResolvedValue(expectedRecurso);

    const result = await createRecursoUseCase.execute(createData, usuarioId);

    expect(mockRecursoRepository.create).toHaveBeenCalledWith(createData, usuarioId);
    expect(result).toEqual(expectedRecurso);
  });
});