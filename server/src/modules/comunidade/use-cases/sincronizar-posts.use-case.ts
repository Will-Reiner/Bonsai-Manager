import type { Db } from '../../planta/use-cases/reavaliar-grupos';
import { planejarPosts } from '../dominio/post';
import { PostsRepository, SincronizadorDePosts } from '../comunidade.types';

/**
 * Deixa os posts de cada planta iguais aos dias em que ela tem foto (idempotente): cobre foto nova, apagada,
 * movida ou com data mudada — e cuidado com data editada — sem precisar saber o "dia antigo".
 */
export class SincronizarPostsUseCase implements SincronizadorDePosts {
  constructor(
    private repo: PostsRepository,
    private agora: () => Date = () => new Date(),
  ) {}

  async execute({ plantaIds }: { plantaIds: string[] }, _usuarioId?: string, db?: Db): Promise<void> {
    const ids = [...new Set(plantaIds.filter(Boolean))];
    if (!ids.length) return;
    try {
      const agora = this.agora();
      for (const e of await this.repo.estadoDasPlantas(ids, db)) {
        const plano = planejarPosts(e.fotos, e.diasComPost, e, agora);
        if (plano.criar.length || plano.apagar.length) await this.repo.aplicar(e.plantaId, e.usuarioId, plano, db);
      }
    } catch (erro) {
      // Dentro de transação, desfaz junto; fora, a próxima escrita na planta corrige (não derruba o envio da foto)
      if (db) throw erro;
      console.error('[comunidade] falha ao sincronizar posts', erro);
    }
  }
}
