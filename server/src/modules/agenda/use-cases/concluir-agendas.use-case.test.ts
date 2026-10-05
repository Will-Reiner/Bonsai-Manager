import { ConcluirAgendasUseCase } from './concluir-agendas.use-case';
import { ConclusaoRepository, ConcluirAgendasDTO } from '../agenda.types';

const DIA = 86_400_000;
const AGORA = new Date('2026-10-05T12:00:00.000Z');
const emDias = (d: number) => new Date(AGORA.getTime() + d * DIA);

describe('ConcluirAgendasUseCase', () => {
  let repo: jest.Mocked<ConclusaoRepository>;
  let useCase: ConcluirAgendasUseCase;

  const base: ConcluirAgendasDTO = {
    dataConcluida: AGORA.toISOString(),
    itens: [{ agendaId: 'ag-1' }],
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AGORA);
    repo = {
      findPendentesDoUsuario: jest.fn().mockResolvedValue([{ id: 'ag-1', plantaId: 'pl-1' }]),
      atividadesExistem: jest.fn().mockResolvedValue(true),
      getRevisaoDias: jest.fn().mockResolvedValue(30),
      proximaPendente: jest.fn().mockResolvedValue(null),
      executar: jest.fn().mockResolvedValue({ concluidas: [], criadas: [], revisoes: [] }),
      contarPlantasDoUsuario: jest.fn(),
      registrar: jest.fn(),
    };
    useCase = new ConcluirAgendasUseCase(repo);
  });

  afterEach(() => jest.useRealTimers());

  const plano = () => repo.executar.mock.calls[0][0];

  it('conclui uma tarefa simples aplicando descrição e obs. comuns', async () => {
    await useCase.execute({ ...base, detalhes: 'ok', observacaoFutura: 'atenção' }, 'user-1');

    expect(repo.findPendentesDoUsuario).toHaveBeenCalledWith(['ag-1'], 'user-1');
    expect(plano().usuarioId).toBe('user-1');
    expect(plano().dataConcluida).toEqual(AGORA);
    expect(plano().atualizacoes).toEqual([
      { agendaId: 'ag-1', atividadeId: undefined, detalhes: 'ok', observacaoFutura: 'atenção' },
    ]);
  });

  it('ajuste por planta sobrescreve os campos comuns e vincula fotos', async () => {
    repo.findPendentesDoUsuario.mockResolvedValue([
      { id: 'ag-1', plantaId: 'pl-1' },
      { id: 'ag-2', plantaId: 'pl-2' },
    ]);
    await useCase.execute(
      {
        ...base,
        detalhes: 'comum',
        itens: [
          { agendaId: 'ag-1', fotos: ['u1'] },
          { agendaId: 'ag-2', detalhes: 'só dela', fotos: ['u1', 'u2'] },
        ],
      },
      'user-1',
    );

    expect(plano().atualizacoes.map((a) => a.detalhes)).toEqual(['comum', 'só dela']);
    expect(plano().fotos).toEqual([
      { agendaId: 'ag-1', plantaId: 'pl-1', caminhoArquivo: 'u1' },
      { agendaId: 'ag-2', plantaId: 'pl-2', caminhoArquivo: 'u1' },
      { agendaId: 'ag-2', plantaId: 'pl-2', caminhoArquivo: 'u2' },
    ]);
  });

  it('troca a atividade e cria extras concluídos em cada planta', async () => {
    await useCase.execute({ ...base, atividadeId: 'at-x', extras: ['at-e1', 'at-e2'], detalhes: 'd' }, 'user-1');

    expect(repo.atividadesExistem).toHaveBeenCalledWith(['at-x', 'at-e1', 'at-e2']);
    expect(plano().atualizacoes[0].atividadeId).toBe('at-x');
    expect(plano().criarConcluidas).toEqual([
      { plantaId: 'pl-1', atividadeId: 'at-e1', data: AGORA, detalhes: 'd' },
      { plantaId: 'pl-1', atividadeId: 'at-e2', data: AGORA, detalhes: 'd' },
    ]);
  });

  it('cria próximos passos por planta e não cria revisão', async () => {
    const quando = emDias(14).toISOString();
    await useCase.execute({ ...base, proximos: [{ atividadeId: 'at-p', dataAgendada: quando }] }, 'user-1');

    expect(plano().criarPendentes).toEqual([{ plantaId: 'pl-1', atividadeId: 'at-p', dataAgendada: emDias(14) }]);
    expect(plano().revisoes).toEqual([]);
    expect(repo.getRevisaoDias).not.toHaveBeenCalled();
  });

  it('cria revisão em N dias quando a planta não tem pendente', async () => {
    await useCase.execute(base, 'user-1');

    expect(repo.proximaPendente).toHaveBeenCalledWith('pl-1', AGORA, ['ag-1']);
    expect(plano().revisoes).toEqual([{ plantaId: 'pl-1', dataAgendada: emDias(30) }]);
  });

  it('não cria revisão se a próxima pendente está dentro de N + 30 dias', async () => {
    repo.proximaPendente.mockResolvedValue(emDias(60));
    await useCase.execute(base, 'user-1');
    expect(plano().revisoes).toEqual([]);
  });

  it('cria revisão se a próxima pendente está além de N + 30 dias', async () => {
    repo.getRevisaoDias.mockResolvedValue(15);
    repo.proximaPendente.mockResolvedValue(emDias(46));
    await useCase.execute(base, 'user-1');
    expect(plano().revisoes).toEqual([{ plantaId: 'pl-1', dataAgendada: emDias(15) }]);
  });

  it('não cria revisão quando a preferência está desligada (0)', async () => {
    repo.getRevisaoDias.mockResolvedValue(0);
    await useCase.execute(base, 'user-1');
    expect(repo.proximaPendente).not.toHaveBeenCalled();
    expect(plano().revisoes).toEqual([]);
  });

  it('avalia a revisão uma vez por planta distinta', async () => {
    repo.findPendentesDoUsuario.mockResolvedValue([
      { id: 'ag-1', plantaId: 'pl-1' },
      { id: 'ag-2', plantaId: 'pl-1' },
    ]);
    await useCase.execute({ ...base, itens: [{ agendaId: 'ag-1' }, { agendaId: 'ag-2' }] }, 'user-1');
    expect(repo.proximaPendente).toHaveBeenCalledTimes(1);
    expect(plano().revisoes).toHaveLength(1);
  });

  it('falha se alguma tarefa não é do usuário ou não está pendente', async () => {
    repo.findPendentesDoUsuario.mockResolvedValue([]);
    await expect(useCase.execute(base, 'user-1')).rejects.toThrow('Acesso negado ou agendamento não encontrado.');
    expect(repo.executar).not.toHaveBeenCalled();
  });

  it('falha se alguma atividade não existe', async () => {
    repo.atividadesExistem.mockResolvedValue(false);
    await expect(useCase.execute({ ...base, extras: ['x'] }, 'user-1')).rejects.toThrow('Atividade não encontrada.');
    expect(repo.executar).not.toHaveBeenCalled();
  });
});
