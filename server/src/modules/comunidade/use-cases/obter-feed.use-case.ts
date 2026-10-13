import { carregarPosts, LIMITE_PAGINA, pagina } from './carregar-posts';
import type { AbaFeed, LeituraComunidadeRepository, PaginaDTO, PostDTO } from '../comunidade.types';

export class ObterFeedUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(viewerId: string, aba: AbaFeed, cursor?: string): Promise<PaginaDTO<PostDTO>> {
    const lidos = await this.repo.feed(viewerId, aba, cursor, LIMITE_PAGINA);
    return pagina(await carregarPosts(this.repo, lidos, viewerId), lidos, 'publicadoEm');
  }
}
