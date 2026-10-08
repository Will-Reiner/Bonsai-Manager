import { z } from 'zod';
import { mensagemDoErro } from './errors';

describe('mensagemDoErro', () => {
  it('erro do Zod: só a mensagem do primeiro problema (não o JSON de todos)', () => {
    const schema = z.object({
      codigo: z.number({ invalid_type_error: 'O código da planta deve ser um número.' }),
      nome: z.string({ required_error: 'Nome obrigatório.' }),
    });
    const resultado = schema.safeParse({ codigo: 'abc' });

    expect(resultado.success).toBe(false);
    expect(mensagemDoErro(!resultado.success && resultado.error)).toBe('O código da planta deve ser um número.');
  });

  it('erro comum: a própria mensagem', () => {
    expect(mensagemDoErro(new Error('Planta não encontrada'))).toBe('Planta não encontrada');
  });

  it('sem mensagem: usa o fallback', () => {
    expect(mensagemDoErro(new Error(''), 'Erro ao criar planta')).toBe('Erro ao criar planta');
    expect(mensagemDoErro('qualquer coisa', 'Erro ao criar planta')).toBe('Erro ao criar planta');
    expect(mensagemDoErro(undefined)).toBe('Dados inválidos.');
  });
});
