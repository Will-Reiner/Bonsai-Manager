import { updateUserSchema } from './auth.schema';

describe('updateUserSchema', () => {
  it('aceita as configurações da Comunidade', () => {
    const { body } = updateUserSchema.parse({ body: { perfilPublico: true, historicoPublico: true, postarAutomatico: false } });
    expect(body).toEqual({ perfilPublico: true, historicoPublico: true, postarAutomatico: false });
  });

  it('recusa valor que não é booleano', () => {
    expect(() => updateUserSchema.parse({ body: { postarAutomatico: 'sim' } })).toThrow();
  });
});
