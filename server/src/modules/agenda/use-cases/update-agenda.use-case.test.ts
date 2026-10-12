import { UpdateAgendaUseCase } from './update-agenda.use-case';
import { AgendaRepository } from '../agenda.types';

describe('UpdateAgendaUseCase', () => {
  let updateAgendaUseCase: UpdateAgendaUseCase;
  let mockAgendaRepository: jest.Mocked<AgendaRepository>;
  let reavaliar: { execute: jest.Mock };

  beforeEach(() => {
    mockAgendaRepository = {
      create: jest.fn(),
      createMany: jest.fn(),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      updateWithResources: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      checkPlantaBelongsToUser: jest.fn(),
      contarPlantasDoUsuario: jest.fn(),
      atividadesExistem: jest.fn(),
    };

    reavaliar = { execute: jest.fn().mockResolvedValue(undefined) };
    updateAgendaUseCase = new UpdateAgendaUseCase(mockAgendaRepository, reavaliar);
  });

  it('should update agenda without resources successfully', async () => {
    const agendaId = 'agenda-1';
    const usuarioId = 'user-1';
    const updateData = {
      status: 'CONCLUIDA' as any,
      detalhes: 'Atividade concluída com sucesso',
    };
    const expectedAgenda = { id: agendaId, ...updateData };

    mockAgendaRepository.findByIdAndUser.mockResolvedValue({ id: agendaId, plantaId: 'planta-1' });
    mockAgendaRepository.update.mockResolvedValue(expectedAgenda);

    const result = await updateAgendaUseCase.execute(agendaId, updateData, usuarioId);

    expect(mockAgendaRepository.findByIdAndUser).toHaveBeenCalledWith(agendaId, usuarioId);
    expect(mockAgendaRepository.update).toHaveBeenCalledWith(agendaId, updateData);
    expect(mockAgendaRepository.updateWithResources).not.toHaveBeenCalled();
    expect(result).toEqual(expectedAgenda);
  });

  it('should update agenda with resources successfully', async () => {
    const agendaId = 'agenda-1';
    const usuarioId = 'user-1';
    const updateData = {
      status: 'CONCLUIDA' as any,
      detalhes: 'Atividade concluída com sucesso',
      recursosUtilizados: [
        { recursoId: 'recurso-1', quantidadeUtilizada: 2 },
        { recursoId: 'recurso-2', quantidadeUtilizada: 1 },
      ],
    };
    const expectedAgenda = { id: agendaId, status: 'CONCLUIDA', detalhes: 'Atividade concluída com sucesso' };

    mockAgendaRepository.findByIdAndUser.mockResolvedValue({ id: agendaId, plantaId: 'planta-1' });
    mockAgendaRepository.updateWithResources.mockResolvedValue(expectedAgenda);

    const result = await updateAgendaUseCase.execute(agendaId, updateData, usuarioId);

    expect(mockAgendaRepository.findByIdAndUser).toHaveBeenCalledWith(agendaId, usuarioId);
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

    mockAgendaRepository.findByIdAndUser.mockResolvedValue(null);

    await expect(updateAgendaUseCase.execute(agendaId, updateData, usuarioId)).rejects.toThrow(
      'Acesso negado ou agendamento não encontrado.'
    );

    expect(mockAgendaRepository.findByIdAndUser).toHaveBeenCalledWith(agendaId, usuarioId);
    expect(mockAgendaRepository.update).not.toHaveBeenCalled();
    expect(mockAgendaRepository.updateWithResources).not.toHaveBeenCalled();
  });

  it('reavalia o grupo da planta depois de atualizar', async () => {
    mockAgendaRepository.findByIdAndUser.mockResolvedValue({ id: 'agenda-1', plantaId: 'planta-1' });
    mockAgendaRepository.update.mockResolvedValue({ id: 'agenda-1' });

    await updateAgendaUseCase.execute('agenda-1', { detalhes: 'x' }, 'user-1');

    expect(reavaliar.execute).toHaveBeenCalledWith(['planta-1'], 'user-1');
  });
});
