import { postVisivel } from './carregar-posts';
import { deveNotificar } from '../dominio/interacoes';
import type { InteracoesRepository, LeituraComunidadeRepository } from '../comunidade.types';

export class CurtirPostUseCase {
  constructor(
    private leitura: LeituraComunidadeRepository,
    private repo: InteracoesRepository,
  ) {}

  /** Idempotente: o dono só é avisado quando a curtida é nova; descurtir apaga o aviso (cada um numa transação). */
  async execute(viewerId: string, postId: string, curtir: boolean): Promise<{ curtiu: boolean; curtidas: number }> {
    const post = await postVisivel(this.leitura, viewerId, postId);
    const aviso = { usuarioId: post.usuario.id, atorId: viewerId, tipo: 'CURTIDA' as const, postId };
    if (curtir) await this.repo.curtir(viewerId, postId, deveNotificar(viewerId, post.usuario.id) ? aviso : null);
    else await this.repo.descurtir(viewerId, postId, aviso);
    return { curtiu: curtir, curtidas: await this.repo.totalCurtidas(postId) };
  }
}
