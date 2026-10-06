import { planejarProximas, proximaDataRotina, RotinaEstado } from './rotina';

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
