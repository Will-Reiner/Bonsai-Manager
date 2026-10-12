import { EditarCuidadoUseCase } from './editar-cuidado.use-case';
import { CuidadoRepository } from '../agenda.types';

describe('EditarCuidadoUseCase', () => {
  let repo: jest.Mocked<CuidadoRepository>;
  let reavaliar: { execute: jest.Mock };
  let useCase: EditarCuidadoUseCase;
  const concluida = (id: string, plantaId = 'p1') => ({ id, plantaId, status: 'CONCLUIDO' as const });

  beforeEach(() => {
    repo = {
      findDoUsuario: jest.fn().mockResolvedValue([concluida('a1'), concluida('a2')]),
      editar: jest.fn(async (_plano, depois) => {
        await depois('tx' as never);
        return [];
      }),
      excluir: jest.fn(),
    };
    reavaliar = { execute: jest.fn().mockResolvedValue(undefined) };
    useCase = new EditarCuidadoUseCase(repo, reavaliar);
  });

  it('monta o plano e reavalia a planta dentro da transação', async () => {
    await useCase.execute(
      {
        agendaIds: ['a1', 'a2'],
        dataConcluida: '2026-10-05T15:00:00.000Z',
        textos: [{ agendaId: 'a1', detalhes: 'nova' }],
        removerAgendaIds: ['a2'],
      },
      'u1',
    );

    expect(repo.findDoUsuario).toHaveBeenCalledWith(['a1', 'a2'], 'u1');
    expect(repo.editar).toHaveBeenCalledWith(
      {
        manter: ['a1'],
        remover: ['a2'],
        dataConcluida: new Date('2026-10-05T15:00:00.000Z'),
        textos: [{ agendaId: 'a1', detalhes: 'nova' }],
      },
      expect.any(Function),
    );
    expect(reavaliar.execute).toHaveBeenCalledWith({ plantaIds: ['p1'], agendaIds: ['a1', 'a2'] }, 'u1', 'tx');
  });

  it('tarefa que não é do usuário: 404 e nada gravado', async () => {
    repo.findDoUsuario.mockResolvedValue([concluida('a1')]);
    await expect(useCase.execute({ agendaIds: ['a1', 'a2'] }, 'u1')).rejects.toThrow('Acesso negado ou agendamento não encontrado.');
    expect(repo.editar).not.toHaveBeenCalled();
  });

  it('tarefa pendente no meio: recusa', async () => {
    repo.findDoUsuario.mockResolvedValue([concluida('a1'), { id: 'a2', plantaId: 'p1', status: 'PENDENTE' }]);
    await expect(useCase.execute({ agendaIds: ['a1', 'a2'] }, 'u1')).rejects.toThrow('O cuidado precisa estar concluído.');
  });

  it('plantas diferentes: recusa', async () => {
    repo.findDoUsuario.mockResolvedValue([concluida('a1'), concluida('a2', 'p2')]);
    await expect(useCase.execute({ agendaIds: ['a1', 'a2'] }, 'u1')).rejects.toThrow('As tarefas precisam ser da mesma planta.');
  });

  it('tirar todas: recusa (use excluir)', async () => {
    await expect(useCase.execute({ agendaIds: ['a1', 'a2'], removerAgendaIds: ['a1', 'a2'] }, 'u1')).rejects.toThrow(
      'Para tirar todas as tarefas, exclua o cuidado.',
    );
  });

  it('remover ou texto de tarefa fora do card: recusa', async () => {
    await expect(useCase.execute({ agendaIds: ['a1', 'a2'], removerAgendaIds: ['a9'] }, 'u1')).rejects.toThrow(
      'Tarefa fora do cuidado.',
    );
    await expect(
      useCase.execute({ agendaIds: ['a1', 'a2'], removerAgendaIds: ['a2'], textos: [{ agendaId: 'a2', detalhes: 'x' }] }, 'u1'),
    ).rejects.toThrow('Tarefa fora do cuidado.');
  });

  it('data no futuro: recusa', async () => {
    const depois = new Date(Date.now() + 3 * 86_400_000).toISOString();
    await expect(useCase.execute({ agendaIds: ['a1'], dataConcluida: depois }, 'u1')).rejects.toThrow('A data não pode ser no futuro.');
  });
});
