import { GetAllEspeciesUseCase } from './get-all-especies.use-case';
import { EspecieRepository, EspecieResponseDTO } from '../especie.types';
import { TipoPlanta } from '@prisma/client';

describe('GetAllEspeciesUseCase', () => {
  let getAllEspeciesUseCase: GetAllEspeciesUseCase;
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

    getAllEspeciesUseCase = new GetAllEspeciesUseCase(mockEspecieRepository);
  });

  it('should return all especies successfully', async () => {
    // Arrange
    const expectedEspecies: EspecieResponseDTO[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
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
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        nomeCientifico: 'Juniperus chinensis',
        nomeComum: 'Junípero Chinês',
        familia: 'Cupressaceae',
        origem: 'China',
        tipoDePlanta: 'CONIFERA' as TipoPlanta,
        folhas: 'Aciculares',
        tronco: null,
        flores: null,
        frutos: null,
        raizes: null,
        luminosidade: 'Sol pleno',
        rega: 'Pouca',
        substratoIdeal: null,
        adubacao: null,
        clima: null,
        problemasComuns: null,
        pros: null,
        contras: null,
        linhasDeRaciocinio: null,
        observacoes: null,
      },
    ];

    mockEspecieRepository.findAll.mockResolvedValue(expectedEspecies);

    // Act
    const result = await getAllEspeciesUseCase.execute();

    // Assert
    expect(mockEspecieRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedEspecies);
  });

  it('should return empty array when no especies exist', async () => {
    // Arrange
    mockEspecieRepository.findAll.mockResolvedValue([]);

    // Act
    const result = await getAllEspeciesUseCase.execute();

    // Assert
    expect(mockEspecieRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});