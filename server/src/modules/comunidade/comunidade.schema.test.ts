import { buscaSchema, comentarSchema, feedSchema, idSchema, paginaSchema } from './comunidade.schema';

const UUID = '6f1b4a8e-2f7a-4c1e-9a4b-3d2e1f0a9b8c';

describe('schemas da Comunidade', () => {
  it('feed: aba padrão seguindo e cursor opcional', () => {
    expect(feedSchema.parse({ query: {} }).query).toEqual({ aba: 'seguindo' });
    const cursor = `2026-10-13T18:00:00.000Z_${UUID}`;
    expect(feedSchema.parse({ query: { aba: 'explorar', cursor } }).query).toEqual({ aba: 'explorar', cursor });
  });
  it('feed: cursor fora do formato data_id é recusado', () => {
    expect(() => feedSchema.parse({ query: { cursor: UUID } })).toThrow();
  });
  it('feed: aba desconhecida é recusada', () => {
    expect(() => feedSchema.parse({ query: { aba: 'todos' } })).toThrow();
  });
  it('id precisa ser uuid', () => {
    expect(() => idSchema.parse({ params: { id: 'x' } })).toThrow();
    expect(idSchema.parse({ params: { id: UUID } }).params.id).toBe(UUID);
  });
  it('busca: termo vazio por padrão', () => {
    expect(buscaSchema.parse({ query: {} }).query.q).toBe('');
  });
});

describe('comentário', () => {
  it('limpa espaços e aceita até 1000', () => {
    expect(comentarSchema.parse({ params: { id: UUID }, body: { texto: '  Lindo!  ' } }).body.texto).toBe('Lindo!');
    expect(() => comentarSchema.parse({ params: { id: UUID }, body: { texto: 'x'.repeat(1001) } })).toThrow();
  });
  it('vazio ou só espaços é recusado', () => {
    expect(() => comentarSchema.parse({ params: { id: UUID }, body: { texto: '   ' } })).toThrow('Escreva o comentário.');
  });
  it('página só com cursor', () => {
    expect(paginaSchema.parse({ query: {} }).query).toEqual({});
  });
});
