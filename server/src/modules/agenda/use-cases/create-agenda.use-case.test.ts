import { CreateAgendaUseCase } from './create-agenda.use-case';
import { AgendaRepository } from '../agenda.types';

describe('CreateAgendaUseCase', () => {
  let createAgendaUseCase: CreateAgendaUseCase;
  let mockAgendaRepository: jest.Mocked<AgendaRepository>;

  beforeEach(() => {
    mockAgendaRepository = {
      create: jest.fn(),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      updateWithResources: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      checkPlantaBelongsToUser: jest.fn(),
    };

    createAgendaUseCase = new CreateAgendaUseCase(mockAgendaRepository);
  });

  it('should create agenda successfully when planta belongs to user', async () => {
    const createData = {
      plantaId: 'planta-1',
      atividadeId: 'atividade-1',
      dataAgendada: '2024-01-15T10:00:00.000Z',
      status: 'PENDENTE' as any,
    };
    const usuarioId = 'user-1';
    const expectedAgenda = { id: 'agenda-1', ...createData };

    mockAgendaRepository.checkPlantaBelongsToUser.mockResolvedValue(true);
    mockAgendaRepository.create.mockResolvedValue(expectedAgenda);

    const result = await createAgendaUseCase.execute(createData, usuarioId);

    expect(mockAgendaRepository.checkPlantaBelongsToUser).toHaveBeenCalledWith('planta-1', 'user-1');
    expect(mockAgendaRepository.create).toHaveBeenCalledWith(createData);
    expect(result).toEqual(expectedAgenda);
  });

  it('should throw error when planta does not belong to user', async () => {
    const createData = {
      plantaId: 'planta-1',
      atividadeId: 'atividade-1',
      dataAgendada: '2024-01-15T10:00:00.000Z',
      status: 'PENDENTE' as any,
    };
    const usuarioId = 'user-1';

    mockAgendaRepository.checkPlantaBelongsToUser.mockResolvedValue(false);

    await expect(createAgendaUseCase.execute(createData, usuarioId)).rejects.toThrow(
      'Acesso negado. A planta não pertence a si.'
    );

    expect(mockAgendaRepository.checkPlantaBelongsToUser).toHaveBeenCalledWith('planta-1', 'user-1');
    expect(mockAgendaRepository.create).not.toHaveBeenCalled();
  });
});