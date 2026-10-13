import { postVisivel } from './carregar-posts';
import { deveNotificar } from '../dominio/interacoes';
import type { InteracoesRepository, LeituraComunidadeRepository } from '../comunidade.types';

export class CurtirPostUseCase {
  constructor(
    private leitura: LeituraComunidadeRepository,
    private repo: InteracoesRepository,
  ) {}

  /** Idempotente: só avisa o dono quando a curtida é nova; descurtir apaga o aviso. */
  async execute(viewerId: string, postId: string, curtir: boolean): Promise<{ curtiu: boolean; curtidas: number }> {
    const post = await postVisivel(this.leitura, viewerId, postId);
    const aviso = { usuarioId: post.usuario.id, atorId: viewerId, tipo: 'CURTIDA' as const, postId };
    if (curtir) {
      if ((await this.repo.curtir(viewerId, postId)) && deveNotificar(viewerId, post.usuario.id)) await this.repo.notificar(aviso);
    } else if (await this.repo.descurtir(viewerId, postId)) {
      await this.repo.removerNotificacoes(aviso);
    }
    return { curtiu: curtir, curtidas: await this.repo.totalCurtidas(postId) };
  }
}
