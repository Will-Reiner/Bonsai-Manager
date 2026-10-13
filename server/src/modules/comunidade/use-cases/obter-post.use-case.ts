import { carregarPosts } from './carregar-posts';
import { podeVer } from '../dominio/visibilidade';
import { LeituraComunidadeRepository, NaoEncontrado, PostDTO } from '../comunidade.types';

export class ObterPostUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(viewerId: string, id: string): Promise<PostDTO> {
    const post = await this.repo.post(id);
    if (!post || !podeVer(post.usuario, post.planta.plantaPublica, viewerId)) throw new NaoEncontrado('Post não encontrado.');
    const [dto] = await carregarPosts(this.repo, [post], viewerId);
    if (!dto) throw new NaoEncontrado('Post não encontrado.');
    return dto;
  }
}
