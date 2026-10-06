import { estacaoDe, proximoInicioDeEstacao } from './estacoes';

const d = (iso: string) => new Date(`${iso}T15:00:00.000Z`);

describe('estacaoDe (hemisfério sul)', () => {
  it.each([
    ['2026-09-21', 'INVERNO'],
    ['2026-09-22', 'PRIMAVERA'],
    ['2026-12-20', 'PRIMAVERA'],
    ['2026-12-21', 'VERAO'],
    ['2027-01-15', 'VERAO'],
    ['2027-03-19', 'VERAO'],
    ['2027-03-20', 'OUTONO'],
    ['2027-06-20', 'OUTONO'],
    ['2027-06-21', 'INVERNO'],
  ])('%s é %s', (data, estacao) => {
    expect(estacaoDe(d(data))).toBe(estacao);
  });
});

describe('proximoInicioDeEstacao', () => {
  it('vai para o início da próxima estação ativa no mesmo ano', () => {
    expect(proximoInicioDeEstacao(['PRIMAVERA', 'VERAO'], d('2026-05-10'))).toEqual(d('2026-09-22'));
  });

  it('passa para o ano seguinte quando preciso', () => {
    expect(proximoInicioDeEstacao(['VERAO'], d('2027-04-01'))).toEqual(d('2027-12-21'));
    expect(proximoInicioDeEstacao(['OUTONO'], d('2026-12-25'))).toEqual(d('2027-03-20'));
  });
});
