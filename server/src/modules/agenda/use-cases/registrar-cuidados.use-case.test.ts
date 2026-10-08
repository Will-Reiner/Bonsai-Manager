import { RegistrarCuidadosUseCase } from './registrar-cuidados.use-case';
import { ConclusaoRepository, RegistrarCuidadosDTO } from '../agenda.types';

const DIA = 86_400_000;
const AGORA = new Date('2026-10-05T12:00:00.000Z');

describe('RegistrarCuidadosUseCase', () => {
  let repo: jest.Mocked<ConclusaoRepository>;
  let useCase: RegistrarCuidadosUseCase;

  const base: RegistrarCuidadosDTO = {
    data: AGORA.toISOString(),
    plantas: [{ plantaId: 'p1', atividadeIds: ['at-1'] }],
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AGORA);
    repo = {
      findPendentesDoUsuario: jest.fn(),
      findPendentesParaReconciliar: jest.fn().mockResolvedValue([]),
      atividadesExistem: jest.fn().mockResolvedValue(true),
      estadoRotinas: jest.fn().mockResolvedValue([]),
      executar: jest.fn(),
      contarPlantasDoUsuario: jest.fn().mockResolvedValue(1),
      registrar: jest.fn().mockResolvedValue({ concluidas: [], criadas: [] }),
      transplanteDasPlantas: jest.fn().mockResolvedValue({ atividadeId: null, dias: 15, plantas: [] }),
    };
    useCase = new RegistrarCuidadosUseCase(repo);
  });
  afterEach(() => jest.useRealTimers());

  const plano = () => repo.registrar.mock.calls[0][0];

  it('registra os cuidados de cada planta com fotos, nota e obs.', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(2);

    await useCase.execute(
      {
        data: AGORA.toISOString(),
        plantas: [
          {
            plantaId: 'p1',
            atividadeIds: ['at-1', 'at-2', 'at-1'],
            detalhes: 'podei',
            observacaoFutura: 'olhar o ápice',
            fotos: [{ caminhoArquivo: 'u1', dataCaptura: '2026-10-04T10:00:00.000Z' }, { caminhoArquivo: 'u2' }],
          },
          { plantaId: 'p2', atividadeIds: ['at-2'] },
        ],
      },
      'user-1',
    );

    expect(repo.contarPlantasDoUsuario).toHaveBeenCalledWith(['p1', 'p2'], 'user-1');
    expect(repo.atividadesExistem).toHaveBeenCalledWith(['at-1', 'at-2']);
    expect(plano().usuarioId).toBe('user-1');
    expect(plano().data).toEqual(AGORA);
    expect(plano().cuidados).toEqual([
      {
        plantaId: 'p1',
        atividadeIds: ['at-1', 'at-2'],
        detalhes: 'podei',
        observacaoFutura: 'olhar o ápice',
        fotos: [
          { caminhoArquivo: 'u1', dataCaptura: new Date('2026-10-04T10:00:00.000Z') },
          { caminhoArquivo: 'u2', dataCaptura: AGORA },
        ],
      },
      { plantaId: 'p2', atividadeIds: ['at-2'], detalhes: undefined, observacaoFutura: undefined, fotos: [] },
    ]);
  });

  it('com próximos passos, cria as pendentes', async () => {
    await useCase.execute(
      { ...base, proximos: [{ atividadeId: 'at-9', dataAgendada: '2026-11-05T12:00:00.000Z' }] },
      'user-1',
    );

    expect(repo.atividadesExistem).toHaveBeenCalledWith(['at-1', 'at-9']);
    expect(plano().criarPendentes).toEqual([
      { plantaId: 'p1', atividadeId: 'at-9', dataAgendada: new Date('2026-11-05T12:00:00.000Z') },
    ]);
  });

  it('lança erro quando alguma planta não é do usuário', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(0);

    await expect(useCase.execute(base, 'user-1')).rejects.toThrow('Acesso negado. A planta não pertence a si.');
    expect(repo.registrar).not.toHaveBeenCalled();
  });

  it('lança erro com planta repetida', async () => {
    await expect(
      useCase.execute({ ...base, plantas: [base.plantas[0], base.plantas[0]] }, 'user-1'),
    ).rejects.toThrow('Plantas repetidas na lista.');
  });

  it('lança erro quando uma planta fica sem cuidado', async () => {
    await expect(
      useCase.execute({ ...base, plantas: [{ plantaId: 'p1', atividadeIds: [] }] }, 'user-1'),
    ).rejects.toThrow('Informe ao menos um cuidado por planta.');
  });

  it('lança erro com data no futuro (mais de 1 dia à frente)', async () => {
    await expect(
      useCase.execute({ ...base, data: new Date(AGORA.getTime() + 2 * DIA).toISOString() }, 'user-1'),
    ).rejects.toThrow('A data não pode ser no futuro.');
    expect(repo.registrar).not.toHaveBeenCalled();
  });

  it('aceita data até 1 dia à frente (fuso do aparelho)', async () => {
    await useCase.execute({ ...base, data: new Date(AGORA.getTime() + 20 * 3_600_000).toISOString() }, 'user-1');
    expect(repo.registrar).toHaveBeenCalled();
  });

  it('lança erro com atividade inexistente', async () => {
    repo.atividadesExistem.mockResolvedValue(false);

    await expect(useCase.execute(base, 'user-1')).rejects.toThrow('Atividade não encontrada.');
    expect(repo.registrar).not.toHaveBeenCalled();
  });

  describe('concluir tarefas pendentes pelo registro', () => {
    const pendente = { id: 'ag-1', plantaId: 'p1', atividadeId: 'at-1', dataAgendada: new Date('2026-10-20T12:00:00.000Z'), rotinaId: null };

    it('tarefa de rotina concluída pelo registro agenda a próxima', async () => {
      repo.findPendentesParaReconciliar.mockResolvedValue([{ ...pendente, rotinaId: 'r1' }]);
      repo.estadoRotinas.mockResolvedValue([
        { id: 'r1', plantaId: 'p1', atividadeId: 'at-1', intervaloDias: 10, dataFim: null, pausada: false, temPendente: false },
      ]);

      await useCase.execute({ ...base, concluirAgendaIds: ['ag-1'] }, 'user-1');

      expect(repo.estadoRotinas).toHaveBeenCalledWith(['r1'], ['ag-1']);
      expect(plano().criarPendentes).toEqual([
        { rotinaId: 'r1', plantaId: 'p1', atividadeId: 'at-1', dataAgendada: new Date(AGORA.getTime() + 10 * DIA) },
      ]);
    });

    it('sem tarefas escolhidas, não busca pendentes', async () => {
      await useCase.execute(base, 'user-1');

      expect(repo.findPendentesParaReconciliar).not.toHaveBeenCalled();
      expect(plano().absorver).toEqual([]);
      expect(plano().cancelar).toEqual([]);
    });

    it('a tarefa escolhida é absorvida pelo registro', async () => {
      repo.findPendentesParaReconciliar.mockResolvedValue([pendente]);

      await useCase.execute({ ...base, concluirAgendaIds: ['ag-1', 'ag-1'] }, 'user-1');

      expect(repo.findPendentesParaReconciliar).toHaveBeenCalledWith(['ag-1'], 'user-1');
      expect(plano().absorver).toEqual([{ agendaId: 'ag-1', plantaId: 'p1', atividadeId: 'at-1' }]);
      expect(plano().cancelar).toEqual([]);
    });

    it('lança erro quando a tarefa não é do usuário ou não está mais pendente', async () => {
      repo.findPendentesParaReconciliar.mockResolvedValue([]);

      await expect(useCase.execute({ ...base, concluirAgendaIds: ['ag-1'] }, 'user-1')).rejects.toThrow(
        'Acesso negado ou agendamento não encontrado.',
      );
      expect(repo.registrar).not.toHaveBeenCalled();
    });

    it('lança erro quando a tarefa é de outro cuidado', async () => {
      repo.findPendentesParaReconciliar.mockResolvedValue([{ ...pendente, atividadeId: 'at-2' }]);

      await expect(useCase.execute({ ...base, concluirAgendaIds: ['ag-1'] }, 'user-1')).rejects.toThrow(
        'Tarefa não corresponde ao cuidado registrado.',
      );
      expect(repo.registrar).not.toHaveBeenCalled();
    });
  });

  describe('mover para Recém transplantada', () => {
    beforeEach(() => {
      repo.contarPlantasDoUsuario.mockResolvedValue(2);
      repo.transplanteDasPlantas.mockResolvedValue({
        atividadeId: 'at-transplante',
        dias: 15,
        plantas: [
          { plantaId: 'p1', grupo: 'REFINAMENTO', grupoAnterior: null, grupoExpiraEm: null },
          { plantaId: 'p2', grupo: null, grupoAnterior: null, grupoExpiraEm: null },
        ],
      });
    });

    const dto = (mover?: boolean): RegistrarCuidadosDTO => ({
      data: AGORA.toISOString(),
      plantas: [
        { plantaId: 'p1', atividadeIds: ['at-transplante'] },
        { plantaId: 'p2', atividadeIds: ['at-1'] },
      ],
      moverRecemTransplantada: mover,
    });

    it('com a opção marcada, move só as plantas transplantadas', async () => {
      await useCase.execute(dto(true), 'user-1');

      expect(repo.transplanteDasPlantas).toHaveBeenCalledWith(['p1', 'p2'], 'user-1');
      expect(plano().atualizarGrupos).toEqual([
        {
          plantaId: 'p1',
          grupo: 'RECEM_TRANSPLANTADA',
          grupoAnterior: 'REFINAMENTO',
          grupoExpiraEm: new Date(AGORA.getTime() + 15 * DIA),
        },
      ]);
    });

    it('sem a opção, não mexe em grupos', async () => {
      await useCase.execute(dto(undefined), 'user-1');

      expect(repo.transplanteDasPlantas).not.toHaveBeenCalled();
      expect(plano().atualizarGrupos).toEqual([]);
    });

    it('sem a atividade Transplante no banco, não mexe em grupos', async () => {
      repo.transplanteDasPlantas.mockResolvedValue({ atividadeId: null, dias: 15, plantas: [] });

      await useCase.execute(dto(true), 'user-1');

      expect(plano().atualizarGrupos).toEqual([]);
    });
  });
});
