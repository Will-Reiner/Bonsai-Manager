import { UpdateAgendaUseCase } from './update-agenda.use-case';
import { AgendaRepository } from '../agenda.types';

describe('UpdateAgendaUseCase', () => {
  let updateAgendaUseCase: UpdateAgendaUseCase;
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

    updateAgendaUseCase = new UpdateAgendaUseCase(mockAgendaRepository);
  });

  it('should update agenda without resources successfully', async () => {
    const agendaId = 'agenda-1';
    const usuarioId = 'user-1';
    const updateData = {
      status: 'CONCLUIDA' as any,
      observacoes: 'Atividade concluída com sucesso',
    };
    const expectedAgenda = { id: agendaId, ...updateData };

    mockAgendaRepository.existsByIdAndUser.mockResolvedValue(true);
    mockAgendaRepository.update.mockResolvedValue(expectedAgenda);

    const result = await updateAgendaUseCase.execute(agendaId, updateData, usuarioId);

    expect(mockAgendaRepository.existsByIdAndUser).toHaveBeenCalledWith(agendaId, usuarioId);
    expect(mockAgendaRepository.update).toHaveBeenCalledWith(agendaId, updateData);
    expect(mockAgendaRepository.updateWithResources).not.toHaveBeenCalled();
    expect(result).toEqual(expectedAgenda);
  });

  it('should update agenda with resources successfully', async () => {
    const agendaId = 'agenda-1';
    const usuarioId = 'user-1';
    const updateData = {
      status: 'CONCLUIDA' as any,
      observacoes: 'Atividade concluída com sucesso',
      recursosUtilizados: [
        { recursoId: 'recurso-1', quantidadeUtilizada: 2 },
        { recursoId: 'recurso-2', quantidadeUtilizada: 1 },
      ],
    };
    const expectedAgenda = { id: agendaId, status: 'CONCLUIDA', observacoes: 'Atividade concluída com sucesso' };

    mockAgendaRepository.existsByIdAndUser.mockResolvedValue(true);
    mockAgendaRepository.updateWithResources.mockResolvedValue(expectedAgenda);

    const result = await updateAgendaUseCase.execute(agendaId, updateData, usuarioId);

    expect(mockAgendaRepository.existsByIdAndUser).toHaveBeenCalledWith(agendaId, usuarioId);
    expect(mockAgendaRepository.updateWithResources).toHaveBeenCalledWith(agendaId, updateData);
    expect(mockAgendaRepository.update).not.toHaveBeenCalled();
    expect(result).toEqual(expectedAgenda);
  });

  it('should throw error when agenda does not exist or does not belong to user', async () => {
    const agendaId = 'agenda-1';
    const usuarioId = 'user-1';
    const updateData = {
      status: 'CONCLUIDA' as any,
    };

    mockAgendaRepository.existsByIdAndUser.mockResolvedValue(false);

    await expect(updateAgendaUseCase.execute(agendaId, updateData, usuarioId)).rejects.toThrow(
      'Acesso negado ou agendamento não encontrado.'
    );

    expect(mockAgendaRepository.existsByIdAndUser).toHaveBeenCalledWith(agendaId, usuarioId);
    expect(mockAgendaRepository.update).not.toHaveBeenCalled();
    expect(mockAgendaRepository.updateWithResources).not.toHaveBeenCalled();
  });
});