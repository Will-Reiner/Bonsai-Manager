import { CreateAgendasLoteUseCase } from './create-agendas-lote.use-case';
import { AgendaRepository } from '../agenda.types';

describe('CreateAgendasLoteUseCase', () => {
  let useCase: CreateAgendasLoteUseCase;
  let mockAgendaRepository: jest.Mocked<AgendaRepository>;

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
    };

    useCase = new CreateAgendasLoteUseCase(mockAgendaRepository);
  });

  const dataAgendada = '2026-10-10T12:00:00.000Z';

  it('deve criar uma agenda por atividade, na mesma planta e data', async () => {
    // Arrange
    mockAgendaRepository.checkPlantaBelongsToUser.mockResolvedValue(true);
    mockAgendaRepository.createMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);

    // Act
    const result = await useCase.execute(
      { plantaId: 'planta-1', atividadeIds: ['at-1', 'at-2'], dataAgendada },
      'user-1',
    );

    // Assert
    expect(mockAgendaRepository.checkPlantaBelongsToUser).toHaveBeenCalledWith('planta-1', 'user-1');
    expect(mockAgendaRepository.createMany).toHaveBeenCalledWith([
      { plantaId: 'planta-1', atividadeId: 'at-1', dataAgendada },
      { plantaId: 'planta-1', atividadeId: 'at-2', dataAgendada },
    ]);
    expect(result).toEqual([{ id: 'a1' }, { id: 'a2' }]);
  });

  it('deve ignorar atividades repetidas', async () => {
    // Arrange
    mockAgendaRepository.checkPlantaBelongsToUser.mockResolvedValue(true);
    mockAgendaRepository.createMany.mockResolvedValue([]);

    // Act
    await useCase.execute({ plantaId: 'planta-1', atividadeIds: ['at-1', 'at-1', 'at-2'], dataAgendada }, 'user-1');

    // Assert
    expect(mockAgendaRepository.createMany).toHaveBeenCalledWith([
      { plantaId: 'planta-1', atividadeId: 'at-1', dataAgendada },
      { plantaId: 'planta-1', atividadeId: 'at-2', dataAgendada },
    ]);
  });

  it('deve repassar as observações para todas as agendas', async () => {
    // Arrange
    mockAgendaRepository.checkPlantaBelongsToUser.mockResolvedValue(true);
    mockAgendaRepository.createMany.mockResolvedValue([]);

    // Act
    await useCase.execute(
      { plantaId: 'planta-1', atividadeIds: ['at-1', 'at-2'], dataAgendada, observacoes: 'antes da chuva' },
      'user-1',
    );

    // Assert
    expect(mockAgendaRepository.createMany).toHaveBeenCalledWith([
      { plantaId: 'planta-1', atividadeId: 'at-1', dataAgendada, observacoes: 'antes da chuva' },
      { plantaId: 'planta-1', atividadeId: 'at-2', dataAgendada, observacoes: 'antes da chuva' },
    ]);
  });

  it('deve lançar erro quando a planta não pertence ao usuário', async () => {
    // Arrange
    mockAgendaRepository.checkPlantaBelongsToUser.mockResolvedValue(false);

    // Act & Assert
    await expect(
      useCase.execute({ plantaId: 'planta-1', atividadeIds: ['at-1'], dataAgendada }, 'user-1'),
    ).rejects.toThrow('Acesso negado. A planta não pertence a si.');
    expect(mockAgendaRepository.createMany).not.toHaveBeenCalled();
  });

  it('deve lançar erro quando nenhuma atividade é informada', async () => {
    // Act & Assert
    await expect(
      useCase.execute({ plantaId: 'planta-1', atividadeIds: [], dataAgendada }, 'user-1'),
    ).rejects.toThrow('Informe ao menos um cuidado.');
    expect(mockAgendaRepository.createMany).not.toHaveBeenCalled();
  });
});
