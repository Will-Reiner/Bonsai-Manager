import { postVisivel } from './carregar-posts';
import { comentarioDe } from '../dominio/montar';
import { codificarCursor } from '../repositories/filtros';
import type { ComentarioDTO, LeituraComunidadeRepository, PaginaDTO } from '../comunidade.types';

export const LIMITE_COMENTARIOS = 30;

export class ListarComentariosUseCase {
  constructor(private leitura: LeituraComunidadeRepository) {}

  async execute(viewerId: string, postId: string, cursor?: string): Promise<PaginaDTO<ComentarioDTO>> {
    await postVisivel(this.leitura, viewerId, postId);
    const lidos = await this.leitura.comentarios(postId, cursor, LIMITE_COMENTARIOS);
    const ultimo = lidos[lidos.length - 1];
    return {
      itens: lidos.map((c) => comentarioDe(c, viewerId)),
      proximoCursor: lidos.length === LIMITE_COMENTARIOS ? codificarCursor(ultimo.createdAt, ultimo.id) : null,
    };
  }
}
