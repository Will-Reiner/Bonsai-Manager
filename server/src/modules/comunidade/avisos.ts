import type { AvisoDeSeguir } from '../amizade/amizade.types';
import { PrismaInteracoesRepository } from './repositories/prisma-interacoes.repository';

/** Avisos de "começou a seguir você" (seguir a si mesmo já é barrado antes). */
export function criarAvisoDeSeguir(): AvisoDeSeguir {
  const repo = new PrismaInteracoesRepository();
  return {
    seguiu: (seguidorId, seguidoId) => repo.notificar({ usuarioId: seguidoId, atorId: seguidorId, tipo: 'SEGUIU' }),
    deixouDeSeguir: (seguidorId, seguidoId) => repo.removerNotificacoes({ usuarioId: seguidoId, atorId: seguidorId, tipo: 'SEGUIU' }),
  };
}
