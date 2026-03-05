import { CreateAtividadeFerramentaSugeridaUseCase } from './create-atividade-ferramenta-sugerida.use-case';
import { AtividadeFerramentaSugeridaRepository } from '../atividade-ferramenta-sugerida.types';

describe('CreateAtividadeFerramentaSugeridaUseCase', () => {
  let useCase: CreateAtividadeFerramentaSugeridaUseCase;
  let mockRepository: jest.Mocked<AtividadeFerramentaSugeridaRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      atividadeExists: jest.fn(),
      ferramentaExists: jest.fn(),
      findByAtividade: jest.fn(),
    };
    useCase = new CreateAtividadeFerramentaSugeridaUseCase(mockRepository);
  });

  it('deve criar uma associação com sucesso', async () => {
    const data = {
      atividadeId: 'atividade-id',
      ferramentaId: 'ferramenta-id',
    };

    const expectedResult = {
      atividadeId: 'atividade-id',
      ferramentaId: 'ferramenta-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.ferramentaExists.mockResolvedValue(true);
    mockRepository.exists.mockResolvedValue(false);
    mockRepository.create.mockResolvedValue(expectedResult);

    const result = await useCase.execute(data);

    expect(result).toEqual(expectedResult);
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(data.atividadeId);
    expect(mockRepository.ferramentaExists).toHaveBeenCalledWith(data.ferramentaId);
    expect(mockRepository.exists).toHaveBeenCalledWith(data);
    expect(mockRepository.create).toHaveBeenCalledWith(data);
  });

  it('deve lançar erro se a atividade não existir', async () => {
    const data = {
      atividadeId: 'atividade-inexistente',
      ferramentaId: 'ferramenta-id',
    };

    mockRepository.atividadeExists.mockResolvedValue(false);

    await expect(useCase.execute(data)).rejects.toThrow('Atividade não encontrada');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(data.atividadeId);
    expect(mockRepository.ferramentaExists).not.toHaveBeenCalled();
  });

  it('deve lançar erro se a ferramenta não existir', async () => {
    const data = {
      atividadeId: 'atividade-id',
      ferramentaId: 'ferramenta-inexistente',
    };

    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.ferramentaExists.mockResolvedValue(false);

    await expect(useCase.execute(data)).rejects.toThrow('Ferramenta não encontrada');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(data.atividadeId);
    expect(mockRepository.ferramentaExists).toHaveBeenCalledWith(data.ferramentaId);
    expect(mockRepository.exists).not.toHaveBeenCalled();
  });

  it('deve lançar erro se a associação já existir', async () => {
    const data = {
      atividadeId: 'atividade-id',
      ferramentaId: 'ferramenta-id',
    };

    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.ferramentaExists.mockResolvedValue(true);
    mockRepository.exists.mockResolvedValue(true);

    await expect(useCase.execute(data)).rejects.toThrow('Associação já existe');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(data.atividadeId);
    expect(mockRepository.ferramentaExists).toHaveBeenCalledWith(data.ferramentaId);
    expect(mockRepository.exists).toHaveBeenCalledWith(data);
    expect(mockRepository.create).not.toHaveBeenCalled();
  });
});