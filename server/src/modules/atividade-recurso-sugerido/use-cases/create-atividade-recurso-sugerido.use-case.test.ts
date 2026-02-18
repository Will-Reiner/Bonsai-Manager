import { CreateAtividadeRecursoSugeridoUseCase } from './create-atividade-recurso-sugerido.use-case';
import { AtividadeRecursoSugeridoRepository } from '../atividade-recurso-sugerido.types';

describe('CreateAtividadeRecursoSugeridoUseCase', () => {
  let useCase: CreateAtividadeRecursoSugeridoUseCase;
  let mockRepository: jest.Mocked<AtividadeRecursoSugeridoRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      atividadeExists: jest.fn(),
      tipoRecursoExists: jest.fn(),
      findByAtividade: jest.fn(),
    };
    useCase = new CreateAtividadeRecursoSugeridoUseCase(mockRepository);
  });

  it('should create an association successfully', async () => {
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

    expect(mockRepository.atividadeExists).toHaveBeenCalledWith('atividade-id');
    expect(mockRepository.tipoRecursoExists).toHaveBeenCalledWith('tipo-recurso-id');
    expect(mockRepository.exists).toHaveBeenCalledWith('atividade-id', 'tipo-recurso-id');
    expect(mockRepository.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(expectedResult);
  });

  it('should throw error when atividade does not exist', async () => {
    const data = {
      atividadeId: 'non-existent-atividade',
      tipoRecursoId: 'tipo-recurso-id',
    };

    mockRepository.atividadeExists.mockResolvedValue(false);

    await expect(useCase.execute(data)).rejects.toThrow('Atividade não encontrada');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith('non-existent-atividade');
    expect(mockRepository.tipoRecursoExists).not.toHaveBeenCalled();
    expect(mockRepository.exists).not.toHaveBeenCalled();
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should throw error when tipo recurso does not exist', async () => {
    const data = {
      atividadeId: 'atividade-id',
      tipoRecursoId: 'non-existent-tipo-recurso',
    };

    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.tipoRecursoExists.mockResolvedValue(false);

    await expect(useCase.execute(data)).rejects.toThrow('Tipo de recurso não encontrado');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith('atividade-id');
    expect(mockRepository.tipoRecursoExists).toHaveBeenCalledWith('non-existent-tipo-recurso');
    expect(mockRepository.exists).not.toHaveBeenCalled();
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should throw error when association already exists', async () => {
    const data = {
      atividadeId: 'atividade-id',
      tipoRecursoId: 'tipo-recurso-id',
    };

    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.tipoRecursoExists.mockResolvedValue(true);
    mockRepository.exists.mockResolvedValue(true);

    await expect(useCase.execute(data)).rejects.toThrow('Esta associação já existe');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith('atividade-id');
    expect(mockRepository.tipoRecursoExists).toHaveBeenCalledWith('tipo-recurso-id');
    expect(mockRepository.exists).toHaveBeenCalledWith('atividade-id', 'tipo-recurso-id');
    expect(mockRepository.create).not.toHaveBeenCalled();
  });
});