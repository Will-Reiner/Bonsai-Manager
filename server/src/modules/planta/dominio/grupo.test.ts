import {
  aplicarTransplante,
  diasDePreTransplante,
  diasDeTransplante,
  planejarPreTransplante,
  trocaManual,
  PRE_TRANSPLANTE_PADRAO_DIAS,
  TRANSPLANTE_PADRAO_DIAS,
  type PlantaPre,
} from './grupo';

const DIA = 86_400_000;
const DATA = new Date('2026-10-06T12:00:00.000Z');

describe('aplicarTransplante', () => {
  it('guarda o grupo atual e move para Recém transplantada até data + dias', () => {
    expect(aplicarTransplante({ grupo: 'REFINAMENTO', grupoAnterior: null, grupoExpiraEm: null }, DATA, 15)).toEqual({
      grupo: 'RECEM_TRANSPLANTADA',
      grupoAnterior: 'REFINAMENTO',
      grupoExpiraEm: new Date(DATA.getTime() + 15 * DIA),
    });
  });

  it('planta sem grupo volta para sem grupo', () => {
    expect(aplicarTransplante({ grupo: null, grupoAnterior: null, grupoExpiraEm: null }, DATA, 10).grupoAnterior).toBeNull();
  });

  it('novo transplante durante o prazo recomeça o prazo e mantém o grupo de retorno original', () => {
    const antes = { grupo: 'RECEM_TRANSPLANTADA' as const, grupoAnterior: 'EM_CRESCIMENTO' as const, grupoExpiraEm: new Date(DATA.getTime() + 3 * DIA) };
    expect(aplicarTransplante(antes, DATA, 15)).toEqual({
      grupo: 'RECEM_TRANSPLANTADA',
      grupoAnterior: 'EM_CRESCIMENTO',
      grupoExpiraEm: new Date(DATA.getTime() + 15 * DIA),
    });
  });

  it('Recém transplantada escolhida à mão (sem retorno) continua sem retorno', () => {
    const antes = { grupo: 'RECEM_TRANSPLANTADA' as const, grupoAnterior: null, grupoExpiraEm: null };
    expect(aplicarTransplante(antes, DATA, 15).grupoAnterior).toBeNull();
  });
});

describe('trocaManual', () => {
  it('define o grupo e cancela o retorno automático', () => {
    expect(trocaManual('DEBILITADA')).toEqual({ grupo: 'DEBILITADA', grupoAnterior: null, grupoExpiraEm: null });
    expect(trocaManual(null)).toEqual({ grupo: null, grupoAnterior: null, grupoExpiraEm: null });
  });
});

describe('diasDeTransplante', () => {
  it('usa o padrão sem preferência ou com valor inválido', () => {
    expect(diasDeTransplante(undefined)).toBe(TRANSPLANTE_PADRAO_DIAS);
    expect(diasDeTransplante('abc')).toBe(TRANSPLANTE_PADRAO_DIAS);
  });

  it('limita entre 1 e 365', () => {
    expect(diasDeTransplante('30')).toBe(30);
    expect(diasDeTransplante('0')).toBe(1);
    expect(diasDeTransplante('9999')).toBe(365);
  });
});

describe('aplicarTransplante a partir do Pré-transplante', () => {
  it('mantém o grupo de antes do Pré-transplante como retorno', () => {
    expect(aplicarTransplante({ grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'REFINAMENTO', grupoExpiraEm: null }, DATA, 15)).toEqual({
      grupo: 'RECEM_TRANSPLANTADA',
      grupoAnterior: 'REFINAMENTO',
      grupoExpiraEm: new Date(DATA.getTime() + 15 * DIA),
    });
  });
});

describe('diasDePreTransplante', () => {
  it('padrão 30 e limite 1–365', () => {
    expect(diasDePreTransplante(undefined)).toBe(PRE_TRANSPLANTE_PADRAO_DIAS);
    expect(diasDePreTransplante('x')).toBe(30);
    expect(diasDePreTransplante('45')).toBe(45);
    expect(diasDePreTransplante('0')).toBe(1);
    expect(diasDePreTransplante('999')).toBe(365);
  });
});

