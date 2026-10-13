import { postVisivel } from './carregar-posts';
import { deveNotificar } from '../dominio/interacoes';
import { comentarioDe } from '../dominio/montar';
import type { ComentarioDTO, InteracoesRepository, LeituraComunidadeRepository } from '../comunidade.types';

export class ComentarUseCase {
  constructor(
    private leitura: LeituraComunidadeRepository,
    private repo: InteracoesRepository,
  ) {}

  /** O texto já vem validado (1–1000, sem espaços nas pontas) pelo schema. */
  async execute(viewerId: string, postId: string, texto: string): Promise<ComentarioDTO> {
    const post = await postVisivel(this.leitura, viewerId, postId);
    const comentario = await this.repo.comentar(viewerId, postId, texto);
    if (deveNotificar(viewerId, post.usuario.id)) {
      await this.repo.notificar({ usuarioId: post.usuario.id, atorId: viewerId, tipo: 'COMENTARIO', postId, comentarioId: comentario.id });
    }
    return comentarioDe(comentario, viewerId);
  }
}
