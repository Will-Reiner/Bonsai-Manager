import { GetEspeciesSugeridasUseCase } from './get-especies-sugeridas.use-case';
import { EspecieRepository, EspecieResponseDTO } from '../especie.types';
import { StatusEspecie } from '@prisma/client';

describe('GetEspeciesSugeridasUseCase', () => {
  let getEspeciesSugeridasUseCase: GetEspeciesSugeridasUseCase;
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

    getEspeciesSugeridasUseCase = new GetEspeciesSugeridasUseCase(mockEspecieRepository);
  });

  it('should return only suggested species', async () => {
    const sugeridas: EspecieResponseDTO[] = [
      {
        id: '1',
        nomeCientifico: null,
        nomeComum: 'Ficus',
        familia: null,
        origem: null,
        tipoDePlanta: null,
        status: 'SUGERIDO' as StatusEspecie,
        criadoPorId: 'user-1',
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
      },
    ];

    mockEspecieRepository.findByStatus.mockResolvedValue(sugeridas);

    const result = await getEspeciesSugeridasUseCase.execute();

    expect(mockEspecieRepository.findByStatus).toHaveBeenCalledWith('SUGERIDO');
    expect(result).toEqual(sugeridas);
    expect(result).toHaveLength(1);
  });

  it('should return empty array when no suggested species exist', async () => {
    mockEspecieRepository.findByStatus.mockResolvedValue([]);

    const result = await getEspeciesSugeridasUseCase.execute();

    expect(mockEspecieRepository.findByStatus).toHaveBeenCalledWith('SUGERIDO');
    expect(result).toEqual([]);
  });
});
