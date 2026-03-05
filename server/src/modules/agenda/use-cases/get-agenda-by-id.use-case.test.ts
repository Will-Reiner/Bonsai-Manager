import { GetAgendaByIdUseCase } from './get-agenda-by-id.use-case';
import { AgendaRepository } from '../agenda.types';

describe('GetAgendaByIdUseCase', () => {
  let useCase: GetAgendaByIdUseCase;
  let mockRepository: jest.Mocked<AgendaRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      updateWithResources: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      checkPlantaBelongsToUser: jest.fn(),
    };
    useCase = new GetAgendaByIdUseCase(mockRepository);
  });

  it('should return agenda item by id and user', async () => {
    // Arrange
    const agendaId = 'agenda-1';
    const usuarioId = 'user-1';
    const expected = {
      id: agendaId,
      plantaId: 'planta-1',
      atividadeId: 'atividade-1',
      dataAgendada: '2024-06-15',
      status: 'PENDENTE',
    };
    mockRepository.findByIdAndUser.mockResolvedValue(expected);

    // Act
    const result = await useCase.execute(agendaId, usuarioId);

    // Assert
    expect(mockRepository.findByIdAndUser).toHaveBeenCalledWith(agendaId, usuarioId);
    expect(result).toEqual(expected);
  });

  it('should throw error when agenda not found', async () => {
    mockRepository.findByIdAndUser.mockResolvedValue(null);

    await expect(useCase.execute('non-existent', 'user-1'))
      .rejects.toThrow('Agendamento não encontrado.');
  });
});
