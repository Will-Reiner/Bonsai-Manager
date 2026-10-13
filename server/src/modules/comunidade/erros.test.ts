import { ZodError, z } from 'zod';
import { respostaDoErro } from './erros';
import { NaoEncontrado } from './comunidade.types';

describe('respostaDoErro', () => {
  it('não encontrado/invisível → 404 com a mensagem', () => {
    expect(respostaDoErro(new NaoEncontrado('Post não encontrado.'))).toEqual({ status: 404, body: { error: 'Post não encontrado.' } });
  });
  it('validação → 400 com a mensagem do primeiro erro', () => {
    let erro: unknown;
    try {
      z.object({ q: z.string().max(1, 'Muito longo.') }).parse({ q: 'abc' });
    } catch (e) {
      erro = e;
    }
    expect(erro).toBeInstanceOf(ZodError);
    expect(respostaDoErro(erro)).toEqual({ status: 400, body: { error: 'Muito longo.' } });
  });
  it('qualquer outro erro (banco fora do ar…) → 500 genérico, sem vazar a mensagem interna', () => {
    expect(respostaDoErro(new Error("Can't reach database server at ep-x.neon.tech:5432"))).toEqual({
      status: 500,
      body: { error: 'Erro ao carregar a comunidade.' },
    });
  });
});
