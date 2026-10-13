import { podeApagarComentario } from '../dominio/interacoes';
import { InteracoesRepository, NaoEncontrado } from '../comunidade.types';

export class ApagarComentarioUseCase {
  constructor(private repo: InteracoesRepository) {}

  async execute(viewerId: string, comentarioId: string): Promise<void> {
    const c = await this.repo.comentario(comentarioId);
    if (!c || !podeApagarComentario(c.usuarioId, c.post.usuarioId, viewerId)) throw new NaoEncontrado('Comentário não encontrado.');
    await this.repo.apagarComentario(comentarioId);
  }
}
