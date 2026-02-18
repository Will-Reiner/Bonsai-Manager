import { GetAllGuiasDeTecnicasUseCase } from './get-all-guias-de-tecnicas.use-case';
import { GuiaDeTecnicasRepository, GuiaDeTecnicasResponseDTO } from '../guia-de-tecnicas.types';

describe('GetAllGuiasDeTecnicasUseCase', () => {
  let useCase: GetAllGuiasDeTecnicasUseCase;
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
    useCase = new GetAllGuiasDeTecnicasUseCase(mockRepository);
  });

  it('should return all guias de tecnicas', async () => {
    const expected: GuiaDeTecnicasResponseDTO[] = [
      { especieId: '1', atividadeId: '1', recomendacao: 'RECOMENDADA', observacoes: 'Boa prática' },
    ];
    mockRepository.findAll.mockResolvedValue(expected);

    const result = await useCase.execute();

    expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expected);
  });

  it('should return empty array when no guias exist', async () => {
    mockRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
