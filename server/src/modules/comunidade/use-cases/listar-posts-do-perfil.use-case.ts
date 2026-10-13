import { carregarPosts, LIMITE_PAGINA, pagina } from './carregar-posts';
import { podeVerPerfil } from '../dominio/visibilidade';
import { LeituraComunidadeRepository, NaoEncontrado, PaginaDTO, PostDTO } from '../comunidade.types';

export class ListarPostsDoPerfilUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(viewerId: string, usuarioId: string, cursor?: string): Promise<PaginaDTO<PostDTO>> {
    const p = await this.repo.perfil(usuarioId, viewerId);
    if (!p || !podeVerPerfil(p, viewerId)) throw new NaoEncontrado('Perfil não encontrado.');
    const lidos = await this.repo.postsDoUsuario(usuarioId, cursor, LIMITE_PAGINA);
    return pagina(await carregarPosts(this.repo, lidos, viewerId), lidos);
  }
}
