import { GetAtividadeByIdUseCase } from './get-atividade-by-id.use-case';
import { AtividadeRepository, AtividadeWithRelationsResponseDTO } from '../atividade.types';

describe('GetAtividadeByIdUseCase', () => {
  let getAtividadeByIdUseCase: GetAtividadeByIdUseCase;
  let mockAtividadeRepository: jest.Mocked<AtividadeRepository>;

  beforeEach(() => {
    mockAtividadeRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByNome: jest.fn(),
      existsByNomeExcludingId: jest.fn(),
    };

    getAtividadeByIdUseCase = new GetAtividadeByIdUseCase(mockAtividadeRepository);
  });

  it('should return atividade with relations successfully', async () => {
    // Arrange
    const atividadeId = '123e4567-e89b-12d3-a456-426614174000';
    const expectedAtividade: AtividadeWithRelationsResponseDTO = {
      id: atividadeId,
      nome: 'Poda de Formação',
      descricao: 'Poda para dar forma à planta',
      objetivos: 'Melhorar a estrutura da planta',
      preparacao: 'Preparar ferramentas de poda',
      execucao: 'Cortar galhos desnecessários',
      cuidadosPosProcedimento: 'Aplicar cicatrizante nos cortes',
      createdAt: new Date(),
      agendas: [
        {
          id: 'agenda-1',
          dataAgendada: new Date(),
          dataConcluida: null,
          status: 'PENDENTE' as any,
          detalhes: 'Poda de inverno',
          observacaoFutura: null,
          plantaId: 'planta-1',
        },
      ],
      guiasDeTecnicas: [
        {
          especieId: 'especie-1',
          recomendacao: 'ESSENCIAL' as any,
          observacoes: 'Realizar no inverno',
        },
      ],
      guiasSazonais: [
        {
          especieId: 'especie-1',
          estacao: 'INVERNO' as any,
          momentoIdeal: 'INICIO' as any,
          observacoes: 'Melhor época para poda',
        },
      ],
      recursosSugeridos: [
        {
          tipoRecursoId: 'tipo-recurso-1',
        },
      ],
      ferramentasSugeridas: [
        {
          ferramentaId: 'ferramenta-1',
        },
      ],
    };

    mockAtividadeRepository.findById.mockResolvedValue(expectedAtividade);

    // Act
    const result = await getAtividadeByIdUseCase.execute(atividadeId);

    // Assert
    expect(mockAtividadeRepository.findById).toHaveBeenCalledWith(atividadeId);
    expect(result).toEqual(expectedAtividade);
  });

  it('should throw error when atividade is not found', async () => {
    // Arrange
    const atividadeId = 'non-existent-id';
    mockAtividadeRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(getAtividadeByIdUseCase.execute(atividadeId)).rejects.toThrow(
      'Atividade não encontrada.'
    );

    expect(mockAtividadeRepository.findById).toHaveBeenCalledWith(atividadeId);
  });

  it('should return atividade with empty relations', async () => {
    // Arrange
    const atividadeId = '123e4567-e89b-12d3-a456-426614174001';
    const expectedAtividade: AtividadeWithRelationsResponseDTO = {
      id: atividadeId,
      nome: 'Rega',
      descricao: 'Irrigação da planta',
      objetivos: null,
      preparacao: null,
      execucao: null,
      cuidadosPosProcedimento: null,
      createdAt: new Date(),
      agendas: [],
      guiasDeTecnicas: [],
      guiasSazonais: [],
      recursosSugeridos: [],
      ferramentasSugeridas: [],
    };

    mockAtividadeRepository.findById.mockResolvedValue(expectedAtividade);

    // Act
    const result = await getAtividadeByIdUseCase.execute(atividadeId);

    // Assert
    expect(mockAtividadeRepository.findById).toHaveBeenCalledWith(atividadeId);
    expect(result).toEqual(expectedAtividade);
  });
});