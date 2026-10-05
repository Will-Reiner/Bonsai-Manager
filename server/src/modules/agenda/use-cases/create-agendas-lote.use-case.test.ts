import { CreateAgendasLoteUseCase } from './create-agendas-lote.use-case';
import { AgendaRepository } from '../agenda.types';

describe('CreateAgendasLoteUseCase', () => {
  let useCase: CreateAgendasLoteUseCase;
  let repo: jest.Mocked<AgendaRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      createMany: jest.fn().mockResolvedValue([]),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      updateWithResources: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      checkPlantaBelongsToUser: jest.fn(),
      contarPlantasDoUsuario: jest.fn(),
    };
    useCase = new CreateAgendasLoteUseCase(repo);
  });

  const dataAgendada = '2026-10-10T12:00:00.000Z';

  it('cria uma agenda para cada planta × atividade', async () => {
    // Arrange
    repo.contarPlantasDoUsuario.mockResolvedValue(2);
    repo.createMany.mockResolvedValue([{ id: 'a1' }]);

    // Act
    const result = await useCase.execute(
      { plantaIds: ['p1', 'p2'], atividadeIds: ['at-1', 'at-2'], dataAgendada },
      'user-1',
    );

    // Assert
    expect(repo.contarPlantasDoUsuario).toHaveBeenCalledWith(['p1', 'p2'], 'user-1');
    expect(repo.createMany).toHaveBeenCalledWith([
      { plantaId: 'p1', atividadeId: 'at-1', dataAgendada },
      { plantaId: 'p1', atividadeId: 'at-2', dataAgendada },
      { plantaId: 'p2', atividadeId: 'at-1', dataAgendada },
      { plantaId: 'p2', atividadeId: 'at-2', dataAgendada },
    ]);
    expect(result).toEqual([{ id: 'a1' }]);
  });

  it('ignora plantas e atividades repetidas', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(1);

    await useCase.execute({ plantaIds: ['p1', 'p1'], atividadeIds: ['at-1', 'at-1'], dataAgendada }, 'user-1');

    expect(repo.contarPlantasDoUsuario).toHaveBeenCalledWith(['p1'], 'user-1');
    expect(repo.createMany).toHaveBeenCalledWith([{ plantaId: 'p1', atividadeId: 'at-1', dataAgendada }]);
  });

  it('repassa a observação (detalhes) aparada para todas as agendas', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(2);

    await useCase.execute(
      { plantaIds: ['p1', 'p2'], atividadeIds: ['at-1'], dataAgendada, detalhes: '  usar Bioplant ' },
      'user-1',
    );

    expect(repo.createMany).toHaveBeenCalledWith([
      { plantaId: 'p1', atividadeId: 'at-1', dataAgendada, detalhes: 'usar Bioplant' },
      { plantaId: 'p2', atividadeId: 'at-1', dataAgendada, detalhes: 'usar Bioplant' },
    ]);
  });

  it('não grava detalhes em branco', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(1);

    await useCase.execute({ plantaIds: ['p1'], atividadeIds: ['at-1'], dataAgendada, detalhes: '   ' }, 'user-1');

    expect(repo.createMany).toHaveBeenCalledWith([{ plantaId: 'p1', atividadeId: 'at-1', dataAgendada }]);
  });

  it('lança erro quando alguma planta não é do usuário', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(1);

    await expect(
      useCase.execute({ plantaIds: ['p1', 'p2'], atividadeIds: ['at-1'], dataAgendada }, 'user-1'),
    ).rejects.toThrow('Acesso negado. A planta não pertence a si.');
    expect(repo.createMany).not.toHaveBeenCalled();
  });

  it('lança erro sem atividades', async () => {
    await expect(
      useCase.execute({ plantaIds: ['p1'], atividadeIds: [], dataAgendada }, 'user-1'),
    ).rejects.toThrow('Informe ao menos um cuidado.');
  });

  it('lança erro sem plantas', async () => {
    await expect(
      useCase.execute({ plantaIds: [], atividadeIds: ['at-1'], dataAgendada }, 'user-1'),
    ).rejects.toThrow('Informe ao menos uma planta.');
  });

  it('lança erro acima do limite de tarefas', async () => {
    const plantaIds = Array.from({ length: 101 }, (_, i) => `p${i}`);
    const atividadeIds = Array.from({ length: 20 }, (_, i) => `at${i}`);

    await expect(useCase.execute({ plantaIds, atividadeIds, dataAgendada }, 'user-1')).rejects.toThrow(
      'Máximo de 2000 tarefas por vez.',
    );
    expect(repo.contarPlantasDoUsuario).not.toHaveBeenCalled();
  });
});
