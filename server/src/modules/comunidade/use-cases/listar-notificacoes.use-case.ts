import { LIMITE_PAGINA } from './carregar-posts';
import { notificacaoDe } from '../dominio/montar';
import { codificarCursor } from '../repositories/filtros';
import type { LeituraComunidadeRepository, NotificacaoDTO, PaginaDTO } from '../comunidade.types';

export class ListarNotificacoesUseCase {
  constructor(private leitura: LeituraComunidadeRepository) {}

  async execute(viewerId: string, cursor?: string): Promise<PaginaDTO<NotificacaoDTO>> {
    const lidas = await this.leitura.notificacoes(viewerId, cursor, LIMITE_PAGINA);
    const ultima = lidas[lidas.length - 1];
    return {
      itens: lidas.map(notificacaoDe),
      proximoCursor: lidas.length === LIMITE_PAGINA ? codificarCursor(ultima.createdAt, ultima.id) : null,
    };
  }
}
