import { DeleteEspecieUseCase } from './delete-especie.use-case';
import { EspecieRepository, EspecieWithRelationsResponseDTO } from '../especie.types';
import { TipoPlanta, RecomendacaoTecnica, Estacao, MomentoIdeal, StatusEspecie } from '@prisma/client';

describe('DeleteEspecieUseCase', () => {
  let deleteEspecieUseCase: DeleteEspecieUseCase;
  let mockEspecieRepository: jest.Mocked<EspecieRepository>;

  beforeEach(() => {
    mockEspecieRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByNomeCientifico: jest.fn(),
      existsByNomeCientificoExcludingId: jest.fn(),
    };

    deleteEspecieUseCase = new DeleteEspecieUseCase(mockEspecieRepository);
  });

  it('should delete especie successfully', async () => {
    // Arrange
    const especieId = '123e4567-e89b-12d3-a456-426614174000';
    const existingEspecie: EspecieWithRelationsResponseDTO = {
      id: especieId,
      nomeCientifico: 'Ficus benjamina',
      nomeComum: 'Ficus',
      familia: 'Moraceae',
      origem: 'Ásia',
      tipoDePlanta: 'PERENE' as TipoPlanta,
      status: 'VERIFICADO' as StatusEspecie,
      criadoPorId: null,
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

    mockEspecieRepository.findById.mockResolvedValue(existingEspecie);
    mockEspecieRepository.delete.mockResolvedValue();

    // Act
    await deleteEspecieUseCase.execute(especieId);

    // Assert
    expect(mockEspecieRepository.findById).toHaveBeenCalledWith(especieId);
    expect(mockEspecieRepository.delete).toHaveBeenCalledWith(especieId);
  });

  it('should throw error when especie is not found', async () => {
    // Arrange
    const especieId = '123e4567-e89b-12d3-a456-426614174000';
    mockEspecieRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(deleteEspecieUseCase.execute(especieId)).rejects.toThrow(
      'Espécie não encontrada.'
    );

    expect(mockEspecieRepository.findById).toHaveBeenCalledWith(especieId);
    expect(mockEspecieRepository.delete).not.toHaveBeenCalled();
  });

  it('should delete especie with relations successfully', async () => {
    // Arrange
    const especieId = '123e4567-e89b-12d3-a456-426614174001';
    const existingEspecie: EspecieWithRelationsResponseDTO = {
      id: especieId,
      nomeCientifico: 'Juniperus chinensis',
      nomeComum: 'Junípero Chinês',
      familia: 'Cupressaceae',
      origem: 'China',
      tipoDePlanta: 'CONIFERA' as any,
      status: 'VERIFICADO' as StatusEspecie,
      criadoPorId: null,
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
      guiasDeTecnicas: [
        {
          especieId: especieId,
          atividadeId: 'atividade-1',
          recomendacao: 'RECOMENDADA' as any,
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
          estacao: 'PRIMAVERA' as any,
          momentoIdeal: 'DEVE_FAZER' as any,
          observacoes: null,
          atividade: {
            id: 'atividade-2',
            nome: 'Rega',
            descricao: 'Rega sazonal',
          },
        },
      ],
    };

    mockEspecieRepository.findById.mockResolvedValue(existingEspecie);
    mockEspecieRepository.delete.mockResolvedValue();

    // Act
    await deleteEspecieUseCase.execute(especieId);

    // Assert
    expect(mockEspecieRepository.findById).toHaveBeenCalledWith(especieId);
    expect(mockEspecieRepository.delete).toHaveBeenCalledWith(especieId);
  });
});
