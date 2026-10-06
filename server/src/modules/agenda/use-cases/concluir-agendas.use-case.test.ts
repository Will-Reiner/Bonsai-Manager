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
      findPendentesDoUsuario: jest.fn().mockResolvedValue([{ id: 'ag-1', plantaId: 'pl-1', atividadeId: 'at-1', rotinaId: null }]),
      findPendentesParaReconciliar: jest.fn(),
      atividadesExistem: jest.fn().mockResolvedValue(true),
      revisoesDasPlantas: jest.fn().mockResolvedValue([]),
      estadoRotinas: jest.fn().mockResolvedValue([]),
      executar: jest.fn().mockResolvedValue({ concluidas: [], criadas: [] }),
      contarPlantasDoUsuario: jest.fn(),
      registrar: jest.fn(),
      transplanteDasPlantas: jest.fn().mockResolvedValue({ atividadeId: null, dias: 15, plantas: [] }),
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
      { id: 'ag-1', plantaId: 'pl-1', atividadeId: 'at-1', rotinaId: null },
      { id: 'ag-2', plantaId: 'pl-2', atividadeId: 'at-1', rotinaId: null },
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

  it('cria próximos passos por planta', async () => {
    const quando = emDias(14).toISOString();
    await useCase.execute({ ...base, proximos: [{ atividadeId: 'at-p', dataAgendada: quando }] }, 'user-1');

    expect(plano().criarPendentes).toEqual([{ plantaId: 'pl-1', atividadeId: 'at-p', dataAgendada: emDias(14) }]);
  });

  describe('Revisão geral (rotina)', () => {
    const rev = { id: 'rev1', plantaId: 'pl-1', atividadeId: 'at-rev', intervaloDias: 30, dataFim: null, pausada: false };

    it('qualquer cuidado remarca a revisão pendente da planta para data feita + intervalo', async () => {
      repo.revisoesDasPlantas.mockResolvedValue([{ ...rev, pendenteId: 'ag-rev', pendenteData: emDias(3) }]);

      await useCase.execute(base, 'user-1');

      expect(repo.revisoesDasPlantas).toHaveBeenCalledWith(['pl-1'], ['ag-1']);
      expect(plano().moverPendentes).toEqual([{ agendaId: 'ag-rev', dataAgendada: emDias(30) }]);
      expect(plano().criarPendentes).toEqual([]);
    });

    it('concluir a própria revisão cria a próxima', async () => {
      repo.revisoesDasPlantas.mockResolvedValue([{ ...rev, pendenteId: null, pendenteData: null }]);

      await useCase.execute(base, 'user-1');

      expect(plano().moverPendentes).toEqual([]);
      expect(plano().criarPendentes).toEqual([
        { rotinaId: 'rev1', plantaId: 'pl-1', atividadeId: 'at-rev', dataAgendada: emDias(30) },
      ]);
    });

    it('consulta as revisões uma vez, com as plantas distintas', async () => {
      repo.findPendentesDoUsuario.mockResolvedValue([
        { id: 'ag-1', plantaId: 'pl-1', atividadeId: 'at-1', rotinaId: null },
        { id: 'ag-2', plantaId: 'pl-1', atividadeId: 'at-1', rotinaId: null },
      ]);
      await useCase.execute({ ...base, itens: [{ agendaId: 'ag-1' }, { agendaId: 'ag-2' }] }, 'user-1');
      expect(repo.revisoesDasPlantas).toHaveBeenCalledTimes(1);
      expect(repo.revisoesDasPlantas).toHaveBeenCalledWith(['pl-1'], ['ag-1', 'ag-2']);
    });
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

  describe('rotinas', () => {
    it('concluir tarefa de rotina agenda a próxima a partir da data feita', async () => {
      repo.findPendentesDoUsuario.mockResolvedValue([{ id: 'ag-1', plantaId: 'pl-1', atividadeId: 'at-1', rotinaId: 'r1' }]);
      repo.estadoRotinas.mockResolvedValue([
        { id: 'r1', plantaId: 'pl-1', atividadeId: 'at-1', intervaloDias: 14, dataFim: null, pausada: false, temPendente: false },
      ]);

      await useCase.execute(base, 'user-1');

      expect(repo.estadoRotinas).toHaveBeenCalledWith(['r1'], ['ag-1']);
      expect(plano().criarPendentes).toEqual([
        { rotinaId: 'r1', plantaId: 'pl-1', atividadeId: 'at-1', dataAgendada: emDias(14) },
      ]);
    });

    const rotinaR1 = { id: 'r1', plantaId: 'pl-1', atividadeId: 'at-1', intervaloDias: 14, dataFim: null, pausada: false, temPendente: false };
    const feitaHa3Dias = { ...base, dataConcluida: emDias(-3).toISOString() };

    it('trocar a atividade de tarefa de rotina desvincula a tarefa e a rotina segue a partir de hoje', async () => {
      repo.findPendentesDoUsuario.mockResolvedValue([{ id: 'ag-1', plantaId: 'pl-1', atividadeId: 'at-1', rotinaId: 'r1' }]);
      repo.estadoRotinas.mockResolvedValue([rotinaR1]);

      await useCase.execute({ ...feitaHa3Dias, atividadeId: 'at-x' }, 'user-1');

      expect(plano().atualizacoes[0].desvincularRotina).toBe(true);
      expect(plano().criarPendentes).toEqual([
        { rotinaId: 'r1', plantaId: 'pl-1', atividadeId: 'at-1', dataAgendada: emDias(14) },
      ]);
    });

    it('mesma atividade mantém o vínculo e a próxima conta da data feita', async () => {
      repo.findPendentesDoUsuario.mockResolvedValue([{ id: 'ag-1', plantaId: 'pl-1', atividadeId: 'at-1', rotinaId: 'r1' }]);
      repo.estadoRotinas.mockResolvedValue([rotinaR1]);

      await useCase.execute({ ...feitaHa3Dias, atividadeId: 'at-1' }, 'user-1');

      expect(plano().atualizacoes[0].desvincularRotina).toBeUndefined();
      expect(plano().criarPendentes).toEqual([
        { rotinaId: 'r1', plantaId: 'pl-1', atividadeId: 'at-1', dataAgendada: emDias(11) },
      ]);
    });

    it('tarefa avulsa não consulta rotinas', async () => {
      await useCase.execute(base, 'user-1');
      expect(repo.estadoRotinas).not.toHaveBeenCalled();
    });
  });

  describe('mover para Recém transplantada', () => {
    const estado = { plantaId: 'pl-1', grupo: 'PRE_TRANSPLANTE' as const, grupoAnterior: 'REFINAMENTO' as const, grupoExpiraEm: null };

    beforeEach(() => {
      repo.transplanteDasPlantas.mockResolvedValue({ atividadeId: 'at-transplante', dias: 15, plantas: [estado] });
    });

    const esperado = [
      { plantaId: 'pl-1', grupo: 'RECEM_TRANSPLANTADA', grupoAnterior: 'REFINAMENTO', grupoExpiraEm: emDias(15) },
    ];

    it('tarefa de Transplante concluída com a opção move a planta', async () => {
      repo.findPendentesDoUsuario.mockResolvedValue([{ id: 'ag-1', plantaId: 'pl-1', atividadeId: 'at-transplante', rotinaId: null }]);

      await useCase.execute({ ...base, moverRecemTransplantada: true }, 'user-1');

      expect(repo.transplanteDasPlantas).toHaveBeenCalledWith(['pl-1'], 'user-1');
      expect(plano().atualizarGrupos).toEqual(esperado);
    });

    it('vale quando a tarefa é concluída como Transplante ou com Transplante nos extras', async () => {
      await useCase.execute({ ...base, atividadeId: 'at-transplante', moverRecemTransplantada: true }, 'user-1');
      expect(plano().atualizarGrupos).toEqual(esperado);

      repo.executar.mockClear();
      await useCase.execute({ ...base, extras: ['at-transplante'], moverRecemTransplantada: true }, 'user-1');
      expect(plano().atualizarGrupos).toEqual(esperado);
    });

    it('outra atividade não move', async () => {
      await useCase.execute({ ...base, moverRecemTransplantada: true }, 'user-1');

      expect(plano().atualizarGrupos).toEqual([]);
    });

    it('sem a opção, não consulta nem move', async () => {
      repo.findPendentesDoUsuario.mockResolvedValue([{ id: 'ag-1', plantaId: 'pl-1', atividadeId: 'at-transplante', rotinaId: null }]);

      await useCase.execute(base, 'user-1');

      expect(repo.transplanteDasPlantas).not.toHaveBeenCalled();
      expect(plano().atualizarGrupos).toEqual([]);
    });
  });
});