describe('planejarPreTransplante', () => {
  const planta = (p: Partial<PlantaPre> = {}): PlantaPre => ({
    plantaId: 'p1',
    grupo: 'REFINAMENTO',
    grupoAnterior: null,
    preTransplanteAgendaId: null,
    ...p,
  });
  const pendente = (dias: number, agendaId = 'ag-1', plantaId = 'p1') => ({
    plantaId,
    agendaId,
    dataAgendada: new Date(DATA.getTime() + dias * DIA),
  });

  it('entra no Pré-transplante quando o transplante está dentro do prazo', () => {
    expect(planejarPreTransplante([planta()], [pendente(20)], DATA, 30)).toEqual([
      { plantaId: 'p1', grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'REFINAMENTO', preTransplanteAgendaId: 'ag-1' },
    ]);
  });

  it('transplante atrasado também conta; sem grupo guarda null', () => {
    expect(planejarPreTransplante([planta({ grupo: null })], [pendente(-2)], DATA, 30)).toEqual([
      { plantaId: 'p1', grupo: 'PRE_TRANSPLANTE', grupoAnterior: null, preTransplanteAgendaId: 'ag-1' },
    ]);
  });

  it('não entra se o transplante está além do prazo', () => {
    expect(planejarPreTransplante([planta()], [pendente(31)], DATA, 30)).toEqual([]);
  });

  it('não entra pelo mesmo agendamento depois de uma troca manual', () => {
    expect(planejarPreTransplante([planta({ preTransplanteAgendaId: 'ag-1' })], [pendente(5)], DATA, 30)).toEqual([]);
  });

  it('um agendamento novo coloca de novo', () => {
    expect(planejarPreTransplante([planta({ preTransplanteAgendaId: 'ag-velho' })], [pendente(5, 'ag-novo')], DATA, 30)).toEqual([
      { plantaId: 'p1', grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'REFINAMENTO', preTransplanteAgendaId: 'ag-novo' },
    ]);
  });

  it('Recém transplantada não entra', () => {
    expect(planejarPreTransplante([planta({ grupo: 'RECEM_TRANSPLANTADA' })], [pendente(5)], DATA, 30)).toEqual([]);
  });

  it('usa o transplante mais cedo da planta', () => {
    expect(planejarPreTransplante([planta()], [pendente(25, 'ag-b'), pendente(10, 'ag-a')], DATA, 30)[0].preTransplanteAgendaId).toBe('ag-a');
  });

  it('sem transplante no prazo, volta ao grupo de antes', () => {
    const pre = planta({ grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'EM_CRESCIMENTO', preTransplanteAgendaId: 'ag-1' });
    expect(planejarPreTransplante([pre], [], DATA, 30)).toEqual([
      { plantaId: 'p1', grupo: 'EM_CRESCIMENTO', grupoAnterior: null, preTransplanteAgendaId: null },
    ]);
    expect(planejarPreTransplante([pre], [pendente(60)], DATA, 30)[0].grupo).toBe('EM_CRESCIMENTO');
  });

  it('continua no Pré-transplante com o mesmo agendamento; troca só o marcador se mudou', () => {
    const pre = planta({ grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'EM_CRESCIMENTO', preTransplanteAgendaId: 'ag-1' });
    expect(planejarPreTransplante([pre], [pendente(3)], DATA, 30)).toEqual([]);
    expect(planejarPreTransplante([pre], [pendente(3, 'ag-2')], DATA, 30)).toEqual([{ ...pre, preTransplanteAgendaId: 'ag-2' }]);
  });

  it('pendentes de outras plantas não contam', () => {
    expect(planejarPreTransplante([planta()], [pendente(5, 'ag-x', 'p2')], DATA, 30)).toEqual([]);
  });
});
