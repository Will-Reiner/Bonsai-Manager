import { ZodError } from 'zod';
import { mensagemDoErro } from '../../utils/errors';

/** Traduz o erro de uma leitura da Comunidade: invisível/inexistente → 404; validação → 400; o resto → 500 genérico. */
export function respostaDoErro(error: unknown): { status: number; body: { error: string } } {
  if ((error as Error | undefined)?.name === 'NaoEncontrado') return { status: 404, body: { error: (error as Error).message } };
  if (error instanceof ZodError) return { status: 400, body: { error: mensagemDoErro(error, 'Pedido inválido.') } };
  // Não devolve a mensagem interna (pode ter host do banco etc.)
  return { status: 500, body: { error: 'Erro ao carregar a comunidade.' } };
}
