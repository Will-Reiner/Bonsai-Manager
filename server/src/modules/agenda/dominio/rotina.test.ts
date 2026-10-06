import { planejarProximas, proximaDataRotina, remarcarRevisoes, RevisaoEstado, RotinaEstado } from './rotina';

const BASE = new Date('2026-10-05T12:00:00.000Z');
const dias = (n: number) => new Date(BASE.getTime() + n * 86_400_000);

const rotina = (over: Partial<RotinaEstado> = {}): RotinaEstado => ({
  id: 'r1',
  plantaId: 'p1',
  atividadeId: 'adubo',
  intervaloDias: 14,
  dataFim: null,
  pausada: false,
  temPendente: false,
  ...over,
});

describe('proximaDataRotina', () => {
  it('soma o intervalo à data base', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: null }, BASE)).toEqual(dias(14));
  });

  it('aceita a próxima exatamente na data final', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: dias(14) }, BASE)).toEqual(dias(14));
  });

  it('não gera depois da data final', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: dias(13) }, BASE)).toBeNull();
  });
});

describe('planejarProximas', () => {
  it('gera a próxima a partir da última vez feita', () => {
    expect(planejarProximas([rotina()], [{ rotinaId: 'r1', data: BASE }])).toEqual([
      { rotinaId: 'r1', plantaId: 'p1', atividadeId: 'adubo', dataAgendada: dias(14) },
    ]);
  });

  it('com várias conclusões da mesma rotina, usa a mais recente', () => {
    const r = planejarProximas([rotina()], [
      { rotinaId: 'r1', data: dias(-3) },
      { rotinaId: 'r1', data: BASE },
    ]);
    expect(r).toEqual([{ rotinaId: 'r1', plantaId: 'p1', atividadeId: 'adubo', dataAgendada: dias(14) }]);
  });

  it('não gera para rotina pausada, que já tem pendente, sem conclusão ou após a data final', () => {
    const r = planejarProximas(
      [
        rotina({ id: 'pausada', pausada: true }),
        rotina({ id: 'com-pendente', temPendente: true }),
        rotina({ id: 'sem-feita' }),
        rotina({ id: 'acabou', dataFim: dias(5) }),
      ],
      [
        { rotinaId: 'pausada', data: BASE },
        { rotinaId: 'com-pendente', data: BASE },
        { rotinaId: 'acabou', data: BASE },
      ],
    );
    expect(r).toEqual([]);
  });
});

describe('proximaDataRotina com estações', () => {
  const MAIO = new Date('2026-05-01T15:00:00.000Z');

  it('dentro da estação ativa, só soma o intervalo', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: null, estacoes: ['OUTONO'] }, MAIO)).toEqual(
      new Date('2026-05-15T15:00:00.000Z'),
    );
  });

  it('fora das estações ativas, pula para o início da próxima', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: null, estacoes: ['PRIMAVERA', 'VERAO'] }, MAIO)).toEqual(
      new Date('2026-09-22T15:00:00.000Z'),
    );
  });

  it('a data final vale depois do salto de estação', () => {
    expect(
      proximaDataRotina({ intervaloDias: 14, dataFim: new Date('2026-08-01T00:00:00.000Z'), estacoes: ['PRIMAVERA'] }, MAIO),
    ).toBeNull();
  });

  it('estações vazias ou nulas = ano todo', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: null, estacoes: [] }, MAIO)).toEqual(new Date('2026-05-15T15:00:00.000Z'));
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: null, estacoes: null }, MAIO)).toEqual(new Date('2026-05-15T15:00:00.000Z'));
  });
});

describe('planejarProximas e a revisão', () => {
  it('rotina de revisão não avança por aqui (é remarcada à parte)', () => {
    expect(planejarProximas([rotina({ revisao: true })], [{ rotinaId: 'r1', data: BASE }])).toEqual([]);
  });
});

describe('remarcarRevisoes', () => {
  const rev = (over: Partial<RevisaoEstado> = {}): RevisaoEstado => ({
    id: 'rev1',
    plantaId: 'p1',
    atividadeId: 'revisao',
    intervaloDias: 30,
    dataFim: null,
    pausada: false,
    pendenteId: 'ag-r',
    ...over,
  });

  it('move a pendente para a data do cuidado + intervalo', () => {
    expect(remarcarRevisoes([rev()], BASE)).toEqual({ mover: [{ agendaId: 'ag-r', dataAgendada: dias(30) }], criar: [] });
  });

  it('sem pendente, cria', () => {
    expect(remarcarRevisoes([rev({ pendenteId: null })], BASE)).toEqual({
      mover: [],
      criar: [{ rotinaId: 'rev1', plantaId: 'p1', atividadeId: 'revisao', dataAgendada: dias(30) }],
    });
  });

  it('pausada ou após a data final não mexe em nada', () => {
    expect(remarcarRevisoes([rev({ pausada: true }), rev({ id: 'rev2', dataFim: dias(10) })], BASE)).toEqual({ mover: [], criar: [] });
  });
});
