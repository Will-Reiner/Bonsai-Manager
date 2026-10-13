import { carregarPosts, LIMITE_PAGINA } from './carregar-posts';
import { codificarCursor } from '../repositories/filtros';
import type { LeituraComunidadeRepository, PaginaDTO, PostDTO } from '../comunidade.types';

export class ListarSalvosUseCase {
  constructor(private leitura: LeituraComunidadeRepository) {}

  async execute(viewerId: string, cursor?: string): Promise<PaginaDTO<PostDTO>> {
    const lidos = await this.leitura.salvos(viewerId, cursor, LIMITE_PAGINA);
    const ultimo = lidos[lidos.length - 1];
    return {
      itens: await carregarPosts(this.leitura, lidos.map((s) => s.post), viewerId),
      proximoCursor: lidos.length === LIMITE_PAGINA ? codificarCursor(ultimo.createdAt, ultimo.post.id) : null,
    };
  }
}
