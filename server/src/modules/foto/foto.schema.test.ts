import { createFotoSchema } from './foto.schema';

describe('createFotoSchema — dataCaptura', () => {
  const base = { caminhoArquivo: 'https://r2.example/x.webp' };

  it('preserva dataCaptura válida (ISO 8601) no parse', () => {
    const dataCaptura = '2024-03-15T10:30:00.000Z';
    const result = createFotoSchema.parse({ body: { ...base, dataCaptura } });
    expect(result.body.dataCaptura).toBe(dataCaptura);
  });

  it('rejeita dataCaptura com formato inválido', () => {
    expect(() =>
      createFotoSchema.parse({ body: { ...base, dataCaptura: '15/03/2024' } }),
    ).toThrow();
  });

  it('aceita ausência de dataCaptura', () => {
    const result = createFotoSchema.parse({ body: { ...base } });
    expect(result.body.dataCaptura).toBeUndefined();
  });
});
