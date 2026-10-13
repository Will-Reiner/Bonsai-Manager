import { chaveDoDia, conteudoPorDia } from './conteudo';
import type { CuidadoLido, FotoLida } from '../comunidade.types';

const foto = (over: Partial<FotoLida>): FotoLida => ({
  id: 'f',
  plantaId: 'p1',
  caminhoArquivo: 'https://cdn/f.webp',
  thumbnailUrl: null,
  tipo: 'FOTO',
  dataCaptura: null,
  createdAt: new Date('2026-10-10T15:00:00Z'),
  agenda: null,
  ...over,
});
const cuidado = (over: Partial<CuidadoLido>): CuidadoLido => ({
  plantaId: 'p1',
  dataConcluida: new Date('2026-10-10T15:00:00Z'),
  dataAgendada: new Date('2026-10-10T15:00:00Z'),
  detalhes: null,
  observacaoFutura: null,
  atividade: { nome: 'Poda' },
  ...over,
});

describe('conteudoPorDia', () => {
  it('junta fotos e cuidados da mesma planta no mesmo dia local', () => {
    const mapa = conteudoPorDia([foto({ id: 'f1' })], [cuidado({ detalhes: 'galho alto' })]);
    expect(mapa.get(chaveDoDia('p1', '2026-10-10'))).toEqual({
      fotos: [{ id: 'f1', url: 'https://cdn/f.webp', tipo: 'FOTO', thumbnailUrl: null }],
      cuidados: [{ atividade: 'Poda', detalhes: 'galho alto', observacao: null }],
    });
  });
  it('fotos em ordem cronológica', () => {
    const mapa = conteudoPorDia(
      [foto({ id: 'tarde', createdAt: new Date('2026-10-10T20:00:00Z') }), foto({ id: 'manha', createdAt: new Date('2026-10-10T12:00:00Z') })],
      [],
    );
    expect(mapa.get(chaveDoDia('p1', '2026-10-10'))!.fotos.map((f) => f.id)).toEqual(['manha', 'tarde']);
  });
  it('separa plantas e dias; visão futura fica de fora', () => {
    const mapa = conteudoPorDia(
      [foto({ id: 'a' }), foto({ id: 'b', plantaId: 'p2' }), foto({ id: 'c', tipo: 'VISAO_FUTURA' })],
      [cuidado({ dataConcluida: new Date('2026-10-11T15:00:00Z') })],
    );
    expect(mapa.get(chaveDoDia('p1', '2026-10-10'))!.fotos.map((f) => f.id)).toEqual(['a']);
    expect(mapa.get(chaveDoDia('p2', '2026-10-10'))!.fotos.map((f) => f.id)).toEqual(['b']);
    expect(mapa.get(chaveDoDia('p1', '2026-10-11'))).toEqual({ fotos: [], cuidados: [{ atividade: 'Poda', detalhes: null, observacao: null }] });
  });
});
