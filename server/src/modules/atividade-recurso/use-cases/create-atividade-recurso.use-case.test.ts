import { CreateAtividadeRecursoUseCase } from './create-atividade-recurso.use-case';
import { AtividadeRecursoRepository } from '../atividade-recurso.types';

describe('CreateAtividadeRecursoUseCase', () => {
  let useCase: CreateAtividadeRecursoUseCase;
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
    useCase = new CreateAtividadeRecursoUseCase(mockRepository);
  });

  it('deve criar uma associação com sucesso', async () => {
    const data = {
      atividadeId: 'atividade-id',
      tipoRecursoId: 'tipo-recurso-id',
    };

    const expectedResult = {
      atividadeId: 'atividade-id',
      tipoRecursoId: 'tipo-recurso-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.tipoRecursoExists.mockResolvedValue(true);
    mockRepository.exists.mockResolvedValue(false);
    mockRepository.create.mockResolvedValue(expectedResult);

    const result = await useCase.execute(data);

    expect(result).toEqual(expectedResult);
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(data.atividadeId);
    expect(mockRepository.tipoRecursoExists).toHaveBeenCalledWith(data.tipoRecursoId);
    expect(mockRepository.exists).toHaveBeenCalledWith(data);
    expect(mockRepository.create).toHaveBeenCalledWith(data);
  });

  it('deve lançar erro se a atividade não existir', async () => {
    const data = {
      atividadeId: 'atividade-inexistente',
      tipoRecursoId: 'tipo-recurso-id',
    };

    mockRepository.atividadeExists.mockResolvedValue(false);

    await expect(useCase.execute(data)).rejects.toThrow('Atividade não encontrada');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(data.atividadeId);
    expect(mockRepository.tipoRecursoExists).not.toHaveBeenCalled();
  });

  it('deve lançar erro se o tipo de recurso não existir', async () => {
    const data = {
      atividadeId: 'atividade-id',
      tipoRecursoId: 'tipo-recurso-inexistente',
    };

    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.tipoRecursoExists.mockResolvedValue(false);

    await expect(useCase.execute(data)).rejects.toThrow('Tipo de recurso não encontrado');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(data.atividadeId);
    expect(mockRepository.tipoRecursoExists).toHaveBeenCalledWith(data.tipoRecursoId);
    expect(mockRepository.exists).not.toHaveBeenCalled();
  });

  it('deve lançar erro se a associação já existir', async () => {
    const data = {
      atividadeId: 'atividade-id',
      tipoRecursoId: 'tipo-recurso-id',
    };

    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.tipoRecursoExists.mockResolvedValue(true);
    mockRepository.exists.mockResolvedValue(true);

    await expect(useCase.execute(data)).rejects.toThrow('Esta associação já existe');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(data.atividadeId);
    expect(mockRepository.tipoRecursoExists).toHaveBeenCalledWith(data.tipoRecursoId);
    expect(mockRepository.exists).toHaveBeenCalledWith(data);
    expect(mockRepository.create).not.toHaveBeenCalled();
  });
});