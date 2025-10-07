import { GetAtividadesByTipoRecursoUseCase } from './get-atividades-by-tipo-recurso.use-case';
import { AtividadeRecursoRepository } from '../atividade-recurso.types';

describe('GetAtividadesByTipoRecursoUseCase', () => {
  let useCase: GetAtividadesByTipoRecursoUseCase;
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
    useCase = new GetAtividadesByTipoRecursoUseCase(mockRepository);
  });

  it('deve buscar atividades por tipo de recurso com sucesso', async () => {
    const tipoRecursoId = 'tipo-recurso-id';
    const expectedResult = [
      {
        atividadeId: 'atividade-1',
        tipoRecursoId: 'tipo-recurso-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        atividade: {
          id: 'atividade-1',
          nome: 'Atividade 1',
          descricao: 'Descrição da atividade 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    mockRepository.tipoRecursoExists.mockResolvedValue(true);
    mockRepository.getByTipoRecurso.mockResolvedValue(expectedResult);

    const result = await useCase.execute(tipoRecursoId);

    expect(result).toEqual(expectedResult);
    expect(mockRepository.tipoRecursoExists).toHaveBeenCalledWith(tipoRecursoId);
    expect(mockRepository.getByTipoRecurso).toHaveBeenCalledWith(tipoRecursoId);
  });

  it('deve lançar erro se o tipo de recurso não existir', async () => {
    const tipoRecursoId = 'tipo-recurso-inexistente';

    mockRepository.tipoRecursoExists.mockResolvedValue(false);

    await expect(useCase.execute(tipoRecursoId)).rejects.toThrow('Tipo de recurso não encontrado');
    expect(mockRepository.tipoRecursoExists).toHaveBeenCalledWith(tipoRecursoId);
    expect(mockRepository.getByTipoRecurso).not.toHaveBeenCalled();
  });
});