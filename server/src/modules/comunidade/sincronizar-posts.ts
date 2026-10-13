import { PrismaPostsRepository } from './repositories/prisma-posts.repository';
import { SincronizarPostsUseCase } from './use-cases/sincronizar-posts.use-case';

/** Sincronizador de posts pronto para injetar em quem grava fotos ou tarefas. */
export const criarSincronizadorDePosts = () => new SincronizarPostsUseCase(new PrismaPostsRepository());
