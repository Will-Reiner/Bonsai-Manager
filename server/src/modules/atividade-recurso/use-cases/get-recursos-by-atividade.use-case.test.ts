import { GetRecursosByAtividadeUseCase } from './get-recursos-by-atividade.use-case';
import { AtividadeRecursoRepository } from '../atividade-recurso.types';

describe('GetRecursosByAtividadeUseCase', () => {
  let useCase: GetRecursosByAtividadeUseCase;
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
    useCase = new GetRecursosByAtividadeUseCase(mockRepository);
  });

  it('deve buscar recursos por atividade com sucesso', async () => {
    const atividadeId = 'atividade-id';
    const expectedResult = [
      {
        atividadeId: 'atividade-id',
        tipoRecursoId: 'tipo-recurso-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        tipoRecurso: {
          id: 'tipo-recurso-1',
          nome: 'Tipo Recurso 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.getByAtividade.mockResolvedValue(expectedResult);

    const result = await useCase.execute(atividadeId);

    expect(result).toEqual(expectedResult);
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(atividadeId);
    expect(mockRepository.getByAtividade).toHaveBeenCalledWith(atividadeId);
  });

  it('deve lançar erro se a atividade não existir', async () => {
    const atividadeId = 'atividade-inexistente';

    mockRepository.atividadeExists.mockResolvedValue(false);

    await expect(useCase.execute(atividadeId)).rejects.toThrow('Atividade não encontrada');
    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(atividadeId);
    expect(mockRepository.getByAtividade).not.toHaveBeenCalled();
  });
});