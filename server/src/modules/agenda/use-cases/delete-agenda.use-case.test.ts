import { DeleteAgendaUseCase } from './delete-agenda.use-case';
import { AgendaRepository } from '../agenda.types';

describe('DeleteAgendaUseCase', () => {
  let deleteAgendaUseCase: DeleteAgendaUseCase;
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
    deleteAgendaUseCase = new DeleteAgendaUseCase(mockAgendaRepository, reavaliar);
  });

  it('should delete agenda successfully', async () => {
    const agendaId = 'agenda-1';
    const usuarioId = 'user-1';

    mockAgendaRepository.findByIdAndUser.mockResolvedValue({ id: agendaId, plantaId: 'planta-1' });
    mockAgendaRepository.delete.mockResolvedValue(undefined);

    await deleteAgendaUseCase.execute(agendaId, usuarioId);

    expect(mockAgendaRepository.findByIdAndUser).toHaveBeenCalledWith(agendaId, usuarioId);
    expect(mockAgendaRepository.delete).toHaveBeenCalledWith(agendaId);
  });

  it('should throw error when agenda does not exist or does not belong to user', async () => {
    const agendaId = 'agenda-1';
    const usuarioId = 'user-1';

    mockAgendaRepository.findByIdAndUser.mockResolvedValue(null);

    await expect(deleteAgendaUseCase.execute(agendaId, usuarioId)).rejects.toThrow(
      'Acesso negado ou agendamento não encontrado.'
    );

    expect(mockAgendaRepository.findByIdAndUser).toHaveBeenCalledWith(agendaId, usuarioId);
    expect(mockAgendaRepository.delete).not.toHaveBeenCalled();
  });

  it('apaga e reavalia o grupo da planta', async () => {
    mockAgendaRepository.findByIdAndUser.mockResolvedValue({ id: 'agenda-1', plantaId: 'planta-1' });

    await deleteAgendaUseCase.execute('agenda-1', 'user-1');

    expect(mockAgendaRepository.delete).toHaveBeenCalledWith('agenda-1');
    expect(reavaliar.execute).toHaveBeenCalledWith(['planta-1'], 'user-1');
  });

  it('tarefa de outro usuário: nada apagado nem reavaliado', async () => {
    mockAgendaRepository.findByIdAndUser.mockResolvedValue(null);

    await expect(deleteAgendaUseCase.execute('agenda-1', 'user-1')).rejects.toThrow('Acesso negado ou agendamento não encontrado.');
    expect(mockAgendaRepository.delete).not.toHaveBeenCalled();
    expect(reavaliar.execute).not.toHaveBeenCalled();
  });
});
