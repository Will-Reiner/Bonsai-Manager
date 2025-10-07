import { DeleteAgendaUseCase } from './delete-agenda.use-case';
import { AgendaRepository } from '../agenda.types';

describe('DeleteAgendaUseCase', () => {
  let deleteAgendaUseCase: DeleteAgendaUseCase;
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

    deleteAgendaUseCase = new DeleteAgendaUseCase(mockAgendaRepository);
  });

  it('should delete agenda successfully', async () => {
    const agendaId = 'agenda-1';
    const usuarioId = 'user-1';

    mockAgendaRepository.existsByIdAndUser.mockResolvedValue(true);
    mockAgendaRepository.delete.mockResolvedValue(undefined);

    await deleteAgendaUseCase.execute(agendaId, usuarioId);

    expect(mockAgendaRepository.existsByIdAndUser).toHaveBeenCalledWith(agendaId, usuarioId);
    expect(mockAgendaRepository.delete).toHaveBeenCalledWith(agendaId);
  });

  it('should throw error when agenda does not exist or does not belong to user', async () => {
    const agendaId = 'agenda-1';
    const usuarioId = 'user-1';

    mockAgendaRepository.existsByIdAndUser.mockResolvedValue(false);

    await expect(deleteAgendaUseCase.execute(agendaId, usuarioId)).rejects.toThrow(
      'Acesso negado ou agendamento não encontrado.'
    );

    expect(mockAgendaRepository.existsByIdAndUser).toHaveBeenCalledWith(agendaId, usuarioId);
    expect(mockAgendaRepository.delete).not.toHaveBeenCalled();
  });
});