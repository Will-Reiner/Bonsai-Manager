import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito com recurso existente.') {
    super(message, 409);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado.') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Dados inválidos.') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado.') {
    super(message, 401);
  }
}

/**
 * Mensagem do erro para a resposta da API. No ZodError o `message` é o JSON de
 * todos os problemas, então devolve só a mensagem do primeiro.
 */
export function mensagemDoErro(error: unknown, fallback = 'Dados inválidos.'): string {
  if (error instanceof ZodError) return error.errors[0]?.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}
