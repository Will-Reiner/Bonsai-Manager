import { GetEspecieByIdUseCase } from './get-especie-by-id.use-case';
import { EspecieRepository, EspecieWithRelationsResponseDTO } from '../especie.types';
import { TipoPlanta, RecomendacaoTecnica, Estacao, MomentoIdeal } from '@prisma/client';

describe('GetEspecieByIdUseCase', () => {
  let getEspecieByIdUseCase: GetEspecieByIdUseCase;
  let mockEspecieRepository: jest.Mocked<EspecieRepository>;

  beforeEach(() => {
    mockEspecieRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByNomeCientifico: jest.fn(),
      existsByNomeCientificoExcludingId: jest.fn(),
    };

    getEspecieByIdUseCase = new GetEspecieByIdUseCase(mockEspecieRepository);
  });

  it('should return especie with relations successfully', async () => {
    // Arrange
    const especieId = '123e4567-e89b-12d3-a456-426614174000';
    const expectedEspecie: EspecieWithRelationsResponseDTO = {
      id: especieId,
      nomeCientifico: 'Ficus benjamina',
      nomeComum: 'Ficus',
      familia: 'Moraceae',
      origem: 'Ásia',
      tipoDePlanta: 'PERENE' as TipoPlanta,
      folhas: 'Pequenas e verdes',
      tronco: null,
      flores: null,
      frutos: null,
      raizes: null,
      luminosidade: 'Luz indireta',
      rega: 'Moderada',
      substratoIdeal: null,
      adubacao: null,
      clima: null,
      problemasComuns: null,
      pros: null,
      contras: null,
      linhasDeRaciocinio: null,
      observacoes: null,
      guiasDeTecnicas: [
        {
          especieId: especieId,
          atividadeId: 'atividade-1',
          recomendacao: 'RECOMENDADO' as RecomendacaoTecnica,
          observacoes: null,
          atividade: {
            id: 'atividade-1',
            nome: 'Poda',
            descricao: 'Poda de formação',
          },
        },
      ],
      guiasSazonais: [
        {
          especieId: especieId,
          atividadeId: 'atividade-2',
          estacao: 'PRIMAVERA' as Estacao,
          momentoIdeal: 'DEVE_FAZER' as MomentoIdeal,
          observacoes: null,
          atividade: {
            id: 'atividade-2',
            nome: 'Rega',
            descricao: 'Rega sazonal',
          },
        },
      ],
    };

    mockEspecieRepository.findById.mockResolvedValue(expectedEspecie);

    // Act
    const result = await getEspecieByIdUseCase.execute(especieId);

    // Assert
    expect(mockEspecieRepository.findById).toHaveBeenCalledWith(especieId);
    expect(result).toEqual(expectedEspecie);
  });

  it('should throw error when especie is not found', async () => {
    // Arrange
    const especieId = '123e4567-e89b-12d3-a456-426614174000';
    mockEspecieRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(getEspecieByIdUseCase.execute(especieId)).rejects.toThrow(
      'Espécie não encontrada.'
    );

    expect(mockEspecieRepository.findById).toHaveBeenCalledWith(especieId);
  });

  it('should return especie with empty relations', async () => {
    // Arrange
    const especieId = '123e4567-e89b-12d3-a456-426614174001';
    const expectedEspecie: EspecieWithRelationsResponseDTO = {
      id: especieId,
      nomeCientifico: 'Juniperus chinensis',
      nomeComum: 'Junípero Chinês',
      familia: 'Cupressaceae',
      origem: 'China',
      tipoDePlanta: 'CONIFERA' as any,
      folhas: null,
      tronco: null,
      flores: null,
      frutos: null,
      raizes: null,
      luminosidade: null,
      rega: null,
      substratoIdeal: null,
      adubacao: null,
      clima: null,
      problemasComuns: null,
      pros: null,
      contras: null,
      linhasDeRaciocinio: null,
      observacoes: null,
      guiasDeTecnicas: [],
      guiasSazonais: [],
    };

    mockEspecieRepository.findById.mockResolvedValue(expectedEspecie);

    // Act
    const result = await getEspecieByIdUseCase.execute(especieId);

    // Assert
    expect(mockEspecieRepository.findById).toHaveBeenCalledWith(especieId);
    expect(result).toEqual(expectedEspecie);
  });
});