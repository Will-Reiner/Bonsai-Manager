import { GetGuiasDeTecnicasByEspecieUseCase } from './get-guias-de-tecnicas-by-especie.use-case';
import { GuiaDeTecnicasRepository, GuiaDeTecnicasResponseDTO } from '../guia-de-tecnicas.types';

describe('GetGuiasDeTecnicasByEspecieUseCase', () => {
  let useCase: GetGuiasDeTecnicasByEspecieUseCase;
  let mockRepository: jest.Mocked<GuiaDeTecnicasRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      especieExists: jest.fn(),
      atividadeExists: jest.fn(),
      findAll: jest.fn(),
      findByEspecie: jest.fn(),
    };
    useCase = new GetGuiasDeTecnicasByEspecieUseCase(mockRepository);
  });

  it('should return guias de tecnicas for a given especie', async () => {
    const especieId = 'especie-1';
    const expected: GuiaDeTecnicasResponseDTO[] = [
      { especieId, atividadeId: '1', recomendacao: 'RECOMENDADA', observacoes: 'Boa prática' },
    ];
    mockRepository.especieExists.mockResolvedValue(true);
    mockRepository.findByEspecie.mockResolvedValue(expected);

    const result = await useCase.execute(especieId);

    expect(mockRepository.especieExists).toHaveBeenCalledWith(especieId);
    expect(mockRepository.findByEspecie).toHaveBeenCalledWith(especieId);
    expect(result).toEqual(expected);
  });

  it('should throw error when especie does not exist', async () => {
    mockRepository.especieExists.mockResolvedValue(false);

    await expect(useCase.execute('non-existent')).rejects.toThrow('Espécie não encontrada');
  });
});
