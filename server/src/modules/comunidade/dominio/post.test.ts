import { decidirNoFeed, diaDoPost, diaLocal, FotoParaPost, planejarPosts } from './post';

const foto = (over: Partial<FotoParaPost> = {}): FotoParaPost => ({
  tipo: 'FOTO',
  dataCaptura: null,
  createdAt: new Date('2026-10-10T15:00:00Z'),
  agenda: null,
  ...over,
});
const publico = { perfilPublico: true, plantaPublica: true, postarAutomatico: true };

describe('diaLocal', () => {
  it('23h30 em São Paulo continua no mesmo dia (02h30 UTC do seguinte)', () => {
    expect(diaLocal(new Date('2026-10-11T02:30:00Z'))).toBe('2026-10-10');
  });
  it('meio-dia UTC é o mesmo dia', () => {
    expect(diaLocal(new Date('2026-10-10T12:00:00Z'))).toBe('2026-10-10');
  });
});

describe('diaDoPost', () => {
  it('usa a data de captura quando há', () => {
    expect(diaDoPost(foto({ dataCaptura: new Date('2026-09-01T15:00:00Z') }))).toBe('2026-09-01');
  });
  it('sem captura usa a data de upload', () => {
    expect(diaDoPost(foto())).toBe('2026-10-10');
  });
  it('foto de cuidado concluído usa o dia do cuidado, não o da captura', () => {
    const f = foto({
      dataCaptura: new Date('2026-09-01T15:00:00Z'),
      agenda: { status: 'CONCLUIDO', dataConcluida: new Date('2026-10-05T15:00:00Z'), dataAgendada: new Date('2026-10-01T15:00:00Z') },
    });
    expect(diaDoPost(f)).toBe('2026-10-05');
  });
  it('cuidado concluído sem dataConcluida usa a dataAgendada', () => {
    const f = foto({ agenda: { status: 'CONCLUIDO', dataConcluida: null, dataAgendada: new Date('2026-10-01T15:00:00Z') } });
    expect(diaDoPost(f)).toBe('2026-10-01');
  });
  it('foto de tarefa pendente segue a própria data', () => {
    const f = foto({ agenda: { status: 'PENDENTE', dataConcluida: null, dataAgendada: new Date('2026-12-01T15:00:00Z') } });
    expect(diaDoPost(f)).toBe('2026-10-10');
  });
  it('visão futura não gera post', () => {
    expect(diaDoPost(foto({ tipo: 'VISAO_FUTURA' }))).toBeNull();
  });
});

describe('decidirNoFeed', () => {
  it('tudo público e recente → entra no feed', () => {
    expect(decidirNoFeed(publico, '2026-10-13', '2026-10-13')).toBe(false);
  });
  it('7 dias atrás ainda entra; 8 não', () => {
    expect(decidirNoFeed(publico, '2026-10-06', '2026-10-13')).toBe(false);
    expect(decidirNoFeed(publico, '2026-10-05', '2026-10-13')).toBe(true);
  });
  it.each([
    ['perfil privado', { ...publico, perfilPublico: false }],
    ['planta privada', { ...publico, plantaPublica: false }],
    ['sem postar automaticamente', { ...publico, postarAutomatico: false }],
  ])('%s → fora do feed', (_nome, c) => {
    expect(decidirNoFeed(c, '2026-10-13', '2026-10-13')).toBe(true);
  });
});

describe('planejarPosts', () => {
  const agora = new Date('2026-10-13T15:00:00Z');

  it('cria post para dia novo com foto, decidindo o feed', () => {
    const plano = planejarPosts([foto({ createdAt: agora })], [], publico, agora);
    expect(plano).toEqual({ criar: [{ dia: '2026-10-13', noFeed: false }], apagar: [] });
  });
  it('segunda foto no mesmo dia não cria de novo', () => {
    const plano = planejarPosts([foto({ createdAt: agora }), foto({ createdAt: agora })], ['2026-10-13'], publico, agora);
    expect(plano).toEqual({ criar: [], apagar: [] });
  });
  it('dia sem foto perde o post', () => {
    const plano = planejarPosts([foto({ createdAt: agora })], ['2026-10-13', '2026-10-01'], publico, agora);
    expect(plano).toEqual({ criar: [], apagar: ['2026-10-01'] });
  });
  it('cuidado com data editada: post muda de dia', () => {
    const f = foto({ agenda: { status: 'CONCLUIDO', dataConcluida: new Date('2026-10-12T15:00:00Z'), dataAgendada: agora } });
    const plano = planejarPosts([f], ['2026-10-11'], publico, agora);
    expect(plano).toEqual({ criar: [{ dia: '2026-10-12', noFeed: false }], apagar: ['2026-10-11'] });
  });
  it('foto antiga em lote nasce fora do feed', () => {
    const plano = planejarPosts([foto({ dataCaptura: new Date('2026-08-01T15:00:00Z') })], [], publico, agora);
    expect(plano.criar).toEqual([{ dia: '2026-08-01', noFeed: true }]);
  });
  it('só visão futura: nada a criar', () => {
    expect(planejarPosts([foto({ tipo: 'VISAO_FUTURA' })], [], publico, agora)).toEqual({ criar: [], apagar: [] });
  });
});
