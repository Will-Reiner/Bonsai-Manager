import { GetRecursosSugeridosByAtividadeUseCase } from './get-by-atividade.use-case';
import { AtividadeRecursoSugeridoRepository } from '../atividade-recurso-sugerido.types';

describe('GetRecursosSugeridosByAtividadeUseCase', () => {
  let useCase: GetRecursosSugeridosByAtividadeUseCase;
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
    useCase = new GetRecursosSugeridosByAtividadeUseCase(mockRepository);
  });

  it('should return suggested resources for an atividade', async () => {
    const atividadeId = 'atividade-1';
    const expected = [
      { atividadeId, tipoRecursoId: 'tipo-1' },
    ];
    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.findByAtividade.mockResolvedValue(expected);

    const result = await useCase.execute(atividadeId);

    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(atividadeId);
    expect(mockRepository.findByAtividade).toHaveBeenCalledWith(atividadeId);
    expect(result).toEqual(expected);
  });

  it('should throw error when atividade does not exist', async () => {
    mockRepository.atividadeExists.mockResolvedValue(false);

    await expect(useCase.execute('non-existent')).rejects.toThrow('Atividade não encontrada');
  });
});
