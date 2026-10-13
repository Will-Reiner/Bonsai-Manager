import { postVisivel } from './carregar-posts';
import type { InteracoesRepository, LeituraComunidadeRepository } from '../comunidade.types';

export class SalvarPostUseCase {
  constructor(
    private leitura: LeituraComunidadeRepository,
    private repo: InteracoesRepository,
  ) {}

  async execute(viewerId: string, postId: string, salvar: boolean): Promise<{ salvou: boolean }> {
    await postVisivel(this.leitura, viewerId, postId);
    if (salvar) await this.repo.salvar(viewerId, postId);
    else await this.repo.dessalvar(viewerId, postId);
    return { salvou: salvar };
  }
}
