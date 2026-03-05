import { CreateEspecieUseCase } from './create-especie.use-case';
import { EspecieRepository, EspecieResponseDTO } from '../especie.types';
import { TipoPlanta, StatusEspecie } from '@prisma/client';

describe('CreateEspecieUseCase', () => {
  let createEspecieUseCase: CreateEspecieUseCase;
  let mockEspecieRepository: jest.Mocked<EspecieRepository>;

  const userId = 'user-123';
  const adminId = 'admin-456';

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

    createEspecieUseCase = new CreateEspecieUseCase(mockEspecieRepository);
  });

  const buildResponse = (overrides: Partial<EspecieResponseDTO> = {}): EspecieResponseDTO => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    nomeCientifico: null,
    nomeComum: null,
    familia: null,
    origem: null,
    tipoDePlanta: null,
    status: 'SUGERIDO' as StatusEspecie,
    criadoPorId: userId,
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
    ...overrides,
  });

  it('should create a verified especie when admin creates', async () => {
    const expectedResponse = buildResponse({
      nomeCientifico: 'Ficus benjamina',
      nomeComum: 'Ficus',
      status: 'VERIFICADO' as StatusEspecie,
      criadoPorId: adminId,
    });

    mockEspecieRepository.existsByNomeCientifico.mockResolvedValue(false);
    mockEspecieRepository.create.mockResolvedValue(expectedResponse);

    const result = await createEspecieUseCase.execute({
      data: { nomeCientifico: 'Ficus benjamina', nomeComum: 'Ficus' },
      userId: adminId,
      isAdmin: true,
    });

    expect(mockEspecieRepository.create).toHaveBeenCalledWith({
      nomeCientifico: 'Ficus benjamina',
      nomeComum: 'Ficus',
      status: 'VERIFICADO',
      criadoPorId: adminId,
    });
    expect(result.status).toBe('VERIFICADO');
  });

  it('should force SUGERIDO status for non-admin user even if they pass VERIFICADO', async () => {
    const expectedResponse = buildResponse({
      nomeComum: 'Ficus',
      status: 'SUGERIDO' as StatusEspecie,
    });

    mockEspecieRepository.create.mockResolvedValue(expectedResponse);

    await createEspecieUseCase.execute({
      data: { nomeComum: 'Ficus', status: 'VERIFICADO' as StatusEspecie },
      userId,
      isAdmin: false,
    });

    expect(mockEspecieRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'SUGERIDO' })
    );
  });

  it('should require nomeComum for non-admin user', async () => {
    await expect(
      createEspecieUseCase.execute({
        data: { nomeCientifico: 'Ficus benjamina' },
        userId,
        isAdmin: false,
      })
    ).rejects.toThrow('O nome comum é obrigatório para sugestão de espécie.');

    expect(mockEspecieRepository.create).not.toHaveBeenCalled();
  });

  it('should not require nomeComum for admin', async () => {
    const expectedResponse = buildResponse({
      nomeCientifico: 'Ficus benjamina',
      status: 'VERIFICADO' as StatusEspecie,
      criadoPorId: adminId,
    });

    mockEspecieRepository.existsByNomeCientifico.mockResolvedValue(false);
    mockEspecieRepository.create.mockResolvedValue(expectedResponse);

    const result = await createEspecieUseCase.execute({
      data: { nomeCientifico: 'Ficus benjamina' },
      userId: adminId,
      isAdmin: true,
    });

    expect(result).toEqual(expectedResponse);
  });

  it('should allow creating especie without nomeCientifico', async () => {
    const expectedResponse = buildResponse({ nomeComum: 'Ficus' });

    mockEspecieRepository.create.mockResolvedValue(expectedResponse);

    const result = await createEspecieUseCase.execute({
      data: { nomeComum: 'Ficus' },
      userId,
      isAdmin: false,
    });

    expect(mockEspecieRepository.existsByNomeCientifico).not.toHaveBeenCalled();
    expect(result).toEqual(expectedResponse);
  });

  it('should check nomeCientifico uniqueness when provided', async () => {
    mockEspecieRepository.existsByNomeCientifico.mockResolvedValue(true);

    await expect(
      createEspecieUseCase.execute({
        data: { nomeCientifico: 'Ficus benjamina', nomeComum: 'Ficus' },
        userId,
        isAdmin: false,
      })
    ).rejects.toThrow('Já existe uma espécie com este nome científico.');

    expect(mockEspecieRepository.create).not.toHaveBeenCalled();
  });

  it('should always set criadoPorId to userId', async () => {
    const expectedResponse = buildResponse({ nomeComum: 'Ficus' });
    mockEspecieRepository.create.mockResolvedValue(expectedResponse);

    await createEspecieUseCase.execute({
      data: { nomeComum: 'Ficus' },
      userId,
      isAdmin: false,
    });

    expect(mockEspecieRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ criadoPorId: userId })
    );
  });

  it('should allow admin to create with explicit SUGERIDO status', async () => {
    const expectedResponse = buildResponse({
      nomeComum: 'Ficus',
      status: 'SUGERIDO' as StatusEspecie,
      criadoPorId: adminId,
    });

    mockEspecieRepository.create.mockResolvedValue(expectedResponse);

    await createEspecieUseCase.execute({
      data: { nomeComum: 'Ficus', status: 'SUGERIDO' as StatusEspecie },
      userId: adminId,
      isAdmin: true,
    });

    expect(mockEspecieRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'SUGERIDO' })
    );
  });
});
