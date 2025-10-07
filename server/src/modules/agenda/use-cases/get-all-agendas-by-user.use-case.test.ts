import { GetAllAgendasByUserUseCase } from './get-all-agendas-by-user.use-case';
import { AgendaRepository } from '../agenda.types';

describe('GetAllAgendasByUserUseCase', () => {
  let getAllAgendasByUserUseCase: GetAllAgendasByUserUseCase;
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

    getAllAgendasByUserUseCase = new GetAllAgendasByUserUseCase(mockAgendaRepository);
  });

  it('should return all agendas for user', async () => {
    const usuarioId = 'user-1';
    const expectedAgendas = [
      {
        id: 'agenda-1',
        plantaId: 'planta-1',
        atividadeId: 'atividade-1',
        dataAgendada: new Date('2024-01-15'),
        status: 'PENDENTE',
      },
      {
        id: 'agenda-2',
        plantaId: 'planta-2',
        atividadeId: 'atividade-2',
        dataAgendada: new Date('2024-01-20'),
        status: 'CONCLUIDA',
      },
    ];

    mockAgendaRepository.findManyByUser.mockResolvedValue(expectedAgendas);

    const result = await getAllAgendasByUserUseCase.execute(usuarioId);

    expect(mockAgendaRepository.findManyByUser).toHaveBeenCalledWith(usuarioId);
    expect(result).toEqual(expectedAgendas);
  });

  it('should return empty array when user has no agendas', async () => {
    const usuarioId = 'user-1';

    mockAgendaRepository.findManyByUser.mockResolvedValue([]);

    const result = await getAllAgendasByUserUseCase.execute(usuarioId);

    expect(mockAgendaRepository.findManyByUser).toHaveBeenCalledWith(usuarioId);
    expect(result).toEqual([]);
  });
});